import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { Link } from "react-router-dom";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function BarChart({ days, important, noise }) {
  const maxVal = Math.max(...important.map((v, i) => v + noise[i]), 1);
  const height = 160;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height, paddingBottom: 24 }}>
      {days.map((day, i) => {
        const impH = (important[i] / maxVal) * height;
        const noiseH = (noise[i] / maxVal) * height;
        return (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%" }}>
              <div style={{ width: 14, height: Math.max(impH, 2), background: "#4DEEEA", borderRadius: "4px 4px 0 0", transition: "height 0.5s" }} />
              <div style={{ width: 14, height: Math.max(noiseH, 2), background: "#ef4444", borderRadius: "4px 4px 0 0", opacity: 0.6, transition: "height 0.5s" }} />
            </div>
            <span style={{ fontSize: "0.68rem", color: "#475569" }}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsPage() {
  const { isConnected: discordConnected, messages, guilds } = useDiscord();
  const { isConnected: googleConnected, emails, events } = useGoogle();

  const totalMessages = messages.length;
  const totalEmails = emails.length;
  const unreadEmails = emails.filter(e => e.unread).length;
  const upcomingEvents = events.length;

  // Build per-day activity from real timestamps (Mon–Sun)
  const now = new Date();
  const important = dayLabels.map((_, i) => {
    // i=0 is Monday, i=6 is Sunday
    return messages.filter(m => {
      if (!m.timestamp) return false;
      const d = new Date(m.timestamp);
      const dayOfWeek = (d.getDay() + 6) % 7; // convert Sun=0 → Mon=0
      return dayOfWeek === i;
    }).length +
    emails.filter(e => {
      if (!e.date) return false;
      try {
        const d = new Date(e.date);
        const dayOfWeek = (d.getDay() + 6) % 7;
        return dayOfWeek === i;
      } catch { return false; }
    }).length;
  });
  const noise = dayLabels.map((_, i) => {
    // estimate noise = read emails on that day
    return emails.filter(e => {
      if (!e.date || e.unread) return false;
      try {
        const d = new Date(e.date);
        return (d.getDay() + 6) % 7 === i;
      } catch { return false; }
    }).length;
  });

  const services = [
    { name: "Discord", important: totalMessages, noise: Math.max(0, guilds.length * 3), color: "#5865F2", connected: discordConnected },
    { name: "Gmail", important: unreadEmails, noise: Math.max(0, totalEmails - unreadEmails), color: "#EA4335", connected: googleConnected },
    { name: "Calendar", important: upcomingEvents, noise: 0, color: "#34A853", connected: googleConnected },
  ].filter(s => s.connected && (s.important + s.noise) > 0);

  const totalImportant = services.reduce((a, s) => a + s.important, 0);
  const totalNoise = services.reduce((a, s) => a + s.noise, 0);
  const ratio = (totalImportant + totalNoise) > 0 ? ((totalImportant / (totalImportant + totalNoise)) * 100).toFixed(1) : "—";

  const noneConnected = !discordConnected && !googleConnected;

  return (
    <div className="page-content" style={{ color: "#F8FAFC" }}>
      <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.8rem", margin: "0 0 8px",
        background: "linear-gradient(135deg,#a78bfa,#4DEEEA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Insights
      </h1>
      <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 24px" }}>
        AI-powered analysis of your attention and messages
      </p>

      {noneConnected ? (
        <div style={{ padding: "60px", textAlign: "center", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
          <p style={{ color: "#64748b", marginBottom: 16 }}>Connect Discord or Google to see your real insights.</p>
          <Link to="/dashboard/profile" style={{ padding: "9px 22px", borderRadius: 8, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>
            Connect Services →
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Discord Messages", val: discordConnected ? totalMessages : "—", color: "#5865F2" },
              { label: "Unread Emails", val: googleConnected ? unreadEmails : "—", color: "#EA4335" },
              { label: "Signal Ratio", val: ratio !== "—" ? `${ratio}%` : "—", color: "#34D399" },
              { label: "Upcoming Events", val: googleConnected ? upcomingEvents : "—", color: "#a78bfa" },
            ].map(s => (
              <div key={s.label} style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color, fontFamily: "'Sora',cursive" }}>{s.val}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1rem", margin: 0 }}>Activity This Week</h3>
              <div style={{ display: "flex", gap: 16, fontSize: "0.72rem" }}>
                <span style={{ color: "#4DEEEA" }}>■ Important</span>
                <span style={{ color: "#ef4444", opacity: 0.6 }}>■ Noise</span>
              </div>
            </div>
            <BarChart days={dayLabels} important={important} noise={noise} />
          </div>

          {/* Service Breakdown */}
          {services.length > 0 && (
            <div style={{ padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1rem", margin: "0 0 20px" }}>Breakdown by Service</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {services.map(s => {
                  const total = s.important + s.noise || 1;
                  const pct = (s.important / total) * 100;
                  return (
                    <div key={s.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: "#64748b" }}>{s.important} important / {s.noise} noise</span>
                      </div>
                      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ width: `${pct}%`, background: s.color, opacity: 0.85, transition: "width 0.5s" }} />
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
