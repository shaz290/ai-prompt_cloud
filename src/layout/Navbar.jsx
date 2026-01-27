import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#mydetails", label: "My Creations" },
  { href: "/upload", label: "Upload" },
  { href: "#contact", label: "Contact Me" },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 forces auth re-check even when route doesn't change
  const [authVersion, setAuthVersion] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  /* ---------- SCROLL ---------- */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- AUTH CHECK (COOKIE) ---------- */
  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/me",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [location.pathname, authVersion]); // ✅ BOTH ARE IMPORTANT

  /* ---------- NAV ---------- */
  const handleNavClick = (e, link) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (!link.href.startsWith("#")) {
      navigate(link.href);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document
          .querySelector(link.href)
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document
        .querySelector(link.href)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = () => {
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await fetch(
      "https://ai-prompt-api.aipromptweb-caa.workers.dev/api/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    setUser(null);
    setIsMobileMenuOpen(false);

    // 🔥 FORCE AUTH RE-CHECK
    setAuthVersion(v => v + 1);

    navigate("/", { replace: true });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "glass-strong py-3 border-b border-blue-500/30 shadow-[0_6px_20px_rgba(59,130,246,0.35)]"
        : "bg-transparent py-5"
        }`}
    >
      {/* ================= NAVBAR ================= */}
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, { href: "#home" })}
          className="text-xl font-bold"
        >
          ASH<span className="text-primary">.</span>
        </a>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-4">
          <div className="glass rounded-full px-2 py-1 flex gap-1">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="px-4 py-2 text-sm rounded-full hover:bg-surface"
              >
                {link.label}
              </a>
            ))}
          </div>

          {!loading &&
            (user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 border rounded-xl"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-primary text-white rounded-xl"
              >
                Login
              </button>
            ))}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(p => !p)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* ================= MOBILE MENU ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-strong">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="text-lg py-2"
              >
                {link.label}
              </a>
            ))}

            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 rounded-xl border"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="py-3 rounded-xl bg-primary text-white"
                >
                  Login
                </button>
              ))}
          </div>
        </div>
      )}
    </header>
  );
};
