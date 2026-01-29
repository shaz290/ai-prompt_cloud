import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE } from "@/config/api";

export const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/login",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed Please try later");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 GOOGLE LOGIN HANDLER
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");

      const res = await fetch(
        "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/auth/google",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: credentialResponse.credential,
          }),
        }
      );

      if (!res.ok) throw new Error("Google login failed");

      navigate("/");
    } catch (err) {
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md p-8 rounded-3xl space-y-6 border"
      >
        <h1 className="text-3xl font-bold text-center">Login</h1>

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
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* 🔹 Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* 🔹 GOOGLE LOGIN BUTTON */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p className="text-center text-sm">
          Don’t have an account?{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>
      </form>
    </div>
  );
};
