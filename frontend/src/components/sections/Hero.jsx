import Dashboard from "../Dashboard";

const HERO_CSS = `
  .dashboard-wrapper { display: block; }
  @media (max-width: 768px) {
    .dashboard-wrapper { display: none; }
  }
`;

export default function Hero() {
  return (
    <section style={{ position:"relative", zIndex:1, paddingTop:"clamp(108px,15vw,148px)", paddingBottom:"clamp(40px,6vw,80px)", paddingLeft:"clamp(16px,4vw,24px)", paddingRight:"clamp(16px,4vw,24px)", textAlign:"center" }}>
      <div className="hero-a1" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:100, marginBottom:26, background:"rgba(77,238,234,0.15)", border:"1px solid rgba(77,238,234,0.35)" }}>
        <div style={{ width:7,height:7,borderRadius:"50%",background:"#0891b2",animation:"pulseGlow 2s infinite",boxShadow:"0 0 10px #0891b2"}}/>
        <span style={{ fontSize:"0.7rem",fontWeight:700,color:"#0e7490",letterSpacing:"0.1em" }}>THE AI ATTENTION LAYER FOR MODERN WORK</span>
      </div>

      <h1 className="hero-a2" style={{
        fontFamily:"'Sora',sans-serif", fontWeight:900,
        fontSize:"clamp(2.4rem,7.5vw,5.2rem)",
        lineHeight:1.07, letterSpacing:"-0.035em",
        maxWidth:880, margin:"0 auto 22px",
        background:"linear-gradient(155deg,#0e7490 20%,#0891b2 50%,#059669 80%)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
      }}>
        Reduce Digital Overload<br/>with AI
      </h1>

      <p className="hero-a3" style={{ fontSize:"clamp(1rem,2.2vw,1.2rem)", lineHeight:1.7, color:"#475569", maxWidth:560, margin:"0 auto 40px" }}>
        NeuroFlow intelligently filters emails, meetings, notifications, and messages —<br/>
        helping you focus only on what truly matters.
      </p>

      <div className="hero-a4" style={{ display:"flex", flexWrap:"wrap", gap:14, justifyContent:"center", marginBottom:52 }}>
        <button className="glow-btn" style={{
          padding:"14px 34px", borderRadius:100, border:"none",
          fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"0.95rem",
          color:"#03050f",
          background:"linear-gradient(135deg,#4DEEEA,#34D399)",
          boxShadow:"0 0 32px rgba(77,238,234,0.38)",
          minWidth:220,
        }}>Start Reducing Overload</button>

        <button className="ghost-btn" style={{
          padding:"14px 28px", borderRadius:100,
          background:"rgba(128,128,128,0.05)", border:"1px solid rgba(128,128,128,0.15)",
          fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:"0.95rem",
          color:"#64748b",
          display:"flex", alignItems:"center", gap:10, justifyContent:"center",
          minWidth:180,
        }}>
          <div style={{ width:30,height:30,borderRadius:"50%",background:"rgba(77,238,234,0.1)",border:"1px solid rgba(77,238,234,0.22)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <span style={{ color:"#4DEEEA",fontSize:"0.6rem",marginLeft:2 }}>▶</span>
          </div>
          Watch Demo
        </button>
      </div>

      <div className="hero-a4 hero-stats" style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"clamp(18px,4vw,52px)", flexWrap:"wrap", marginBottom:60 }}>
        {[
          {val:"12k+",label:"Teams Focused"},
          {val:"63%",label:"Avg Load Reduced"},
          {val:"41M+",label:"Distractions Filtered"},
        ].map((s,i)=> (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:"clamp(18px,4vw,52px)" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:"clamp(1.5rem,3.5vw,2.1rem)", color:"#0891b2", textShadow:"0 0 22px rgba(8,145,178,0.3)", letterSpacing:"-0.03em" }}>{s.val}</div>
              <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:4, fontWeight:500 }}>{s.label}</div>
            </div>
            {i<2 && <div style={{ width:1, height:32, background:"rgba(128,128,128,0.2)", flexShrink:0 }}/>}
          </div>
        ))}
      </div>

      <style>{HERO_CSS}</style>
      <div className="hero-a5 dashboard-wrapper" style={{ maxWidth:960, margin:"0 auto", padding:"0 clamp(0px,2vw,16px)", position:"relative" }}>
        <div style={{ position:"absolute", bottom:-16, left:"12%", right:"12%", height:36, borderRadius:"50%", background:"rgba(77,238,234,0.13)", filter:"blur(18px)", pointerEvents:"none"}}/>
        <Dashboard/>
      </div>
    </section>
  );
}
