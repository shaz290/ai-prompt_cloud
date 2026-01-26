export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        /* =====================================================
           UPLOAD IMAGE → R2
           POST /upload
           ===================================================== */
        if (request.method === "POST" && url.pathname === "/upload") {
            try {
                const formData = await request.formData();
                const file = formData.get("file");

                if (!file) {
                    return new Response("File not found", { status: 400 });
                }

                const ext = file.name.split(".").pop();
                const imageName = crypto.randomUUID();
                const objectKey = `${imageName}.${ext}`;

                await env.R2.put(objectKey, file.stream(), {
                    httpMetadata: {
                        contentType: file.type,
                    },
                });

                return new Response(
                    JSON.stringify({
                        success: true,
                        image_name: imageName,
                        image_url: `${env.R2_PUBLIC_URL}/${objectKey}`,
                    }),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store",
                        },
                    }
                );
            } catch (err) {
                return new Response(
                    JSON.stringify({ error: err.message }),
                    { status: 500 }
                );
            }
        }

        /* =====================================================
           READ DATA FROM D1
           GET /api/descriptions
           ===================================================== */
        if (request.method === "GET" && url.pathname === "/api/descriptions") {
            try {
                const page = Number(url.searchParams.get("page") || 1);
                const pageSize = Number(url.searchParams.get("pageSize") || 7);
                const offset = (page - 1) * pageSize;

                /* ---------- TOTAL COUNT (for pagination UI) ---------- */
                const totalResult = await env.DB
                    .prepare(`SELECT COUNT(*) as total FROM descriptions`)
                    .first();

                const totalRecords = totalResult.total;
                const totalPages = Math.ceil(totalRecords / pageSize);

                /* ---------- PAGINATED DATA ---------- */
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

                /* ---------- GROUP IMAGES (Supabase-like shape) ---------- */
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
                            image_urls: []
                        });
                    }

                    if (row.image_url) {
                        map.get(row.id).image_urls.push({
                            image_url: `${env.R2_PUBLIC_URL}/${row.image_url}`
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
                            totalPages
                        }
                    }),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store"
                        }
                    }
                );

            } catch (err) {
                return new Response(
                    JSON.stringify({ error: err.message }),
                    { status: 500 }
                );
            }
        }

        /* =====================================================
           FALLBACK
           ===================================================== */
        return new Response("Not Found", { status: 404 });
    },
};
