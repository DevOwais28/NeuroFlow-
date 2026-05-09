import useScrollReveal from "../../hooks/useScrollReveal";

export default function HowItWorks() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section id="how-it-works" ref={ref} style={{ position:"relative", zIndex:1, padding:"0 clamp(16px,5vw,48px) clamp(72px,10vw,100px)" }}>
      <div style={{ maxWidth:940, margin:"0 auto", textAlign:"center", opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(30px)", transition:"all 0.7s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:100, marginBottom:20, background:"rgba(167,139,250,0.07)", border:"1px solid rgba(167,139,250,0.18)" }}>
          <span style={{ fontSize:"0.7rem",fontWeight:700,color:"#a78bfa",letterSpacing:"0.1em" }}>HOW IT WORKS</span>
        </div>
        <h2 style={{ fontFamily:"'Sora',cursive",fontWeight:800,fontSize:"clamp(1.9rem,4.5vw,3rem)",letterSpacing:"-0.03em",color:"var(--text-primary)",marginBottom:56 }}>Three steps to mental clarity</h2>
        <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
          {[
            {num:"01",title:"Connect Your Stack",  desc:"Link email, calendar, Slack, and apps in 60 seconds. NeuroFlow starts learning your workflow instantly.", color:"#4DEEEA"},
            {num:"02",title:"AI Calibrates",        desc:"Our model maps your attention patterns, priority signals, and cognitive rhythms over 48 hours.", color:"#34D399"},
            {num:"03",title:"Clarity Unlocked",     desc:"From day three, a curated attention feed forms — only what deserves your focus ever surfaces.", color:"#a78bfa"},
          ].map((step,i)=> (
            <div key={step.num} style={{
              borderRadius:20, padding:"32px 28px", textAlign:"left",
              background:"var(--bg-card)", border:"1px solid var(--border-primary)",
              position:"relative", overflow:"hidden",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: `all 0.6s cubic-bezier(.16,1,.3,1) ${i*120}ms`,
            }}>
              <div style={{ position:"absolute",top:0,right:0,width:80,height:80,borderRadius:"0 20px 0 80px",background:`${step.color}07` }}/>
              <div style={{ fontFamily:"'Sora',cursive",fontWeight:900,fontSize:"3rem",color:step.color,opacity:0.13,lineHeight:1,marginBottom:16,letterSpacing:"-0.04em" }}>{step.num}</div>
              <h3 style={{ fontFamily:"'Sora',cursive",fontWeight:700,fontSize:"1.05rem",color:"var(--text-primary)",marginBottom:12 }}>{step.title}</h3>
              <p style={{ fontSize:"0.875rem",color:"var(--text-secondary)",lineHeight:1.65 }}>{step.desc}</p>
              <div style={{ width:28,height:3,borderRadius:2,background:`linear-gradient(90deg,${step.color},transparent)`,marginTop:24 }}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
