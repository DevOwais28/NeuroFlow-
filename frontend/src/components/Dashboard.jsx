const DASHBOARD_CSS = `
  .dashboard-container { display: flex; }
  .dashboard-sidebar { 
    width: 58px; flex-shrink: 0;
    background: rgba(3,5,15,.96);
    border-right: 1px solid rgba(77,238,234,.06);
    padding: 14px 6px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .dashboard-main { 
    flex: 1; padding: 14px; overflow: hidden; min-height: 380px;
  }
  .dashboard-kpi { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 8px; 
    margin-bottom: 12px; 
  }
  .dashboard-two-col { 
    display: grid; 
    grid-template-columns: 1.1fr 1fr; 
    gap: 10px; 
    margin-bottom: 10px; 
  }
  .dashboard-bottom { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 10px; 
  }
  
  @media (max-width: 640px) {
    .dashboard-container { flex-direction: column; }
    .dashboard-sidebar { 
      width: 100%; 
      border-right: none; 
      border-bottom: 1px solid rgba(77,238,234,.06);
      padding: 8px 12px;
      flex-direction: row; 
      justify-content: center; 
      gap: 8px;
    }
    .dashboard-main { padding: 10px; min-height: 300px; }
    .dashboard-kpi { 
      grid-template-columns: repeat(2, 1fr); 
      gap: 6px; 
      margin-bottom: 8px; 
    }
    .dashboard-two-col { 
      grid-template-columns: 1fr; 
      gap: 8px; 
      margin-bottom: 8px; 
    }
    .dashboard-bottom { 
      grid-template-columns: 1fr; 
      gap: 8px; 
    }
  }
`;

const C = {
  cyan:   "#4DEEEA",
  green:  "#34D399",
  purple: "#818cf8",
  red:    "#f87171",
  amber:  "#fbbf24",
  bg:     "#02040e",
  card:   "rgba(7,12,28,.85)",
  border: "rgba(77,238,234,.1)",
};

function Donut({ pct, color, size=64, thickness=7 }) {
  const r=size/2-thickness/2, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={thickness}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color}aa)`,transition:"stroke-dasharray 1s ease" }}/>
    </svg>
  );
}

function Logo({ size=32 }) {
  return (
    <div style={{
      width:size,height:size,borderRadius:size*.28,flexShrink:0,
      background:"linear-gradient(135deg,#4DEEEA,#34D399)",
      boxShadow:`0 0 ${size*.6}px rgba(77,238,234,.5)`,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <svg viewBox="0 0 24 24" width={size*.62} height={size*.62} fill="none">
        <polygon points="12,2.5 20,7.5 20,16.5 12,21.5 4,16.5 4,7.5" stroke="white" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="12" r="2.8" fill="white"/>
        <line x1="12" y1="2.5" x2="12" y2="9" stroke="white" strokeWidth="1.2" opacity=".55"/>
        <line x1="20" y1="7.5" x2="14.2" y2="11" stroke="white" strokeWidth="1.2" opacity=".55"/>
        <line x1="20" y1="16.5" x2="14.2" y2="13" stroke="white" strokeWidth="1.2" opacity=".55"/>
      </svg>
    </div>
  );
}

const INBOX=[
  {avatar:"DK",from:"David Kim",role:"CEO",subject:"Q4 Strategy Review — need your input",tag:"CRITICAL",tc:C.red,bg:"rgba(248,113,113,.1)"},
  {avatar:"AI",from:"NeuroAI",role:"Digest",subject:"Your focus score dropped 14% — here's why",tag:"ACTION",tc:C.cyan,bg:"rgba(77,238,234,.08)"},
  {avatar:"HR",from:"HR Portal",role:"Admin",subject:"Benefits enrollment closes midnight today",tag:"TODAY",tc:C.green,bg:"rgba(52,211,153,.08)"},
  {avatar:"JL",from:"Julia Lee",role:"Design",subject:"Figma handoff ready — please review screens",tag:"REVIEW",tc:C.purple,bg:"rgba(129,140,248,.08)"},
];

const SIDEBAR_ITEMS=[
  {icon:"⬡",label:"Dashboard",active:true},
  {icon:"✉",label:"Inbox"},
  {icon:"◎",label:"Focus"},
  {icon:"◈",label:"Stats"},
  {icon:"⬢",label:"Tasks"},
  {icon:"▦",label:"Calendar"},
];

export default function Dashboard() {
  const bars=[38,62,45,78,54,88,70,50,82,65,92,76];

  return (
    <>
      <style>{DASHBOARD_CSS}</style>
      <div className="dash-float" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* Outer perspective wrapper */}
      <div style={{
        borderRadius:24,overflow:"hidden",
        background:"linear-gradient(160deg,rgba(7,12,28,.98),rgba(4,7,20,.99))",
        border:"1px solid rgba(77,238,234,.15)",
        boxShadow:"0 0 120px rgba(77,238,234,.1),0 60px 120px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.05)",
        animation:"float 7s ease-in-out infinite",
      }}>

        {/* Window chrome */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"12px 20px",
          background:"rgba(4,7,20,.95)",
          borderBottom:"1px solid rgba(77,238,234,.08)",
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ display:"flex",gap:6 }}>
              {["#ff5f57","#ffbd2e","#28c840"].map(c=>{
                return <div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c,opacity:.85 }}/>
              })}
            </div>
            <div style={{ height:16,width:1,background:"rgba(255,255,255,.08)" }}/>
            <Logo size={22}/>
            <span style={{ fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:".75rem",color:"#94a3b8",letterSpacing:".06em" }}>NeuroFlow — Dashboard</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {/* Live indicator */}
            <div style={{ display:"flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:100,background:"rgba(52,211,153,.08)",border:"1px solid rgba(52,211,153,.2)" }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite",boxShadow:`0 0 8px ${C.green}` }}/>
              <span style={{ fontSize:".6rem",fontWeight:700,color:C.green,letterSpacing:".08em" }}>AI LIVE</span>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              {[C.cyan,C.purple,C.green].map((c,i)=>(
                <div key={i} style={{ width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${c}66,${c}22)`,border:`1px solid ${c}44` }}/>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-container">
          {/* Sidebar */}
          <div className="dashboard-sidebar">
            {SIDEBAR_ITEMS.map(item=>{
              return <div key={item.label} style={{
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                padding:"8px 4px",borderRadius:10,cursor:"pointer",
                background:item.active?"rgba(77,238,234,.1)":"transparent",
                border:`1px solid ${item.active?"rgba(77,238,234,.22)":"transparent"}`,
                transition:"all .2s",
              }}>
                <span style={{ fontSize:".85rem",color:item.active?C.cyan:"#2d3a4a" }}>{item.icon}</span>
                <span style={{ fontSize:".42rem",fontWeight:600,color:item.active?C.cyan:"#2d3a4a",letterSpacing:".05em" }}>{item.label}</span>
              </div>
            })}
          </div>

          {/* Main area */}
          <div className="dashboard-main">

            {/* Top KPI strip */}
            <div className="dashboard-kpi">
              {[
                {val:"HIGH",label:"Cog Load",  delta:"↑12%",  c:C.red,   bg:"rgba(248,113,113,.07)"},
                {val:"41",  label:"Filtered",  delta:"today",  c:C.cyan,  bg:"rgba(77,238,234,.06)"},
                {val:"84%", label:"Efficiency",delta:"↑7%",   c:C.green, bg:"rgba(52,211,153,.06)"},
                {val:"12",  label:"AI Tasks",  delta:"pending",c:C.purple,bg:"rgba(129,140,248,.06)"},
              ].map(s=>(
                <div key={s.label} style={{
                  borderRadius:12,padding:"10px 8px",
                  background:s.bg,border:`1px solid ${s.c}25`,
                }}>
                  <div style={{ fontFamily:"'Sora',sans-serif",fontSize:".9rem",fontWeight:700,color:s.c,textShadow:`0 0 12px ${s.c}99`,marginBottom:1 }}>{s.val}</div>
                  <div style={{ fontSize:".5rem",fontWeight:600,color:"#e2e8f0",marginBottom:1 }}>{s.label}</div>
                  <div style={{ fontSize:".44rem",color:"#475569" }}>{s.delta}</div>
                </div>
              ))}
            </div>

            {/* Two column: focus chart + inbox */}
            <div className="dashboard-two-col">

              {/* Bar chart panel */}
              <div style={{ borderRadius:14,padding:12,background:C.card,border:`1px solid rgba(77,238,234,.09)` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <span style={{ fontSize:".58rem",fontWeight:700,color:"#334155",letterSpacing:".08em" }}>FOCUS ACTIVITY — 12 DAY</span>
                  <span style={{ fontSize:".52rem",fontWeight:700,color:C.green,background:"rgba(52,211,153,.1)",border:"1px solid rgba(52,211,153,.2)",borderRadius:100,padding:"2px 7px" }}>+23%</span>
                </div>
                <div style={{ display:"flex",alignItems:"flex-end",gap:4,height:60,marginBottom:6 }}>
                  {bars.map((h,i)=>(
                    <div key={i} style={{
                      flex:1,borderRadius:3,
                      background:i===11
                        ?`linear-gradient(to top,${C.cyan},${C.green})` 
                        :`linear-gradient(to top,${C.cyan}77,${C.cyan}22)`,
                      height:`${h}%`,
                      boxShadow:i===11?`0 0 8px ${C.cyan}99`:"none",
                      transition:"height .8s cubic-bezier(.16,1,.3,1)",
                    }}/>
                  ))}
                </div>
                <div style={{ display:"flex",justifyContent:"space-between" }}>
                  {["M","T","W","T","F","S","S","M","T","W","T","F"].map((d,i)=>(
                    <span key={i} style={{ flex:1,textAlign:"center",fontSize:".42rem",color:"#334155" }}>{d}</span>
                  ))}
                </div>
                {/* Bottom stat */}
                <div style={{ marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.04)",display:"flex",justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:".52rem",color:"#475569" }}>Avg daily focus</div>
                    <div style={{ fontSize:".7rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'Sora',sans-serif" }}>3h 42min</div>
                  </div>
                  <div>
                    <div style={{ fontSize:".52rem",color:"#475569" }}>AI filtered</div>
                    <div style={{ fontSize:".7rem",fontWeight:700,color:C.cyan,fontFamily:"'Sora',sans-serif" }}>41 noise</div>
                  </div>
                </div>
              </div>

              {/* Inbox panel */}
              <div style={{ borderRadius:14,padding:12,background:C.card,border:`1px solid rgba(77,238,234,.09)` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <span style={{ fontSize:".58rem",fontWeight:700,color:"#334155",letterSpacing:".08em" }}>AI INBOX</span>
                  <div style={{
                    fontSize:".45rem",fontWeight:700,color:C.red,
                    background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",
                    borderRadius:100,padding:"2px 7px",
                    animation:"pulse 2s infinite",
                  }}>17 URGENT</div>
                </div>
                {INBOX.map(m=>(
                  <div key={m.from} style={{
                    display:"flex",alignItems:"center",gap:7,
                    padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.034)",
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width:22,height:22,borderRadius:"50%",flexShrink:0,
                      background:`linear-gradient(135deg,${m.tc}44,${m.tc}22)`,
                      border:`1px solid ${m.tc}33`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:".38rem",fontWeight:800,color:m.tc,
                    }}>{m.avatar}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:1 }}>
                        <span style={{ fontSize:".52rem",fontWeight:700,color:"#e2e8f0",whiteSpace:"nowrap" }}>{m.from}</span>
                        <span style={{ fontSize:".44rem",color:"#334155" }}>·</span>
                        <span style={{ fontSize:".44rem",color:"#475569" }}>{m.role}</span>
                      </div>
                      <div style={{ fontSize:".46rem",color:"#475569",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>{m.subject}</div>
                    </div>
                    <div style={{ fontSize:".42rem",fontWeight:700,color:m.tc,background:m.bg,border:`1px solid ${m.tc}28`,borderRadius:4,padding:"2px 5px",whiteSpace:"nowrap",flexShrink:0 }}>{m.tag}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row: mental load + calendar */}
            <div className="dashboard-bottom">

              {/* Mental load */}
              <div style={{ borderRadius:14,padding:12,background:C.card,border:`1px solid rgba(77,238,234,.09)`,display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ position:"relative",flexShrink:0 }}>
                  <Donut pct={63} color={C.cyan} size={58} thickness={6}/>
                  <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <span style={{ fontFamily:"'Sora',sans-serif",fontSize:".62rem",fontWeight:700,color:C.cyan }}>63%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:".52rem",fontWeight:700,color:"#334155",letterSpacing:".06em",marginBottom:4 }}>MENTAL LOAD</div>
                  <div style={{ fontFamily:"'Sora',sans-serif",fontSize:".75rem",fontWeight:700,color:"#e2e8f0" }}>Reduced Today</div>
                  <div style={{ fontSize:".46rem",color:"#475569",marginTop:2 }}>vs. 7-day average</div>
                  {/* AI tip */}
                  <div style={{
                    marginTop:6,display:"flex",alignItems:"center",gap:4,
                    padding:"3px 7px",borderRadius:6,
                    background:"rgba(77,238,234,.06)",border:"1px solid rgba(77,238,234,.12)",
                  }}>
                    <span style={{ fontSize:".42rem",color:"#334155" }}>🤖</span>
                    <span style={{ fontSize:".44rem",color:C.cyan }}>AI typing</span>
                    <span className="dot1" style={{ width:3,height:3,borderRadius:"50%",background:C.cyan,display:"inline-block" }}/>
                    <span className="dot2" style={{ width:3,height:3,borderRadius:"50%",background:C.cyan,display:"inline-block"}}/>
                    <span className="dot3" style={{ width:3,height:3,borderRadius:"50%",background:C.cyan,display:"inline-block"}}/>
                  </div>
                </div>
              </div>

              {/* Calendar stress */}
              <div style={{ borderRadius:14,padding:12,background:C.card,border:"1px solid rgba(248,113,113,.1)" }}>
                <div style={{ fontSize:".52rem",fontWeight:700,color:"#334155",letterSpacing:".06em",marginBottom:8 }}>CALENDAR STRESS</div>
                {[
                  {day:"Today",    pct:62,c:C.cyan},
                  {day:"Tomorrow", pct:96,c:C.red},
                  {day:"Wednesday",pct:38,c:C.green},
                ].map(d=>(
                  <div key={d.day} style={{ marginBottom:6 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                      <span style={{ fontSize:".48rem",color:"#94a3b8" }}>{d.day}</span>
                      <span style={{ fontSize:".48rem",fontWeight:700,color:d.c }}>{d.pct}%</span>
                    </div>
                    <div style={{ height:4,borderRadius:2,background:"rgba(255,255,255,.05)",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${d.pct}%`,background:d.c,borderRadius:2,boxShadow:`0 0 8px ${d.c}99`,transition:"width 1s ease" }}/>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop:6,display:"flex",alignItems:"center",gap:5,
                  padding:"4px 8px",borderRadius:6,
                  background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.15)",
                }}>
                  <span style={{ fontSize:".5rem" }}>⚠️</span>
                  <span style={{ fontSize:".46rem",color:C.red }}>Tomorrow critically overloaded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
