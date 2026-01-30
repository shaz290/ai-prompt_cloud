import { SignJWT, jwtVerify } from "jose";

/* =====================================================
   CORS CONFIG
   ===================================================== */

const allowedOrigins = [
    "https://ahsan-prompt.pages.dev",
    "https://ai-prompt-web.pages.dev",
    "http://localhost:5173",
];

// function getCorsHeaders(request) {
//     const origin = request.headers.get("Origin");
//     if (origin && allowedOrigins.includes(origin)) {
//         return {
//             "Access-Control-Allow-Origin": origin,
//             "Access-Control-Allow-Credentials": "true",
//             "Access-Control-Allow-Headers": "Content-Type",
//             "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//         };
//     }
//     return {};
// }

function getCookieOptions(request) {
    const origin = request.headers.get("Origin") || "";
    const isLocalhost = origin.startsWith("http://localhost");

    return isLocalhost
        ? "HttpOnly; SameSite=Lax; Path=/; Max-Age=604800"
        : "HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800";
}

function getCorsHeaders(request) {
    const origin = request.headers.get("Origin");
    if (origin && allowedOrigins.includes(origin)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        };
    }
    return {};
}


/* =====================================================
   GOOGLE TOKEN VERIFY (WORKER SAFE)
   ===================================================== */

async function verifyGoogleToken(idToken, env) {
    const res = await fetch(
        "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(idToken)
    );

    const payload = await res.json();

    if (!res.ok) {
        throw new Error(payload.error_description || "Invalid Google token");
    }

    // ✅ ACCEPT aud OR azp
    const validAudience =
        payload.aud === env.GOOGLE_CLIENT_ID ||
        payload.azp === env.GOOGLE_CLIENT_ID;

    if (!validAudience) {
        throw new Error(
            `Audience mismatch: aud=${payload.aud}, azp=${payload.azp}`
        );
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
}



/* =====================================================
   JWT HELPERS (WORKER SAFE)
   ===================================================== */

const encoder = new TextEncoder();

async function signToken(user, env) {
    return await new SignJWT({
        email: user.email,
        role: user.role,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encoder.encode(env.JWT_SECRET));
}

async function verifyToken(token, env) {
    const { payload } = await jwtVerify(
        token,
        encoder.encode(env.JWT_SECRET)
    );

    return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
    };
}

function getAuthToken(request) {
    const cookie = request.headers.get("Cookie") || "";
    return cookie
        .split("; ")
        .find(c => c.startsWith("auth="))
        ?.split("=")[1];
}

/* =====================================================
   PASSWORD HASH (SHA-256)
   ===================================================== */

async function hashPassword(password) {
    const buffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(password)
    );
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

/* =====================================================
   WORKER
   ===================================================== */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = getCorsHeaders(request);

        /* ===============================
           PREFLIGHT
           =============================== */
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        /* =====================================================
           SIGNUP
           POST /api/signup
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/signup") {
            try {
                const { email, password } = await request.json();

                if (!email || !password) {
                    return new Response("Missing fields", { status: 400, headers: corsHeaders });
                }

                const exists = await env.DB
                    .prepare("SELECT id FROM users WHERE email = ?")
                    .bind(email)
                    .first();

                if (exists) {
                    return new Response("User already exists", { status: 409, headers: corsHeaders });
                }

                const id = crypto.randomUUID();
                const passwordHash = await hashPassword(password);

                await env.DB
                    .prepare(`
            INSERT INTO users (id, email, password_hash, role, status)
            VALUES (?, ?, ?, 'user', 'active')
          `)
                    .bind(id, email, passwordHash)
                    .run();

                const token = await signToken({ id, email, role: "user" }, env);

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Set-Cookie": `auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
                    },
                });
            } catch (e) {
                return new Response(e.message, { status: 500, headers: corsHeaders });
            }
        }

        /* =====================================================
           LOGIN
           POST /api/login
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/login") {
            try {
                const { email, password } = await request.json();

                const user = await env.DB
                    .prepare(`
            SELECT id, email, password_hash, role, status
            FROM users WHERE email = ?
          `)
                    .bind(email)
                    .first();

                if (!user || user.status !== "active") {
                    return new Response("Invalid credentials", { status: 401, headers: corsHeaders });
                }

                const passwordHash = await hashPassword(password);
                if (passwordHash !== user.password_hash) {
                    return new Response("Invalid credentials", { status: 401, headers: corsHeaders });
                }

                const token = await signToken(user, env);

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Set-Cookie": `auth=${token}; HttpOnly; Secure; SameSite=none; Path=/; Max-Age=604800`,
                    },
                });
            } catch (e) {
                return new Response(e.message, { status: 500, headers: corsHeaders });
            }
        }

        /* =====================================================
           CURRENT USER
           GET /api/me
           ===================================================== */
        if (request.method === "GET" && url.pathname === "/api/me") {
            try {
                const token = getAuthToken(request);
                if (!token) {
                    return new Response(null, { status: 401, headers: corsHeaders });
                }

                const user = await verifyToken(token, env);

                return new Response(JSON.stringify(user), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch {
                return new Response(null, { status: 401, headers: corsHeaders });
            }
        }

        /* =====================================================
           LOGOUT
           POST /api/logout
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/logout") {
            return new Response("ok", {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Set-Cookie": [
                        "auth=;",
                        "HttpOnly",
                        "Secure",
                        "SameSite=None",
                        "Path=/",
                        "Max-Age=0",
                        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    ].join("; "),
                },
            });
        }


        /* =====================================================
           UPLOAD → R2
           POST /upload
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/upload") {
            try {
                const token = getAuthToken(request);
                if (!token) {
                    return new Response("Unauthorized", {
                        status: 401,
                        headers: corsHeaders,
                    });
                }

                const user = await verifyToken(token, env);
                if (user.role !== "admin") {
                    return new Response("Forbidden", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                const formData = await request.formData();
                const file = formData.get("file");

                if (!file) {
                    return new Response("No file", {
                        status: 400,
                        headers: corsHeaders,
                    });
                }

                const buffer = await file.arrayBuffer();
                const uuid = crypto.randomUUID();
                const key = `images/${uuid}.webp`;

                await env.IMAGES.put(key, buffer, {
                    httpMetadata: {
                        contentType: file.type || "image/webp",
                        cacheControl: "public, max-age=31536000, immutable",
                    },
                });


                return new Response(
                    JSON.stringify({ path: key }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            } catch (err) {
                console.error("UPLOAD ERROR:", err);

                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }

        /* =====================================================
           DESCRIPTIONS
           GET /api/descriptions
           ===================================================== */
        if (request.method === "GET" && url.pathname === "/api/descriptions") {
            try {

                const page = Number(url.searchParams.get("page") || 1);
                const pageSize = Number(url.searchParams.get("pageSize") || 7);
                const offset = (page - 1) * pageSize;

                const totalResult = await env.DB
                    .prepare(`SELECT COUNT(*) as total FROM descriptions`)
                    .first();

                const totalRecords = totalResult.total;
                const totalPages = Math.ceil(totalRecords / pageSize);

                const { results } = await env.DB
                    .prepare(`
            SELECT
                d.id,
                d.image_name,
                d.image_type,
                d.description_details,
                d.priority,
                d.created_on,
                i.image_url
            FROM (
                SELECT id, image_name, image_type, description_details, priority, created_on
                FROM descriptions
                ORDER BY created_on DESC
                LIMIT ? OFFSET ?
            ) d
            LEFT JOIN image_urls i
                ON i.description_id = d.id
            ORDER BY d.created_on DESC
        `)
                    .bind(pageSize, offset)
                    .all();

                const map = new Map();

                for (const row of results) {
                    if (!map.has(row.id)) {
                        map.set(row.id, {
                            id: row.id,
                            image_name: row.image_name,
                            image_type: row.image_type,
                            description_details: row.description_details,
                            priority: row.priority,
                            created_on: row.created_on,
                            image_urls: [],
                        });
                    }

                    if (row.image_url) {
                        map.get(row.id).image_urls.push({
                            image_url: `${env.R2_PUBLIC_URL}/${row.image_url}`,
                        });
                    }
                }

                const data = Array.from(map.values());

                return new Response(
                    JSON.stringify({
                        data,
                        pagination: {
                            page,
                            pageSize,
                            totalRecords,
                            totalPages,
                        },
                    }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store",
                        },
                    }
                );
            } catch (err) {
                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }

        //     if (request.method === "GET" && url.pathname === "/api/descriptions") {
        //         const page = Number(url.searchParams.get("page") || 1);
        //         const pageSize = Number(url.searchParams.get("pageSize") || 7);

        //         const SHOULD_CACHE =
        //             pageSize === 7 && page >= 1 && page <= 5; // 👈 ONLY FIRST 35 RECORDS

        //         const cache = caches.default;
        //         const cacheKey = new Request(url.toString(), request);

        //         // ===============================
        //         // 1️⃣ TRY CACHE (ONLY FOR PAGE 1–5)
        //         // ===============================
        //         if (SHOULD_CACHE) {
        //             const cachedResponse = await cache.match(cacheKey);
        //             if (cachedResponse) {
        //                 console.log("return from cache");
        //                 return cachedResponse;
        //             }
        //         }

        //         // ===============================
        //         // 2️⃣ DB FETCH
        //         // ===============================
        //         try {
        //             const offset = (page - 1) * pageSize;

        //             const totalResult = await env.DB
        //                 .prepare(`SELECT COUNT(*) as total FROM descriptions`)
        //                 .first();

        //             const totalRecords = totalResult.total;
        //             const totalPages = Math.ceil(totalRecords / pageSize);

        //             const { results } = await env.DB
        //                 .prepare(`
        //     SELECT
        //         d.id,
        //         d.image_name,
        //         d.image_type,
        //         d.description_details,
        //         d.priority,
        //         d.created_on,
        //         i.image_url
        //     FROM (
        //         SELECT id, image_name, image_type, description_details, priority, created_on
        //         FROM descriptions
        //         ORDER BY created_on DESC
        //         LIMIT ? OFFSET ?
        //     ) d
        //     LEFT JOIN image_urls i
        //         ON i.description_id = d.id
        //     ORDER BY d.created_on DESC
        // `)
        //                 .bind(pageSize, offset)
        //                 .all();

        //             const map = new Map();

        //             for (const row of results) {
        //                 if (!map.has(row.id)) {
        //                     map.set(row.id, {
        //                         id: row.id,
        //                         image_name: row.image_name,
        //                         image_type: row.image_type,
        //                         description_details: row.description_details,
        //                         priority: row.priority,
        //                         created_on: row.created_on,
        //                         image_urls: [],
        //                     });
        //                 }

        //                 if (row.image_url) {
        //                     map.get(row.id).image_urls.push({
        //                         image_url: `${env.R2_PUBLIC_URL}/${row.image_url}`,
        //                     });
        //                 }
        //             }

        //             const data = Array.from(map.values());

        //             const response = new Response(
        //                 JSON.stringify({
        //                     data,
        //                     pagination: {
        //                         page,
        //                         pageSize,
        //                         totalRecords,
        //                         totalPages,
        //                     },
        //                 }),
        //                 {
        //                     status: 200,
        //                     headers: {
        //                         ...corsHeaders,
        //                         "Content-Type": "application/json",

        //                         // ✅ CACHE ONLY FIRST 5 PAGES
        //                         "Cache-Control": SHOULD_CACHE
        //                             ? "public, max-age=0, s-maxage=600, stale-while-revalidate=120"
        //                             : "no-store",
        //                     },
        //                 }
        //             );

        //             // ===============================
        //             // 3️⃣ SAVE TO CACHE (ONLY PAGE 1–5)
        //             // ===============================
        //             if (SHOULD_CACHE) {
        //                 ctx.waitUntil(cache.put(cacheKey, response.clone()));
        //             }
        //             console.log("return from DB");
        //             return response;
        //         } catch (err) {
        //             return new Response(
        //                 JSON.stringify({ error: err.message }),
        //                 {
        //                     status: 500,
        //                     headers: {
        //                         ...corsHeaders,
        //                         "Content-Type": "application/json",
        //                     },
        //                 }
        //             );
        //         }
        //     }


        /* =====================================================
           CREATE DESCRIPTION
           POST /api/description
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/description") {
            try {
                /* ---------- AUTH ---------- */
                const token = getAuthToken(request);
                if (!token) {
                    return new Response("Unauthorized", {
                        status: 401,
                        headers: corsHeaders,
                    });
                }

                const user = await verifyToken(token, env);
                if (user.role !== "admin") {
                    return new Response("Forbidden", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                /* ---------- BODY ---------- */
                const body = await request.json();

                const image_name = body.image_name?.trim();
                const image_type = body.image_type?.trim();
                const description_details = body.description_details?.trim();

                const priority = Number.isInteger(Number(body.priority))
                    ? Number(body.priority)
                    : 0;

                if (!image_name || !image_type || !description_details) {
                    return new Response("Missing fields", {
                        status: 400,
                        headers: corsHeaders,
                    });
                }

                /* ---------- REQUIRED FIELD ---------- */
                const created_on = Date.now();

                /* ---------- INSERT ---------- */
                const result = await env.DB.prepare(`
            INSERT INTO descriptions (
                image_name,
                image_type,
                description_details,
                created_on,
                priority
            )
            VALUES (?, ?, ?, ?, ?)
        `)
                    .bind(
                        image_name,
                        image_type,
                        description_details,
                        created_on,
                        priority
                    )
                    .run();

                const id = result.meta.last_row_id;

                /* ---------- RESPONSE ---------- */
                return new Response(
                    JSON.stringify({ id }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            } catch (err) {
                console.error("CREATE DESCRIPTION ERROR:", err);

                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }


        /* =====================================================
        IMAGE URLS
        POST /api/imageUrls
        ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/imageUrls") {
            try {
                /* ---------- AUTH ---------- */
                const token = getAuthToken(request);
                if (!token) {
                    return new Response("Unauthorized", {
                        status: 401,
                        headers: corsHeaders,
                    });
                }

                const user = await verifyToken(token, env);
                if (user.role !== "admin") {
                    return new Response("Forbidden", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                /* ---------- BODY ---------- */
                const { description_id, image_url } = await request.json();

                if (!description_id || !image_url) {
                    return new Response(
                        JSON.stringify({ error: "Missing fields" }),
                        {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                /* ---------- INSERT ---------- */
                const created_on = Date.now();

                await env.DB.prepare(`
    INSERT INTO image_urls (
        description_id,
        image_url,
        created_on
    )
    VALUES (?, ?, ?)
`)
                    .bind(description_id, image_url, created_on)
                    .run();

                /* ---------- RESPONSE ---------- */
                return new Response(
                    JSON.stringify({ success: true }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );

            } catch (err) {
                console.error("IMAGE URL ERROR:", err);

                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }


        /* =====================================================
        DELETE DESCRIPTION + R2 IMAGES
        POST /api/delete-description
        ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/delete-description") {
            try {
                /* ---------- AUTH ---------- */
                const token = getAuthToken(request);
                if (!token) {
                    return new Response("Unauthorized", {
                        status: 401,
                        headers: corsHeaders,
                    });
                }

                const user = await verifyToken(token, env);
                if (user.role !== "admin") {
                    return new Response("Forbidden", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                /* ---------- BODY ---------- */
                const { description_id } = await request.json();
                if (!description_id) {
                    return new Response(
                        JSON.stringify({ error: "description_id is required" }),
                        {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                /* ---------- FETCH IMAGE URLS ---------- */
                const { results: images } = await env.DB
                    .prepare(`
                SELECT image_url
                FROM image_urls
                WHERE description_id = ?
            `)
                    .bind(description_id)
                    .all();

                /* ---------- HELPER: URL → R2 KEY ---------- */
                const extractR2Key = (value) => {
                    if (!value) return null;

                    // Already a path
                    if (!value.startsWith("http")) {
                        return value.replace(/^\/+/, "");
                    }

                    // Full URL → strip base
                    return value.replace(`${env.R2_PUBLIC_URL}/`, "");
                };

                /* ---------- DELETE FROM R2 ---------- */
                for (const img of images) {
                    const key = extractR2Key(img.image_url);
                    if (!key) continue;

                    try {
                        await env.IMAGES.delete(key);
                    } catch (err) {
                        console.warn("R2 delete failed:", key, err);
                    }
                }

                /* ---------- DELETE DB RECORDS ---------- */
                await env.DB
                    .prepare(`DELETE FROM image_urls WHERE description_id = ?`)
                    .bind(description_id)
                    .run();

                await env.DB
                    .prepare(`DELETE FROM descriptions WHERE id = ?`)
                    .bind(description_id)
                    .run();

                /* ---------- RESPONSE ---------- */
                return new Response(
                    JSON.stringify({ success: true }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );

            } catch (err) {
                console.error("DELETE DESCRIPTION ERROR:", err);

                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }

        /* =====================================================
        UPDATE DESCRIPTION
        PUT /api/description
        ===================================================== */
        if (request.method === "PUT" && url.pathname === "/api/description") {
            try {
                /* ---------- AUTH ---------- */
                const token = getAuthToken(request);
                if (!token) {
                    return new Response("Unauthorized", {
                        status: 401,
                        headers: corsHeaders,
                    });
                }

                const user = await verifyToken(token, env);
                if (user.role !== "admin") {
                    return new Response("Forbidden", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                /* ---------- BODY ---------- */
                const { id, description_details } = await request.json();

                if (!id || !description_details?.trim()) {
                    return new Response(
                        JSON.stringify({ error: "Missing fields" }),
                        {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                /* ---------- UPDATE ---------- */
                await env.DB.prepare(`
            UPDATE descriptions
            SET description_details = ?
            WHERE id = ?
        `)
                    .bind(description_details.trim(), id)
                    .run();


                /* ---------- RESPONSE ---------- */
                return new Response(
                    JSON.stringify({ success: true }),
                    {
                        status: 200,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );

            } catch (err) {
                console.error("UPDATE DESCRIPTION ERROR:", err);

                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }
        /* =====================================================
           GOOGLE LOGIN
           POST /api/auth/google
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/api/auth/google") {
            try {
                const body = await request.json();
                const token = body?.token;

                if (!token) {
                    return new Response("Missing Google token", {
                        status: 400,
                        headers: corsHeaders,
                    });
                }

                // 🔐 Verify Google ID token
                const googleUser = await verifyGoogleToken(token, env);
                const { email, googleId, picture, name } = googleUser;

                // 🔍 Find existing user by email
                let user = await env.DB
                    .prepare(`
        SELECT id, email, role, status
        FROM users
        WHERE email = ?
      `)
                    .bind(email)
                    .first();

                // 🆕 Create user if not exists
                if (!user) {
                    const id = crypto.randomUUID();

                    // IMPORTANT:
                    // password_hash is NOT NULL in your table
                    // so we must insert an empty string
                    await env.DB
                        .prepare(`
          INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            role,
            status,
            google_id,
            auth_provider,
            avatar_url
          )
          VALUES (?, ?, '', ?, 'user', 'active', ?, 'google', ?)
        `)
                        .bind(id, email, name ?? null, googleId, picture ?? null)
                        .run();

                    user = {
                        id,
                        email,
                        role: "user",
                        status: "active",
                    };
                }

                // 🚫 Block disabled users
                if (user.status !== "active") {
                    return new Response("Account disabled", {
                        status: 403,
                        headers: corsHeaders,
                    });
                }

                // 🔐 Issue JWT (same as email login)
                const jwtToken = await signToken(user, env);

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Set-Cookie": `auth=${jwtToken}; ${getCookieOptions(request)}`,
                    },
                });
            } catch (err) {
                console.error("GOOGLE AUTH ERROR:", err);

                // IMPORTANT: return 500 so real errors are visible during dev
                return new Response(
                    JSON.stringify({ error: err.message }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }




        return new Response("Not Found", { status: 404, headers: corsHeaders });
    },
};

