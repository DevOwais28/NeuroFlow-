import { useState, useCallback } from "react";
import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PRIORITY_STYLES = {
  high:   { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   dot: "#ef4444",  label: "High"   },
  medium: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  dot: "#f59e0b",  label: "Medium" },
  low:    { bg: "rgba(77,238,234,0.06)",  border: "rgba(77,238,234,0.15)", dot: "#4DEEEA",  label: "Low"    },
};

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function DigestPage() {
  const { isConnected: discordConnected, messages, fetchMessages, loading: dLoading } = useDiscord();
  const { isConnected: googleConnected, emails, events, fetchEmails, fetchEvents, loading: gLoading } = useGoogle();

  const [aiResult, setAiResult]     = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState("");
  const [tasks, setTasks]           = useState([]);
  const [doneIds, setDoneIds]       = useState(new Set());
  const [expandedMsgId, setExpandedMsgId] = useState(null);
  const [expandedEmailId, setExpandedEmailId] = useState(null);

  const loading = dLoading || gLoading;
  const hasData = messages.length > 0 || emails.length > 0 || events.length > 0;

  const runGemini = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const u = auth.currentUser;
      const token = u ? await u.getIdToken() : null;

      const body = {
        messages: messages.slice(0, 30).map(m => ({
          author: m.author?.username || m._channel_name || "Unknown",
          content: m.content || "",
          timestamp: m.timestamp || "",
          channel: m._channel_name || "",
        })),
        emails: emails.slice(0, 20).map(e => ({
          subject: e.subject || "",
          from_: e.from || "",
          snippet: e.snippet || "",
          date: e.date || "",
          unread: e.unread || false,
        })),
        events: events.slice(0, 10).map(ev => ({
          summary: ev.summary || "",
          start: typeof ev.start === "object" ? ev.start?.dateTime || ev.start?.date || "" : ev.start || "",
          location: ev.location || "",
        })),
      };

      const res = await fetch(`${API_URL}/ai/digest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "AI request failed");
      }

      const data = await res.json();
      setAiResult(data);
      setTasks(data.tasks || []);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [messages, emails, events]);

  const toggleDone = id => setDoneIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const noneConnected = !discordConnected && !googleConnected;
  const doneCount = tasks.filter((_, i) => doneIds.has(i)).length;

  return (
    <div className="page-content" style={{ color: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.8rem", margin: "0 0 6px",
            background: "linear-gradient(135deg,#4DEEEA,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Today's Digest
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" · "}{messages.length} messages · {emails.length} emails · {events.length} events
          </p>
        </div>

        {/* Gemini Button */}
        <button
          onClick={runGemini}
          disabled={aiLoading || !hasData}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 22px", borderRadius: 12, border: "none", cursor: aiLoading || !hasData ? "default" : "pointer",
            background: aiLoading ? "rgba(167,139,250,0.08)" : "linear-gradient(135deg,rgba(66,133,244,0.25),rgba(167,139,250,0.25))",
            color: "#a78bfa", fontWeight: 700, fontSize: "0.9rem", fontFamily: "'Sora',cursive",
            opacity: !hasData ? 0.4 : 1,
            boxShadow: "0 0 24px rgba(167,139,250,0.2)",
            transition: "all 0.2s",
          }}
        >
          {aiLoading ? (
            <>
              <span style={{ width: 14, height: 14, border: "2px solid #a78bfa33", borderTop: "2px solid #a78bfa", borderRadius: "50%", display:"inline-block", animation: "spin 0.8s linear infinite" }} />
              Analyzing…
              <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
            </>
          ) : (
            <>✨ Gemini Summarize</>
          )}
        </button>
      </div>

      {/* Connect prompt */}
      {noneConnected && (
        <div style={{ padding: "40px", textAlign: "center", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔌</div>
          <p style={{ color: "#64748b", marginBottom: 16 }}>Connect Discord or Google to generate your digest.</p>
          <Link to="/dashboard/profile" style={{ padding: "9px 22px", borderRadius: 8, background: "rgba(77,238,234,0.1)", border: "1px solid rgba(77,238,234,0.3)", color: "#4DEEEA", textDecoration: "none", fontWeight: 600 }}>
            Connect Services →
          </Link>
        </div>
      )}

      {/* AI Error */}
      {aiError && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.85rem" }}>
          ⚠️ {aiError}
        </div>
      )}

      {/* Gemini Result */}
      {aiResult && (
        <div style={{ marginBottom: 28, padding: "24px", borderRadius: 16, background: "linear-gradient(135deg,rgba(66,133,244,0.06),rgba(167,139,250,0.06))", border: "1px solid rgba(167,139,250,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: "1.3rem" }}>✨</span>
            <h2 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: 0, color: "#a78bfa" }}>Gemini Summary</h2>
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "#cbd5e1", marginBottom: 16 }}>{aiResult.summary}</p>

          {aiResult.highlights?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Key Highlights</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {aiResult.highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasks from Gemini */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 28, padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: "1.2rem" }}>✅</span>
            <h2 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: 0 }}>AI-Extracted Tasks</h2>
            <span style={{ marginLeft: "auto", fontSize: "0.72rem", padding: "2px 10px", borderRadius: 100, background: "rgba(52,211,153,0.1)", color: "#34D399", fontWeight: 600 }}>
              {doneCount}/{tasks.length} done
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((t, i) => {
              const s = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium;
              const done = doneIds.has(i);
              return (
                <div key={i} onClick={() => toggleDone(i)} style={{
                  display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  background: done ? "rgba(52,211,153,0.04)" : s.bg, border: done ? "1px solid rgba(52,211,153,0.1)" : `1px solid ${s.border}`,
                  transition: "all 0.2s",
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: done ? "2px solid #34D399" : `2px solid ${s.dot}`,
                    background: done ? "#34D399" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#03050f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.87rem", textDecoration: done ? "line-through" : "none", color: done ? "#475569" : "#F8FAFC", transition: "all 0.2s" }}>{t.text}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: "0.65rem", padding: "1px 7px", borderRadius: 100, background: `${s.dot}18`, color: s.dot, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontSize: "0.68rem", color: "#475569" }}>From {t.source}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid-2col" style={{ marginBottom: 20 }}>
        {/* All Discord Messages */}
        {discordConnected && (
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(88,101,242,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: "1.2rem" }}>💬</span>
              <h2 style={{ fontFamily: "'Sora',cursive", fontSize: "1rem", margin: 0 }}>Discord Messages</h2>
              <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#5865F2", cursor: "pointer", opacity: dLoading ? 0.5 : 1 }}
                onClick={fetchMessages}>↻</span>
            </div>
            {messages.length === 0 ? (
              <div style={{ color: "#475569", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
                {dLoading ? "Loading…" : "No messages — click ↻ to load"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                {messages.map((m, i) => {
                  const id = m.id || i;
                  const expanded = expandedMsgId === id;
                  return (
                    <div key={id} onClick={() => setExpandedMsgId(expanded ? null : id)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      background: "rgba(88,101,242,0.05)", border: "1px solid rgba(88,101,242,0.1)",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5865F2" }}>@{m.author?.username || m._channel_name || "Unknown"}</span>
                        <span style={{ fontSize: "0.65rem", color: "#475569" }}>{m.timestamp ? formatDate(m.timestamp) : ""}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5,
                        ...(expanded ? {} : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }}>
                        {m.content || "(no content)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Gmail Emails */}
        {googleConnected && (
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(234,67,53,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: "1.2rem" }}>📧</span>
              <h2 style={{ fontFamily: "'Sora',cursive", fontSize: "1rem", margin: 0 }}>Gmail Emails</h2>
              <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#EA4335", cursor: "pointer", opacity: gLoading ? 0.5 : 1 }}
                onClick={fetchEmails}>↻</span>
            </div>
            {emails.length === 0 ? (
              <div style={{ color: "#475569", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
                {gLoading ? "Loading…" : "No emails — click ↻ to load"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                {emails.map((e, i) => {
                  const id = e.id || i;
                  const expanded = expandedEmailId === id;
                  return (
                    <div key={id} onClick={() => setExpandedEmailId(expanded ? null : id)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      background: e.unread ? "rgba(234,67,53,0.07)" : "rgba(255,255,255,0.02)",
                      border: e.unread ? "1px solid rgba(234,67,53,0.2)" : "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {e.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EA4335", display: "inline-block", flexShrink: 0 }} />}
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#EA4335",
                          ...(expanded ? {} : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }), flex: 1 }}>
                          {e.subject || "(No Subject)"}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "#475569", flexShrink: 0 }}>{e.date}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 3 }}>From: {e.from}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5,
                        ...(expanded ? {} : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }}>
                        {e.snippet}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar Events — full list */}
      {googleConnected && events.length > 0 && (
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(7,11,26,0.6)", border: "1px solid rgba(52,211,153,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: "1.2rem" }}>📅</span>
            <h2 style={{ fontFamily: "'Sora',cursive", fontSize: "1rem", margin: 0 }}>Upcoming Events</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
            {events.map((ev, i) => (
              <div key={ev.id || i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.1)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.87rem", color: "#34D399", marginBottom: 4 }}>{ev.summary || "Untitled"}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{formatDate(typeof ev.start === "object" ? ev.start?.dateTime || ev.start?.date : ev.start)}</div>
                {ev.location && <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: 3 }}>📍 {ev.location}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
