import bcrypt from "bcryptjs";
import { signToken } from "../../_lib/jwt";

export async function onRequestPost({ request }) {
    const { email, password, name } = await request.json();

    if (!email || !password) {
        return new Response("Missing fields", { status: 400 });
    }

    const existing = await DB.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
    );

    if (existing) {
        return new Response("User already exists", { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        id: crypto.randomUUID(),
        email,
        password_hash: passwordHash,
        role: "user",
        status: "active",
    };

    await DB.query(
        `INSERT INTO users (id, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.email, user.password_hash, user.role, user.status]
    );

    const token = signToken(user);

    return new Response(
        JSON.stringify({ success: true }),
        {
            headers: {
                "Set-Cookie": `auth=${token};
          HttpOnly;
          Secure;
          SameSite=Lax;
          Path=/;
          Max-Age=604800`,
                "Content-Type": "application/json",
            },
        }
    );
}
