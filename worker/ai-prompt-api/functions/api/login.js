import { signToken } from "../_lib/jwt";
import { getUserByEmail } from "../_lib/db";
import bcrypt from "bcryptjs";

export async function onRequestPost({ request }) {
    const { email, password } = await request.json();

    const user = await getUserByEmail(email);
    if (!user) {
        return new Response("Invalid credentials", { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return new Response("Invalid credentials", { status: 401 });
    }

    if (user.status !== "active") {
        return new Response("User blocked", { status: 403 });
    }

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
