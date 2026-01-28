import { useEffect, useState } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(
          "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/me",
          { credentials: "include" }
        );

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data); // 👈 data.role MUST exist
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  return {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
  };
};
