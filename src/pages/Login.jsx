import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // EMAIL / PASSWORD LOGIN
  // -----------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/login",
        {
          method: "POST",
          credentials: "include", // 🔐 cookie auth
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // GOOGLE LOGIN
  // -----------------------------
  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);

    console.log("Google credential:", credentialResponse);

    if (!credentialResponse?.credential) {
      alert("No Google token received");
      return;
    }

    setError("");

    try {
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

      if (!res.ok) {
        throw new Error(await res.text());
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md p-8 rounded-3xl space-y-6 border"
      >
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Login
        </h1>



        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border"
        />

        {/* EMAIL LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* DIVIDER */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* GOOGLE LOGIN */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError("Google login failed")}
          />
        </div>

        {/* SIGN UP */}
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
