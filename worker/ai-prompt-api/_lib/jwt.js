import jwt from "jsonwebtoken";

const JWT_SECRET = JWT_SECRET_FROM_ENV;

export function signToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
