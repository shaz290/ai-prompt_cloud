export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		/* ================= UPLOAD ================= */
		if (request.method === "POST" && url.pathname === "/upload") {
			const formData = await request.formData();
			const file = formData.get("file");

			if (!file) {
				return new Response("No file", { status: 400 });
			}

			const buffer = await file.arrayBuffer();
			const uuid = crypto.randomUUID();
			const key = `images/${uuid}.webp`;

			await env.ai_prompt_images.put(key, buffer, {
				httpMetadata: {
					contentType: "image/webp",
					cacheControl: "public, max-age=31536000, immutable",
				},
			});

			return Response.json({ path: `/${key}` });
		}

		/* ================= SERVE ================= */
		if (url.pathname.startsWith("/images/")) {
			const key = url.pathname.slice(1);
			const object = await env.ai_prompt_images.get(key);

			if (!object) {
				return new Response("Not found", { status: 404 });
			}

			return new Response(object.body, {
				headers: {
					"Content-Type": "image/webp",
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
		}

		return new Response("OK");
	},
};
