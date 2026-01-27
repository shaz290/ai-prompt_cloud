import { verifyToken } from "../_lib/jwt";

export async function onRequest({ request }) {
    try {
        const cookie = request.headers.get("Cookie") || "";
        const token = cookie
            .split("; ")
            .find(v => v.startsWith("auth="))
            ?.split("=")[1];

        if (!token) return new Response(null, { status: 401 });

        const payload = verifyToken(token);

        return Response.json({
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        });
    } catch {
        return new Response(null, { status: 401 });
    }
}
