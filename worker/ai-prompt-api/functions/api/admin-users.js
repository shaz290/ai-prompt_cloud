import { verifyToken } from "../_lib/jwt";

export async function onRequest({ request }) {
    const cookie = request.headers.get("Cookie") || "";
    const token = cookie
        .split("; ")
        .find(v => v.startsWith("auth="))
        ?.split("=")[1];

    if (!token) return new Response("Unauthorized", { status: 401 });

    const payload = verifyToken(token);

    if (payload.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }

    const users = await DB.query("SELECT id, email, role FROM users");

    return Response.json(users);
}
