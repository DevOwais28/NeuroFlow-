import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Particles from "../components/Particles";
import Hero from "../components/sections/Hero";
import Features from "../components/sections/Features";
import Metrics from "../components/sections/Metrics";
import HowItWorks from "../components/sections/HowItWorks";
import CTA from "../components/sections/CTA";
import TrustedBy from "../components/sections/TrustedBy";
import Footer from "../components/sections/Footer";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg-primary); }
  ::-webkit-scrollbar-thumb { background: rgba(77,238,234,0.3); border-radius: 4px; }

  @keyframes floatParticle {
    0%   { transform: translateY(0px) scale(1);    opacity: 0.2; }
    50%  { transform: translateY(-22px) scale(1.4); opacity: 0.6; }
    100% { transform: translateY(0px) scale(1);    opacity: 0.2; }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -30px) scale(1.08); }
    66% { transform: translate(-15px, 15px) scale(0.95); }
  }
  @keyframes dashFloat {
    0%, 100% { transform: perspective(1100px) rotateX(5deg) rotateY(-1.5deg) translateY(0px); }
    50%       { transform: perspective(1100px) rotateX(3deg) rotateY(-0.5deg) translateY(-14px); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 0.9; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .hero-a1 { animation: heroFadeUp 0.85s cubic-bezier(.16,1,.3,1) 0.1s both; }
  .hero-a2 { animation: heroFadeUp 0.85s cubic-bezier(.16,1,.3,1) 0.22s both; }
  .hero-a3 { animation: heroFadeUp 0.85s cubic-bezier(.16,1,.3,1) 0.36s both; }
  .hero-a4 { animation: heroFadeUp 0.85s cubic-bezier(.16,1,.3,1) 0.5s both; }
  .hero-a5 { animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) 0.65s both; }
  .dash-float { animation: dashFloat 7s ease-in-out infinite; }

  .feature-card {
    transition: transform 0.35s cubic-bezier(.16,1,.3,1), border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  }
  .feature-card:hover { transform: translateY(-6px) scale(1.01); }

  .nav-link {
    position: relative;
    color: #64748b;
    text-decoration: none;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 7px 14px;
    border-radius: 100px;
    transition: color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }

  .glow-btn {
    transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease;
    cursor: pointer;
  }
  .glow-btn:hover {
    transform: scale(1.04) translateY(-2px);
    box-shadow: 0 0 52px rgba(77,238,234,0.58) !important;
  }
  .ghost-btn {
    transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.25s cubic-bezier(.16,1,.3,1);
    cursor: pointer;
  }
  .ghost-btn:hover {
    background: rgba(255,255,255,0.06) !important;
    border-color: rgba(77,238,234,0.25) !important;
    color: #e2e8f0 !important;
    transform: scale(1.02) translateY(-1px);
  }

  .mobile-menu-overlay { animation: slideDown 0.28s cubic-bezier(.16,1,.3,1) both; }

  .nav-center-pills { display: none; }
  .nav-right-btns   { display: none; }
  .nav-hamburger    { display: flex; }

  @media (min-width: 860px) {
    .nav-center-pills { display: flex !important; }
    .nav-right-btns   { display: flex !important; }
    .nav-hamburger    { display: none !important; }
  }

  /* Mobile fixes */
  @media (max-width: 640px) {
    .hide-mobile { display: none !important; }
    .dash-float { animation: none !important; }
    .hero-stats { gap: 24px !important; margin-bottom: 12px !important; }
    .hero-stats > div > div:nth-child(2) { font-size: 1.2rem !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .how-grid { grid-template-columns: 1fr !important; }
    .metrics-grid { grid-template-columns: 1fr 1fr !important; }
    .trusted-gap { gap: 16px 28px !important; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  // Toggle light mode background based on theme
  useEffect(() => {
    const lightBg = document.querySelector('[data-light-bg="true"]');
    if (lightBg) {
      lightBg.style.opacity = theme === 'light' ? '1' : '0';
    }
  }, [theme]);
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontFamily:"'Inter',sans-serif", background:"var(--bg-primary)", color:"var(--text-primary)", overflowX:"hidden", minHeight:"100vh", transition:"background 0.3s ease, color 0.3s ease", position:"relative" }}>
        {/* Light mode gradient background */}
        <div style={{ 
          position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
          background:"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)",
          opacity: 0,
          transition:"opacity 0.3s ease"
        }} data-light-bg="true"/>
        
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", top:"-5%", left:"50%", transform:"translateX(-50%)", width:"75vw", height:"75vh", background:theme==='light'?"radial-gradient(ellipse,rgba(8,145,178,0.08) 0%,transparent 68%)":"radial-gradient(ellipse,rgba(77,238,234,0.065) 0%,transparent 68%)" }}/>
          <div style={{ position:"absolute", top:0, right:0, width:"45vw", height:"65vh", background:theme==='light'?"radial-gradient(ellipse at top right,rgba(5,150,105,0.06) 0%,transparent 60%)":"radial-gradient(ellipse at top right,rgba(52,211,153,0.04) 0%,transparent 60%)" }}/>
          <div style={{ position:"absolute", bottom:"10%", left:"-5%", width:"40vw", height:"50vh", background:theme==='light'?"radial-gradient(ellipse at bottom left,rgba(124,58,237,0.06) 0%,transparent 60%)":"radial-gradient(ellipse at bottom left,rgba(124,58,237,0.04) 0%,transparent 60%)" }}/>
          <div style={{
            position:"absolute", inset:0,
            backgroundImage:theme==='light'?"linear-gradient(rgba(8,145,178,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(8,145,178,0.03) 1px,transparent 1px)":"linear-gradient(rgba(77,238,234,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(77,238,234,0.02) 1px,transparent 1px)",
            backgroundSize:"64px 64px",
          }}/>
          <div style={{ position:"absolute", top:"8%", right:"12%", width:"1.5px", height:"45vh", background:theme==='light'?"linear-gradient(to bottom,transparent,rgba(8,145,178,0.25),transparent)":"linear-gradient(to bottom,transparent,rgba(77,238,234,0.32),transparent)", animation:"pulseGlow 5s ease-in-out infinite", borderRadius:2 }}/>
          <div style={{ position:"absolute", top:"35%", left:"8%",  width:"1px",   height:"30vh", background:theme==='light'?"linear-gradient(to bottom,transparent,rgba(5,150,105,0.2),transparent)":"linear-gradient(to bottom,transparent,rgba(52,211,153,0.22),transparent)", animation:"pulseGlow 7s ease-in-out 2s infinite", borderRadius:2 }}/>
          {/* Floating orbs */}
          <div style={{ position:"absolute", top:"15%", left:"10%", width:200, height:200, borderRadius:"50%", background:theme==='light'?"radial-gradient(circle,rgba(8,145,178,0.1) 0%,transparent 70%)":"radial-gradient(circle,rgba(77,238,234,0.08) 0%,transparent 70%)", filter:"blur(40px)", animation:"floatOrb 8s ease-in-out infinite" }}/>
          <div style={{ position:"absolute", top:"50%", right:"5%", width:280, height:280, borderRadius:"50%", background:theme==='light'?"radial-gradient(circle,rgba(5,150,105,0.08) 0%,transparent 70%)":"radial-gradient(circle,rgba(52,211,153,0.06) 0%,transparent 70%)", filter:"blur(50px)", animation:"floatOrb 10s ease-in-out 3s infinite reverse" }}/>
          <div style={{ position:"absolute", bottom:"20%", left:"25%", width:160, height:160, borderRadius:"50%", background:theme==='light'?"radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)":"radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)", filter:"blur(35px)", animation:"floatOrb 12s ease-in-out 1.5s infinite" }}/>
          <Particles/>
        </div>

        <Navbar/>
        <Hero/>
        <TrustedBy/>
        <Features/>
        <Metrics/>
        <HowItWorks/>
        <CTA/>
        <Footer/>
      </div>
    </>
  );
}
