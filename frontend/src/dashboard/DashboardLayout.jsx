import { Link, Outlet, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "../components/LogoIcon";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", icon: "🏠" },
  { path: "/dashboard/digest", label: "Today's Digest", icon: "📰" },
  { path: "/dashboard/archive", label: "Archive", icon: "📁" },
  { path: "/dashboard/insights", label: "Insights", icon: "📊" },
  { path: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { path: "/dashboard/profile", label: "Profile", icon: "👤" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { theme, toggleTheme } = useTheme();

  // Track screen size reactively
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // auto-close drawer on resize up
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const isActive = (path) => location.pathname === path;

  // Sidebar content extracted so we can render it in both desktop + mobile contexts
  const SidebarContent = ({ mobile = false }) => (
    <aside style={{
      width: mobile ? 260 : (collapsed ? 72 : 240),
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--border-primary)",
      display: "flex",
      flexDirection: "column",
      padding: "20px 0",
      transition: mobile ? "none" : "width 0.3s ease",
      flexShrink: 0,
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-primary)", marginBottom: 12 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <LogoIcon size={mobile || !collapsed ? 32 : 28} />
          {(mobile || !collapsed) && (
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
              NeuroFlow
            </span>
          )}
        </Link>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}
          >✕</button>
        )}
      </div>

      {/* Collapse Toggle — desktop only */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            alignSelf: collapsed ? "center" : "flex-end",
            marginRight: collapsed ? 0 : 12,
            marginBottom: 12,
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.9rem",
            padding: collapsed ? "0 10px" : "0 12px",
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      )}

      {/* Nav Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px", flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              textDecoration: "none",
              color: isActive(item.path) ? "#4DEEEA" : "var(--text-secondary)",
              background: isActive(item.path) ? "rgba(77,238,234,0.08)" : "transparent",
              border: isActive(item.path) ? "1px solid rgba(77,238,234,0.15)" : "1px solid transparent",
              transition: "all 0.2s",
              fontSize: "0.9rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) e.currentTarget.style.background = "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
            {(mobile || !collapsed) && item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid rgba(77,238,234,0.2)",
            background: "rgba(77,238,234,0.05)",
            color: theme === "dark" ? "#fbbf24" : "#64748b",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed && !mobile ? "center" : "flex-start",
            gap: 8,
            fontFamily: "'Inter',sans-serif",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{theme === "dark" ? "☀" : "☾"}</span>
          {(mobile || !collapsed) && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.05)",
            color: "#ef4444",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Inter',sans-serif",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {(mobile || !collapsed) && "Logout"}
        </button>
      </div>

      {/* User Email */}
      {(mobile || !collapsed) && (
        <div style={{ padding: "12px 16px 0", borderTop: "1px solid var(--border-primary)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'Inter',sans-serif" }}>

      {/* ── MOBILE: hamburger topbar ── */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: 56,
          background: "var(--sidebar-bg)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          zIndex: 50,
        }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontSize: "1.4rem", lineHeight: 1, padding: 4 }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <LogoIcon size={28} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>NeuroFlow</span>
          </Link>
        </div>
      )}

      {/* ── MOBILE: dark overlay ── */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          style={{ display: "block" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: 260,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 60,
        }}>
          <SidebarContent mobile={true} />
        </div>
      )}

      {/* ── DESKTOP: static sidebar ── */}
      {!isMobile && <SidebarContent mobile={false} />}

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        overflow: "auto",
        minWidth: 0, // prevent flex blowout
        marginTop: isMobile ? 56 : 0, // offset for mobile topbar
      }}>
        <Outlet />
      </main>
    </div>
  );
}
