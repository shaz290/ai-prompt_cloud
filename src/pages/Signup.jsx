import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "@/config/api";

export const Signup = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/signup`, {
                method: "POST",
                credentials: "include", // 🔐 cookie
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            navigate("/");
        } catch (err) {
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <form
                onSubmit={handleSignup}
                className="w-full max-w-md p-8 rounded-3xl space-y-6 border"
            >
                <h1 className="text-3xl font-bold text-center">Sign Up</h1>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border"
                />

                <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border"
                />

                <button
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-black text-white disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Account"}
                </button>

                <p className="text-center text-sm">
                    Already have an account?{" "}
                    <span
                        className="underline cursor-pointer"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </span>
                </p>
            </form>
        </div>
    );
};
