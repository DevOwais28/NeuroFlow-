import { useState } from "react";
import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { Link } from "react-router-dom";

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function NotificationsPage() {
  const { isConnected: discordConnected, messages, fetchMessages } = useDiscord();
  const { isConnected: googleConnected, emails, events, fetchEmails, fetchEvents } = useGoogle();
  const [filter, setFilter] = useState("all");

  // Build notifications from real data
  const notifs = [
    ...messages.slice(0, 8).map((m, i) => ({
      id: "d-" + (m.id || i),
      title: `Discord — @${m.author?.username || m._channel_name || "Unknown"}`,
      body: m.content?.substring(0, 120) || "(no content)",
      time: m.timestamp ? formatDate(m.timestamp) : "",
      type: "discord",
      read: false,
      service: "Discord",
      dot: "#5865F2",
      bg: "rgba(88,101,242,0.06)",
      border: "rgba(88,101,242,0.12)",
    })),
    ...emails.slice(0, 8).map((e, i) => ({
      id: "g-" + (e.id || i),
      title: `Gmail — ${e.subject || "(No Subject)"}`,
      body: `From: ${e.from || "Unknown"} — ${e.snippet || ""}`,
      time: e.date || "",
      type: "gmail",
      read: !e.unread,
      service: "Gmail",
      dot: "#EA4335",
      bg: e.unread ? "rgba(234,67,53,0.08)" : "rgba(255,255,255,0.02)",
      border: e.unread ? "rgba(234,67,53,0.18)" : "rgba(255,255,255,0.04)",
    })),
    ...events.slice(0, 5).map((e, i) => ({
      id: "c-" + (e.id || i),
      title: `📅 ${e.summary || "Upcoming Event"}`,
      body: `Starts: ${formatDate(e.start)}${e.location ? ` — 📍 ${e.location}` : ""}`,
      time: formatDate(e.start),
      type: "calendar",
      read: false,
      service: "Calendar",
      dot: "#34A853",
      bg: "rgba(52,211,153,0.06)",
      border: "rgba(52,211,153,0.12)",
    })),
  ];

  const [readIds, setReadIds] = useState(new Set(notifs.filter(n => n.read).map(n => n.id)));
  const markRead = id => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifs.map(n => n.id)));

  const filtered = notifs.filter(n => {
    if (filter === "unread") return !readIds.has(n.id);
    if (filter === "gmail") return n.service === "Gmail";
    if (filter === "discord") return n.service === "Discord";
    if (filter === "calendar") return n.service === "Calendar";
    return true;
  });

  const unreadCount = notifs.filter(n => !readIds.has(n.id)).length;
  const noneConnected = !discordConnected && !googleConnected;

  return (
    <div className="page-content" style={{ color: "#F8FAFC" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.8rem", margin: 0,
          background: "linear-gradient(135deg,#f59e0b,#4DEEEA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(77,238,234,0.2)", background: "rgba(77,238,234,0.05)", color: "#4DEEEA", fontSize: "0.8rem", cursor: "pointer" }}>
            Mark all read
          </button>
        )}
      </div>
      <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 24px" }}>
        {unreadCount} unread notifications across your connected services
      </p>

      {noneConnected ? (
        <div style={{ padding: "60px", textAlign: "center", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔔</div>
          <p style={{ color: "#64748b", marginBottom: 16 }}>Connect Discord or Google to receive notifications here.</p>
          <Link to="/dashboard/profile" style={{ padding: "9px 22px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>
            Connect Services →
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              ...(discordConnected ? [{ key: "discord", label: "Discord" }] : []),
              ...(googleConnected ? [{ key: "gmail", label: "Gmail" }, { key: "calendar", label: "Calendar" }] : []),
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "6px 14px", borderRadius: 100, border: "none", cursor: "pointer",
                background: filter === f.key ? "rgba(77,238,234,0.12)" : "rgba(255,255,255,0.03)",
                color: filter === f.key ? "#4DEEEA" : "#64748b", fontSize: "0.8rem", fontWeight: 500,
              }}>{f.label}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {discordConnected && <span onClick={fetchMessages} style={{ fontSize: "0.72rem", color: "#5865F2", cursor: "pointer", alignSelf: "center" }}>↻ Discord</span>}
              {googleConnected && <span onClick={fetchEmails} style={{ fontSize: "0.72rem", color: "#EA4335", cursor: "pointer", alignSelf: "center" }}>↻ Gmail</span>}
              {googleConnected && <span onClick={fetchEvents} style={{ fontSize: "0.72rem", color: "#34A853", cursor: "pointer", alignSelf: "center" }}>↻ Calendar</span>}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                {notifs.length === 0 ? "No data loaded yet — go to Home and click refresh." : "No notifications in this category."}
              </div>
            ) : filtered.map(n => {
              const isRead = readIds.has(n.id);
              return (
                <div key={n.id} onClick={() => markRead(n.id)} style={{
                  padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                  background: isRead ? "rgba(7,11,26,0.4)" : n.bg,
                  border: isRead ? "1px solid rgba(255,255,255,0.03)" : `1px solid ${n.border}`,
                  display: "flex", gap: 12, alignItems: "flex-start", transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRead ? "transparent" : n.dot,
                    marginTop: 6, flexShrink: 0, boxShadow: isRead ? "none" : `0 0 8px ${n.dot}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: isRead ? "#94a3b8" : "#F8FAFC",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                      <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 100,
                        background: `${n.dot}15`, color: n.dot, fontWeight: 600, flexShrink: 0 }}>{n.service}</span>
                      {n.time && <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#475569", flexShrink: 0 }}>{n.time}</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
