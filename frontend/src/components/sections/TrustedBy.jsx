import useScrollReveal from "../../hooks/useScrollReveal";

const COMPANIES = [
  "Linear", "Vercel", "Notion", "Figma", "Stripe", "Arc", "Raycast", "Pitch",
];

export default function TrustedBy() {
  const { ref, visible } = useScrollReveal(0.3);
  return (
    <section ref={ref} style={{ position:"relative", zIndex:1, padding:"clamp(32px,5vw,48px) clamp(16px,5vw,48px)", overflow:"hidden" }}>
      <div style={{ maxWidth:1120, margin:"0 auto", textAlign:"center", opacity: visible?1:0, transition:"opacity 0.8s ease" }}>
        <p style={{ fontSize:"0.7rem", fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:28, textTransform:"uppercase" }}>
          Trusted by teams at
        </p>
        <div className="trusted-gap" style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", alignItems:"center", gap:"clamp(20px,3vw,44px)" }}>
          {COMPANIES.map((name) => (
            <span
              key={name}
              style={{
                fontFamily:"'Sora',sans-serif",
                fontWeight:700,
                fontSize:"clamp(0.85rem,1.5vw,1.05rem)",
                color:"var(--text-muted)",
                letterSpacing:"-0.02em",
                transition:"color 0.3s",
                cursor:"default",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              {name}
            </span>
          ))}
        </div>
        <div style={{ marginTop:32, height:1, background:"linear-gradient(90deg,transparent,var(--border-primary),transparent)" }}/>
      </div>
    </section>
  );
}
