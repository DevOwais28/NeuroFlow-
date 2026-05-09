import { useTheme } from "../context/ThemeContext";

const DOTS = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 3 + 1.5,
  dur: Math.random() * 4 + 4,
  del: Math.random() * 5,
}));

export default function Particles() {
  const { theme } = useTheme();
  
  const getColors = () => {
    if (theme === "light") {
      return ["#0e7490", "#059669", "#7c3aed"];
    }
    return ["#4DEEEA", "#34D399", "#a78bfa"];
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {DOTS.map((p, i) => {
        const colors = getColors();
        const col = colors[i % 3];
        return (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s,
            borderRadius: "50%",
            background: col,
            opacity: 1,
            boxShadow: `0 0 ${p.s * 4}px ${col}`,
            animation: `floatParticle ${p.dur}s ease-in-out ${p.del}s infinite`,
          }} />
        );
      })}
    </div>
  );
}
