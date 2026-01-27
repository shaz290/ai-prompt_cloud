export async function onRequestPost() {
    return new Response("ok", {
        headers: {
            "Set-Cookie": `auth=;
        HttpOnly;
        Secure;
        SameSite=Lax;
        Path=/;
        Max-Age=0`,
        },
    });
}
