import { useState } from "react";
import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { Link } from "react-router-dom";

export default function ArchivePage() {
  const { isConnected: discordConnected, messages } = useDiscord();
  const { isConnected: googleConnected, emails } = useGoogle();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All");

  // Merge all real items
  const allItems = [
    ...messages.map(m => ({
      id: "d-" + (m.id || Math.random()),
      service: "Discord",
      from: m.author?.username || m._channel_name || "Unknown",
      subject: m.content?.substring(0, 60) || "(no content)",
      preview: m.content || "",
      date: m.timestamp ? new Date(m.timestamp).toLocaleDateString() : "",
      color: "#5865F2",
    })),
    ...emails.map(e => ({
      id: "g-" + e.id,
      service: "Gmail",
      from: e.from || "Unknown",
      subject: e.subject || "(No Subject)",
      preview: e.snippet || "",
      date: e.date || "",
      color: "#EA4335",
    })),
  ];

  const sources = ["All", "Discord", "Gmail"];

  const filtered = allItems.filter(a => {
    const matchSource = source === "All" || a.service === source;
    const q = search.toLowerCase();
    const matchSearch = !q || a.subject.toLowerCase().includes(q) || a.from.toLowerCase().includes(q) || a.preview.toLowerCase().includes(q);
    return matchSource && matchSearch;
  });

  const noneConnected = !discordConnected && !googleConnected;

  return (
    <div className="page-content" style={{ color: "#F8FAFC" }}>
      <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.8rem", margin: "0 0 8px",
        background: "linear-gradient(135deg,#4DEEEA,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Archive
      </h1>
      <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 24px" }}>
        All your messages and emails in one place ({filtered.length} items)
      </p>

      {noneConnected && (
        <div style={{ padding: "40px", textAlign: "center", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📁</div>
          <p style={{ color: "#64748b", marginBottom: 16 }}>Connect Discord or Google to start archiving your messages.</p>
          <Link to="/dashboard/profile" style={{ padding: "9px 22px", borderRadius: 8, background: "rgba(77,238,234,0.1)", border: "1px solid rgba(77,238,234,0.3)", color: "#4DEEEA", textDecoration: "none", fontWeight: 600 }}>
            Connect Services →
          </Link>
        </div>
      )}

      {!noneConnected && (
        <>
          {/* Search + Filter */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages and emails..."
              style={{ flex: 1, minWidth: 240, padding: "10px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#F8FAFC", fontSize: "0.9rem", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {sources.map(s => (
                <button key={s} onClick={() => setSource(s)} style={{
                  padding: "6px 14px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: source === s ? "rgba(77,238,234,0.12)" : "rgba(255,255,255,0.03)",
                  color: source === s ? "#4DEEEA" : "#64748b", fontSize: "0.8rem", fontWeight: 500,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                {allItems.length === 0 ? "No data loaded yet — go to the dashboard to load messages." : "No results found."}
              </div>
            ) : filtered.map(item => (
              <div key={item.id} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(7,11,26,0.5)",
                border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 14, alignItems: "flex-start",
                transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(7,11,26,0.5)"}>
                <div style={{ fontSize: "1.2rem" }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{item.from}</span>
                    <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 100,
                      background: `${item.color}15`, color: item.color, fontWeight: 600 }}>{item.service}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#475569" }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: 3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.subject}</div>
                  <div style={{ fontSize: "0.78rem", color: "#475569",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.preview}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
