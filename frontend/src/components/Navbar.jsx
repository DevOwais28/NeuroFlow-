import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "./LogoIcon";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Results", id: "metrics" },
  { label: "Pricing", id: "pricing" },
];

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: scrolled ? "10px 24px" : "18px 24px",
        background: scrolled ? "var(--bg-primary)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--border-primary)" : "transparent"}`,
        transition: "padding 0.4s ease, background 0.4s ease, border-color 0.4s ease",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <LogoIcon size={32} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              NeuroFlow
            </span>
          </Link>

          <nav
            className="nav-center-pills"
            style={{
              alignItems: "center", gap: 2,
              padding: "5px 8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: 100,
              backdropFilter: "blur(12px)",
            }}
          >
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="nav-link"
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  padding: "8px 14px",
                  borderRadius: 100,
                  cursor: "pointer",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
              >{link.label}</button>
            ))}
          </nav>

          <div
            className="nav-right-btns"
            style={{ alignItems: "center", gap: 14, flexShrink: 0 }}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                cursor: "pointer", transition: "all 0.2s ease",
                color: theme === "dark" ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <Link to="/login" style={{
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.875rem",
              color: "var(--text-muted)", textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              Log In
            </Link>
            <Link to="/signup" className="glow-btn" style={{
              fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.875rem",
              color: "var(--bg-primary)",
              padding: "9px 22px", borderRadius: 100, border: "none",
              background: "linear-gradient(135deg,#4DEEEA,#34D399)",
              boxShadow: "0 0 22px rgba(77,238,234,0.35)",
              whiteSpace: "nowrap",
              textDecoration: "none",
              display: "inline-block",
            }}>
              Create Account
            </Link>
          </div>

          <button
            ref={hamburgerRef}
            className="nav-hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
            style={{
              alignItems: "center", justifyContent: "center",
              padding: 9, borderRadius: 10, border: "none", cursor: "pointer",
              background: open ? "var(--bg-card-hover)" : "var(--bg-card)",
              color: open ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="7"  x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
              }
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div
          ref={menuRef}
          className="mobile-menu-overlay"
          style={{
            position: "fixed",
            top: 68, left: 12, right: 12,
            zIndex: 199,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: 20,
            padding: "10px",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow: "0 28px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(77,238,234,0.04)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => { scrollTo(link.id); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", borderRadius: 12,
                  fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9375rem",
                  color: "var(--text-secondary)", background: "none", border: "none",
                  cursor: "pointer",
                  transition: "background 0.18s, color 0.18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >{link.label}</button>
            ))}
          </div>
          <div style={{ height: 1, background: "var(--border-primary)", margin: "10px 0" }} />

          {/* Mobile Theme Toggle */}
          <button
            onClick={() => { toggleTheme(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: "transparent", border: "1px solid var(--border-primary)",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9375rem",
              color: theme === "dark" ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {theme === "dark" ? (
              <><span>☀</span> <span>Light Mode</span></>
            ) : (
              <><span>☾</span> <span>Dark Mode</span></>
            )}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link to="/login" onClick={() => setOpen(false)} style={{
              padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-primary)",
              background: "transparent",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9375rem", color: "var(--text-secondary)",
              textDecoration: "none", textAlign: "center",
              transition: "background 0.18s, color 0.18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >Log In</Link>
            <Link to="/signup" onClick={() => setOpen(false)} style={{
              padding: "13px 16px", borderRadius: 12, border: "none",
              fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "var(--bg-primary)",
              background: "linear-gradient(135deg,#4DEEEA,#34D399)",
              boxShadow: "0 0 22px rgba(77,238,234,0.28)",
              textDecoration: "none", textAlign: "center",
            }}>Create Account</Link>
          </div>
        </div>
      )}
    </>
  );
}
