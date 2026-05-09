import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const colors = {
    info: { bg: "rgba(77,238,234,0.1)", border: "rgba(77,238,234,0.3)", text: "#4DEEEA" },
    success: { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34D399" },
    error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
  };

  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "12px 24px",
      borderRadius: 12,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontFamily: "'Inter',sans-serif",
      fontSize: "0.9rem",
      fontWeight: 500,
      backdropFilter: "blur(10px)",
      transition: "all 0.3s ease",
    }}>
      {message}
    </div>
  );
}
