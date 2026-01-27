import { SignJWT, jwtVerify } from "jose";

/* =====================================================
   CORS CONFIG
   ===================================================== */

const allowedOrigins = [
    "https://ahsan-prompt.pages.dev",
    "http://localhost:5173",
];

function getCorsHeaders(request) {
    const origin = request.headers.get("Origin");
    if (origin && allowedOrigins.includes(origin)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        };
    }
    return {};
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
    async fetch(request, env) {
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
                        "Set-Cookie": `auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
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
                    "Set-Cookie": "auth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
                },
            });
        }

        /* =====================================================
           UPLOAD → R2
           POST /upload
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/upload") {
            const formData = await request.formData();
            const file = formData.get("file");
            if (!file) return new Response("File missing", { status: 400, headers: corsHeaders });

            const ext = file.name.split(".").pop();
            const key = `${crypto.randomUUID()}.${ext}`;

            await env.R2.put(key, file.stream(), {
                httpMetadata: { contentType: file.type },
            });

            return new Response(
                JSON.stringify({
                    image_url: `${env.R2_PUBLIC_URL}/${key}`,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
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
                        FROM descriptions d
                        LEFT JOIN image_urls i
                            ON i.description_id = d.id
                        ORDER BY d.created_on DESC
                        LIMIT ? OFFSET ?
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


        return new Response("Not Found", { status: 404, headers: corsHeaders });
    },
};
