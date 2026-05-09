import LogoIcon from "../LogoIcon";

export default function Footer() {
  return (
    <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid var(--border-primary)", padding:"30px clamp(20px,5vw,48px)" }}>
      <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <LogoIcon size={26}/>
          <span style={{ fontFamily:"'Sora',cursive",fontWeight:700,fontSize:"0.95rem",color:"var(--text-primary)" }}>NeuroFlow</span>
        </div>
        <p style={{ fontSize:"0.78rem",color:"var(--text-muted)",textAlign:"center" }}>© 2025 NeuroFlow, Inc. — AI Cognitive Load Reduction Platform</p>
        <div style={{ display:"flex", gap:24 }}>
          {["Privacy","Terms","Contact"].map(item=> (
            <a key={item} href="#" style={{ fontSize:"0.825rem",color:"var(--text-muted)",textDecoration:"none",transition:"color 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--accent-cyan)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}
            >{item}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
