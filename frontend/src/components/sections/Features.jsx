import FeatureCard from "../FeatureCard";
import useScrollReveal from "../../hooks/useScrollReveal";

const FEATURES = [
  {icon:"✉", title:"AI Inbox Prioritization",     desc:"Ranks every message by urgency and relevance. Only what truly needs you rises to the top.", color:"#4DEEEA"},
  {icon:"🧠",title:"Cognitive Load Detection",     desc:"Real-time mental load scoring from calendar density, message volume, and task complexity.",  color:"#a78bfa"},
  {icon:"◎", title:"Smart Focus Mode",             desc:"AI carves distraction-free deep work blocks perfectly timed to your cognitive peak hours.", color:"#34D399"},
  {icon:"⬢", title:"AI Task Extraction",           desc:"Pulls action items from emails, docs, and calls into a single prioritised task list.",       color:"#f59e0b"},
  {icon:"📅",title:"Calendar Stress Analysis",     desc:"Identifies overloaded days and scheduling conflicts before they derail your concentration.", color:"#f87171"},
  {icon:"🔕",title:"Notification Noise Filtering", desc:"Learns which alerts deserve your focus and silences everything else — quietly, intelligently.", color:"#4DEEEA"},
];

export default function Features() {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <section id="features" ref={ref} style={{ position:"relative", zIndex:1, padding:"clamp(72px,11vw,128px) clamp(16px,5vw,48px)" }}>
      <div style={{ maxWidth:1120, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64, opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(20px)", transition:"all 0.6s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:100, marginBottom:20, background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.18)" }}>
            <span style={{ fontSize:"0.7rem",fontWeight:700,color:"#34D399",letterSpacing:"0.1em" }}>PLATFORM CAPABILITIES</span>
          </div>
          <h2 style={{
            fontFamily:"'Sora',cursive", fontWeight:800,
            fontSize:"clamp(1.9rem,4.5vw,3.2rem)",
            letterSpacing:"-0.03em", lineHeight:1.13,
            background:"linear-gradient(135deg,var(--text-primary),var(--text-muted))",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            marginBottom:16,
          }}>Everything you need to<br/>reclaim your attention</h2>
          <p style={{ fontSize:"1.05rem", color:"var(--text-secondary)", maxWidth:500, margin:"0 auto", lineHeight:1.72 }}>
            Six intelligent systems working in harmony to eliminate cognitive overload and surface what matters most.
          </p>
        </div>
        <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
          {FEATURES.map((f,i)=><FeatureCard key={f.title} {...f} delay={i*80+200} visible={visible}/>)}
        </div>
      </div>
    </section>
  );
}
