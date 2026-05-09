export default function LogoIcon({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      background: "linear-gradient(135deg,#4DEEEA,#34D399)",
      boxShadow: "0 0 18px rgba(77,238,234,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" stroke="white" strokeWidth="1.7" fill="none"/>
        <circle cx="12" cy="12" r="2.8" fill="white"/>
        <line x1="12" y1="2"  x2="12" y2="9.2"  stroke="white" strokeWidth="1.1" opacity="0.5"/>
        <line x1="20" y1="7"  x2="14.4" y2="10.6" stroke="white" strokeWidth="1.1" opacity="0.5"/>
        <line x1="20" y1="17" x2="14.4" y2="13.4" stroke="white" strokeWidth="1.1" opacity="0.5"/>
      </svg>
    </div>
  );
}
