import { useState } from "react";

export default function FeatureCard({ icon, title, desc, color, delay, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="feature-card"
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:20,
        padding:"2px",
        background: hov ? `linear-gradient(135deg,${color}55,transparent 60%)` : "transparent",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      <div style={{
        borderRadius:18,
        padding:"26px 22px",
        height:"100%",
        background: hov ? "var(--bg-secondary)" : "var(--bg-card)",
        border:`1px solid ${hov ? color+"44" : "var(--border-primary)"}`,
        backdropFilter:"blur(16px)",
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.45), 0 0 30px ${color}18` : "0 4px 24px rgba(0,0,0,0.22)",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          width:44, height:44, borderRadius:14,
          background:`${color}12`, border:`1px solid ${color}28`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"1.2rem", marginBottom:18,
          transition:"transform 0.3s cubic-bezier(.16,1,.3,1)",
          transform: hov ? "scale(1.12) rotate(-5deg)" : "scale(1)",
          boxShadow: hov ? `0 0 20px ${color}30` : "none",
        }}>{icon}</div>
        <h3 style={{ fontFamily:"'Sora',cursive", fontWeight:700, fontSize:"1rem", color: "var(--text-primary)", marginBottom:10, transition:"color 0.2s" }}>{title}</h3>
        <p style={{ fontSize:"0.875rem", lineHeight:1.65, color:"var(--text-secondary)" }}>{desc}</p>
      </div>
    </div>
  );
}
