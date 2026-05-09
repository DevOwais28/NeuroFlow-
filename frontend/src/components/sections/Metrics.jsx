import useScrollReveal from "../../hooks/useScrollReveal";

export default function Metrics() {
  const { ref, visible } = useScrollReveal(0.15);
  return (
    <section id="metrics" ref={ref} style={{ position:"relative", zIndex:1, padding:"0 clamp(16px,5vw,48px) clamp(72px,10vw,104px)" }}>
      <div style={{ maxWidth:1020, margin:"0 auto", opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(30px)", transition:"all 0.7s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{
          borderRadius:28, padding:"clamp(44px,7vw,72px) clamp(24px,6vw,72px)", textAlign:"center",
          background:"linear-gradient(140deg,rgba(77,238,234,0.05),rgba(52,211,153,0.03),rgba(124,58,237,0.03))",
          border:"1px solid var(--border-primary)",
          backdropFilter:"blur(24px)",
          boxShadow:"0 0 80px rgba(77,238,234,0.05),inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,color:"var(--accent-cyan)",letterSpacing:"0.12em",marginBottom:14 }}>MEASURED IMPACT</div>
          <h2 style={{ fontFamily:"'Sora',cursive",fontWeight:800,fontSize:"clamp(1.6rem,4vw,2.4rem)",color:"var(--text-primary)",marginBottom:48,letterSpacing:"-0.03em" }}>Real results from real teams</h2>
          <div className="metrics-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"clamp(20px,4vw,40px)" }}>
            {[
              {val:"63%",   label:"Average cognitive load reduction"},
              {val:"3.2h",  label:"Extra deep work per day"},
              {val:"41+",   label:"Distractions filtered daily"},
              {val:"9.1/10",label:"Mental clarity score"},
            ].map(m=> (
              <div key={m.label}>
                <div style={{ fontFamily:"'Sora',cursive",fontWeight:800,fontSize:"clamp(1.6rem,4vw,2.4rem)",color:"var(--accent-cyan)",textShadow:"0 0 24px rgba(77,238,234,0.45)",letterSpacing:"-0.03em",marginBottom:8 }}>{m.val}</div>
                <div style={{ fontSize:"0.825rem",color:"var(--text-secondary)",lineHeight:1.55 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
