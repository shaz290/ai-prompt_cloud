export async function getUserByEmail(email) {
    return DB.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );
}
