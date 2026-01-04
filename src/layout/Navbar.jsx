import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

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

  const location = useLocation();
  const navigate = useNavigate();

  /* ---------- SCROLL ---------- */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        const el = document.querySelector(link.href);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.querySelector(link.href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = () => {
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  /* ---------- LOGOUT (WORKING) ---------- */
  const handleLogout = async () => {
    console.log("LOGOUT CLICKED ✅");

    setIsMobileMenuOpen(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      return;
    }

    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "glass-strong py-3" : "bg-transparent py-5"
      }`}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, { href: "#home" })}
          className="text-xl font-bold hover:text-primary"
        >
          ASH<span className="text-primary">.</span>
        </a>

        {/* DESKTOP */}
        <div className="hidden md:flex items-center gap-4">
          <div className="glass rounded-full px-2 py-1 flex gap-1">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="px-4 py-2 text-sm hover:bg-surface rounded-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-surface"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="px-4 py-2 text-sm rounded-xl bg-primary text-white"
            >
              Login
            </button>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen((p) => !p)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* MOBILE MENU */}
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

            {user ? (
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
            )}
          </div>
        </div>
      )}
    </header>
  );
};
