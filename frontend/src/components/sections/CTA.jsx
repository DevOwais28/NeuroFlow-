import useScrollReveal from "../../hooks/useScrollReveal";

export default function CTA() {
  const { ref, visible } = useScrollReveal(0.15);
  return (
    <section id="pricing" ref={ref} style={{ position:"relative", zIndex:1, padding:"0 clamp(16px,5vw,48px) clamp(80px,12vw,120px)" }}>
      <div style={{ maxWidth:760, margin:"0 auto", opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(30px)", transition:"all 0.8s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{
          borderRadius:32, padding:"clamp(52px,8vw,84px) clamp(28px,6vw,68px)", textAlign:"center",
          position:"relative", overflow:"hidden",
          background:"var(--bg-card)", border:"1px solid var(--border-primary)",
          backdropFilter:"blur(28px)",
          boxShadow:"0 0 90px rgba(77,238,234,0.07),inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(77,238,234,0.07) 0%,transparent 65%)",pointerEvents:"none" }}/>
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:"0.7rem",fontWeight:700,color:"var(--accent-cyan)",letterSpacing:"0.12em",marginBottom:16 }}>START TODAY — FREE</div>
            <h2 style={{
              fontFamily:"'Sora',cursive", fontWeight:900,
              fontSize:"clamp(2rem,5.5vw,3.4rem)",
              letterSpacing:"-0.035em", lineHeight:1.08,
              background:"linear-gradient(135deg,var(--text-primary),var(--accent-cyan))",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              marginBottom:18,
            }}>Your mind deserves<br/>better tools.</h2>
            <p style={{ fontSize:"1.05rem",color:"var(--text-secondary)",maxWidth:420,margin:"0 auto 40px",lineHeight:1.72 }}>
              Join 12,000+ professionals who've reclaimed their focus. No credit card required.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14, justifyContent:"center" }}>
              <button className="glow-btn" style={{
                padding:"15px 38px", borderRadius:100, border:"none",
                fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"1rem",
                color:"#03050f",
                background:"linear-gradient(135deg,#4DEEEA,#34D399)",
                boxShadow:"0 0 36px rgba(77,238,234,0.4)",
                minWidth:200,
                cursor:"pointer",
              }}>Start for Free</button>
              <button className="ghost-btn" style={{
                padding:"15px 36px", borderRadius:100,
                background:"var(--bg-card)", border:"1px solid var(--border-primary)",
                fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:"1rem",
                color:"var(--text-muted)", minWidth:160,
                cursor:"pointer",
                transition:"all 0.25s ease",
              }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--accent-cyan)"; e.currentTarget.style.color="var(--accent-cyan)"; e.currentTarget.style.background="rgba(77,238,234,0.05)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border-primary)"; e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="var(--bg-card)"; }}
              >See Pricing</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
