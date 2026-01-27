import { useEffect, useState } from "react";
import { API_BASE } from "@/config/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/me`, {
      credentials: "include",
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
    loading,
  };
};
