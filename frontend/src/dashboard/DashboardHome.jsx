import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { useLinkedIn } from "../context/LinkedInContext";

function timeAgo(iso) {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}

export default function DashboardHome() {
  const user = auth.currentUser;
  const { discordUser, isConnected, guilds, messages, refreshGuilds, fetchMessages, getBotInviteUrl, getDiscordAuthUrl, disconnectDiscord, loading } = useDiscord();
  const { googleUser, isConnected: googleConnected, emails, events, fetchEmails, fetchEvents, getGoogleAuthUrl, disconnectGoogle } = useGoogle();
  const { linkedInUser, isConnected: linkedInConnected, posts: linkedInPosts, postsUnavailable: linkedInPostsUnavailable, fetchPosts: fetchLinkedInPosts, disconnectLinkedIn, getLinkedInAuthUrl } = useLinkedIn();
  const [greeting, setGreeting] = useState("Good morning");
  const [msgSource, setMsgSource] = useState("");
  const hasAutoFetchedGoogle = useRef(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";

  // Safe one-time auto-fetch when Discord connects
  const hasAutoFetched = useRef(false);
  useEffect(() => {
    if (isConnected && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      console.log("🔵 Auto-fetching messages once");
      fetchMessages();
    }
  }, [isConnected, fetchMessages]);

  // Safe one-time auto-fetch when Google connects
  useEffect(() => {
    if (googleConnected && !hasAutoFetchedGoogle.current) {
      hasAutoFetchedGoogle.current = true;
      console.log("🔵 Auto-fetching Google data once");
      fetchEmails();
      fetchEvents();
    }
  }, [googleConnected, fetchEmails, fetchEvents]);

  // Reset auto-fetch flag when user returns from another tab (e.g., Discord invite)
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected) {
        console.log("🔵 Window focused — resetting auto-fetch flag");
        hasAutoFetched.current = false;
        fetchMessages().then((data) => {
          if (data?.source) setMsgSource(data.source);
        });
      }
      if (googleConnected) {
        hasAutoFetchedGoogle.current = false;
        fetchEmails();
        fetchEvents();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isConnected, googleConnected, fetchMessages, fetchEmails, fetchEvents]);

  // Debug: log messages state on each render
  console.log("🔵 DashboardHome render:", { isConnected, messagesCount: messages.length, guildsCount: guilds.length, loading });

  return (
    <div className="page-content" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Sora', cursive",
          fontSize: "1.9rem",
          margin: "0 0 8px",
          background: "linear-gradient(135deg, #4DEEEA 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {greeting}, {displayName} 👋
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
          Here's your AI-powered communication overview
        </p>
      </div>

      {/* Quick Stats — all computed from live data */}
      {(() => {
        const stats = [
          {
            label: "Discord Messages",
            val: isConnected ? messages.length : "—",
            change: isConnected ? `${guilds.length} guild${guilds.length !== 1 ? "s" : ""} connected` : "Not connected",
            color: "#5865F2", icon: "💬",
          },
          {
            label: "Unread Emails",
            val: googleConnected ? emails.filter(e => e.unread).length : "—",
            change: googleConnected ? `${emails.length} emails fetched` : "Not connected",
            color: "#EA4335", icon: "📧",
          },
          {
            label: "Upcoming Events",
            val: googleConnected ? events.length : "—",
            change: googleConnected ? "From Google Calendar" : "Not connected",
            color: "#34A853", icon: "📅",
          },
          {
            label: "Services Active",
            val: (isConnected ? 1 : 0) + (googleConnected ? 2 : 0) + (linkedInConnected ? 1 : 0),
            change: [isConnected && "Discord", googleConnected && "Gmail", googleConnected && "Calendar", linkedInConnected && "LinkedIn"].filter(Boolean).join(", ") || "None connected",
            color: "#a78bfa", icon: "🔗",
          },
        ];
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                padding: "20px 24px", borderRadius: 16,
                background: "var(--bg-card)", border: `1px solid ${s.color}30`,
                backdropFilter: "blur(8px)", transition: "transform 0.2s, border-color 0.2s", cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${s.color}60`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${s.color}30`; }}
              >
                <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, fontFamily: "'Sora', cursive", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{s.label}</div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 3 }}>{s.change}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Discord Status + Google Status + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {/* Discord Status Card */}
        <div style={{
          padding: "24px",
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid rgba(114,76,255,0.2)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: "1.2rem" }}>🔗</span>
            <h2 style={{ fontFamily: "'Sora', cursive", fontSize: "1.1rem", margin: 0 }}>Discord Status</h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.68rem",
              padding: "3px 10px",
              borderRadius: 100,
              background: isConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              color: isConnected ? "#34D399" : "#ef4444",
              fontWeight: 600,
            }}>
              {isConnected ? "● Connected" : "● Disconnected"}
            </span>
          </div>

          {isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.1)",
              }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>Logged in as</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  @{discordUser?.discord_username || "Unknown"}
                </div>
              </div>

              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Joined Guilds</div>
                  <span
                    onClick={() => refreshGuilds()}
                    style={{ fontSize: "0.68rem", color: "#4DEEEA", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
                  >
                    ↻ refresh
                  </span>
                </div>
                {guilds.length > 0 ? guilds.map((g) => (
                  <div key={g.id} style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                    fontSize: "0.82rem",
                  }}>
                    <span>🏰</span>
                    <span style={{ color: "#cbd5e1", flex: 1 }}>{g.name}</span>
                    {g.owner ? (
                      <button
                        onClick={async () => {
                          try {
                            const url = await getBotInviteUrl(g.id);
                            window.open(url, "_blank");
                          } catch (e) {
                            console.error("Invite failed:", e);
                          }
                        }}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(88,101,242,0.3)",
                          background: "rgba(88,101,242,0.1)",
                          color: "#5865F2",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                        }}
                        title="Invite bot to this server to read messages"
                      >
                        + Invite Bot
                      </button>
                    ) : (
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: "0.6rem",
                        color: "#64748b",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}>
                        Admin only
                      </span>
                    )}
                  </div>
                )) : (
                  <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                    No guilds loaded —{" "}
                    <span
                      onClick={refreshGuilds}
                      style={{ color: "#4DEEEA", cursor: "pointer", textDecoration: "underline" }}
                    >refresh</span>
                  </div>
                )}
                <div style={{
                  marginTop: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.12)",
                  fontSize: "0.7rem",
                  color: "#f59e0b",
                  lineHeight: 1.5,
                }}>
                  ℹ️ Discord only shows servers where you have <b>Manage Server</b> permission.{" "}
                  <span
                    onClick={async () => {
                      try {
                        const url = await getBotInviteUrl("");
                        await navigator.clipboard.writeText(url);
                        alert("Bot invite link copied! Share it with server owners.");
                      } catch (e) { console.error(e); }
                    }}
                    style={{ color: "#f59e0b", textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}
                  >
                    📋 Copy invite link
                  </span>{" "}
                  to share with admins.
                </div>
              </div>

              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Recent Messages
                    {msgSource && (
                      <span style={{
                        marginLeft: 6,
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontSize: "0.6rem",
                        background: msgSource === "mock" ? "rgba(245,158,11,0.1)" : "rgba(52,211,153,0.1)",
                        color: msgSource === "mock" ? "#f59e0b" : "#34D399",
                        border: `1px solid ${msgSource === "mock" ? "rgba(245,158,11,0.2)" : "rgba(52,211,153,0.2)"}`,
                      }}>
                        {msgSource === "mock" ? "DEMO" : "LIVE"}
                      </span>
                    )}
                  </div>
                  <span
                    onClick={() => {
                      hasAutoFetched.current = false;
                      fetchMessages().then((data) => {
                        if (data?.source) setMsgSource(data.source);
                      });
                    }}
                    style={{ fontSize: "0.68rem", color: "#4DEEEA", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
                  >
                    ↻ refresh
                  </span>
                </div>
                {loading && messages.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      display: "inline-block", width: 10, height: 10,
                      border: "2px solid #4DEEEA33", borderTop: "2px solid #4DEEEA",
                      borderRadius: "50%", animation: "spin 0.8s linear infinite"
                    }} />
                    Loading messages…
                    <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : messages.length > 0 ? messages.slice(0, 3).map((m, i) => (
                  <div key={m.id || i} style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(77,238,234,0.04)",
                    border: "1px solid rgba(77,238,234,0.08)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4DEEEA" }}>
                        {m._channel_name || m.author?.username || "Unknown"}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#475569" }}>
                        {m._channel_type === "dm" ? "DM" : "Guild"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.4 }}>
                      {m.content?.substring(0, 80)}{m.content?.length > 80 ? "…" : ""}
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 10 }}>
                      No messages loaded yet
                    </div>
                    <button
                      onClick={() => {
                        hasAutoFetched.current = false;
                        fetchMessages().then((data) => {
                          if (data?.source) setMsgSource(data.source);
                        });
                      }}
                      disabled={loading}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid rgba(77,238,234,0.3)",
                        background: "rgba(77,238,234,0.08)",
                        color: "#4DEEEA",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: loading ? "default" : "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Loading…" : "📥 Load Messages"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              padding: "24px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.1)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔌</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Connect Discord to start receiving AI-powered summaries
              </div>
              <a
                href="/dashboard/profile"
                style={{
                  display: "inline-block",
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #4DEEEA22, #a78bfa22)",
                  border: "1px solid rgba(77,238,234,0.3)",
                  color: "#4DEEEA",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                Connect Now →
              </a>
            </div>
          )}
        </div>

        {/* Google Status + Data */}
        <div style={{
          padding: "24px",
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid rgba(66,133,244,0.2)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: "1.2rem" }}>📧</span>
            <h2 style={{ fontFamily: "'Sora', cursive", fontSize: "1.1rem", margin: 0 }}>Google Status</h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.68rem",
              padding: "3px 10px",
              borderRadius: 100,
              background: googleConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              color: googleConnected ? "#34D399" : "#ef4444",
              fontWeight: 600,
            }}>
              {googleConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          {googleConnected ? (
            <>
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.1)",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>Logged in as</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  {googleUser?.email || "Unknown"}
                </div>
              </div>

              {/* Gmail */}
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Recent Emails</div>
                  <span
                    onClick={() => fetchEmails()}
                    style={{ fontSize: "0.68rem", color: "#4285F4", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
                  >
                    ↻ refresh
                  </span>
                </div>
                {emails.length > 0 ? emails.slice(0, 3).map((e, i) => (
                  <div key={e.id || i} style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(66,133,244,0.04)",
                    border: "1px solid rgba(66,133,244,0.08)",
                  }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4285F4", marginBottom: 3 }}>
                      {e.subject}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      From: {e.from}
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: "0.8rem", color: "#475569", textAlign: "center", padding: "10px 0" }}>
                    No emails loaded
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Upcoming Events</div>
                  <span
                    onClick={() => fetchEvents()}
                    style={{ fontSize: "0.68rem", color: "#EA4335", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
                  >
                    ↻ refresh
                  </span>
                </div>
                {events.length > 0 ? events.slice(0, 3).map((e, i) => (
                  <div key={e.id || i} style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(234,67,53,0.04)",
                    border: "1px solid rgba(234,67,53,0.08)",
                  }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#EA4335", marginBottom: 3 }}>
                      {e.summary || "No title"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      {e.start?.dateTime || e.start?.date || "No date"}
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: "0.8rem", color: "#475569", textAlign: "center", padding: "10px 0" }}>
                    No events loaded
                  </div>
                )}
              </div>

              <button
                onClick={disconnectGoogle}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Disconnect Google
              </button>
            </>
          ) : (
            <div style={{
              padding: "24px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.1)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔌</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Connect Google to see Gmail and Calendar
              </div>
              <button
                onClick={() => {
                  try {
                    const url = getGoogleAuthUrl();
                    window.location.replace(url);
                  } catch (e) {
                    console.error("Google auth failed:", e);
                    alert("Error: " + e.message);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #4285F422, #34A85322)",
                  border: "1px solid rgba(66,133,244,0.3)",
                  color: "#4285F4",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Connect Google →
              </button>
            </div>
          )}
        </div>


        {/* LinkedIn Status + Posts */}
        <div style={{
          padding: "24px",
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid rgba(10,102,194,0.2)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <h2 style={{ fontFamily: "'Sora', cursive", fontSize: "1.1rem", margin: 0 }}>LinkedIn Status</h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.68rem",
              padding: "3px 10px",
              borderRadius: 100,
              background: linkedInConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
              color: linkedInConnected ? "#34D399" : "#ef4444",
              fontWeight: 600,
            }}>
              {linkedInConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          {linkedInConnected ? (
            <>
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.1)",
                marginBottom: 16,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {linkedInUser?.picture ? (
                  <img src={linkedInUser.picture} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,#0A66C2,#00a0dc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", color: "#fff", fontWeight: 700
                  }}>
                    {linkedInUser?.name?.charAt(0)?.toUpperCase() || "L"}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 2 }}>Connected as</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{linkedInUser?.name || "LinkedIn User"}</div>
                </div>
              </div>

              {/* LinkedIn Activity */}
              <div style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Activity</div>
                  <span
                    onClick={() => fetchLinkedInPosts()}
                    style={{ fontSize: "0.68rem", color: "#0A66C2", cursor: "pointer" }}
                  >
                    ↻ refresh
                  </span>
                </div>

                {linkedInPostsUnavailable ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { label: "📰 My Feed",        href: "https://www.linkedin.com/feed/" },
                      { label: "🔔 Notifications",  href: "https://www.linkedin.com/notifications/" },
                      { label: "💬 Messages",       href: "https://www.linkedin.com/messaging/" },
                      { label: "🤝 My Network",     href: "https://www.linkedin.com/mynetwork/" },
                    ].map(link => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "9px 12px", borderRadius: 8,
                          background: "rgba(10,102,194,0.05)",
                          border: "1px solid rgba(10,102,194,0.12)",
                          color: "#0A66C2", fontSize: "0.82rem", fontWeight: 600,
                          textDecoration: "none", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(10,102,194,0.12)"; e.currentTarget.style.borderColor = "rgba(10,102,194,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(10,102,194,0.05)"; e.currentTarget.style.borderColor = "rgba(10,102,194,0.12)"; }}
                      >
                        {link.label}
                        <svg style={{ marginLeft: "auto", opacity: 0.4 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ))}
                  </div>
                ) : linkedInPosts.length > 0 ? linkedInPosts.slice(0, 3).map((p, i) => (
                  <div key={p.id || i} style={{
                    marginBottom: 10, padding: "8px 10px", borderRadius: 8,
                    background: "rgba(10,102,194,0.04)", border: "1px solid rgba(10,102,194,0.08)",
                  }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {(p.text || "").substring(0, 80)}{(p.text?.length || 0) > 80 ? "…" : ""}
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
                    No activity loaded
                  </div>
                )}
              </div>

              <button
                onClick={disconnectLinkedIn}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Disconnect LinkedIn
              </button>
            </>
          ) : (
            <div style={{
              padding: "24px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.1)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Connect LinkedIn to see your professional network activity
              </div>
              <button
                onClick={() => {
                  try {
                    const url = getLinkedInAuthUrl();
                    window.open(url, "LinkedIn OAuth", "width=600,height=700");
                  } catch (e) {
                    console.error("LinkedIn auth failed:", e);
                    alert("Error: " + e.message);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #0A66C222, #00a0dc22)",
                  border: "1px solid rgba(10,102,194,0.3)",
                  color: "#0A66C2",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Connect LinkedIn →
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          padding: "24px",
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid rgba(77,238,234,0.15)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <h2 style={{ fontFamily: "'Sora', cursive", fontSize: "1.1rem", margin: 0 }}>Recent Activity</h2>
          </div>

          {(() => {
            const activity = [
              ...messages.slice(0, 4).map((m, i) => ({
                id: "d" + i,
                text: `Discord — @${m.author?.username || m._channel_name || "Unknown"}: ${(m.content || "").substring(0, 60)}${(m.content?.length || 0) > 60 ? "…" : ""}`,
                time: timeAgo(m.timestamp),
                color: "#5865F2",
              })),
              ...emails.slice(0, 3).map((e, i) => ({
                id: "g" + i,
                text: `Gmail — ${e.subject || "(No Subject)"} from ${(e.from || "").split("<")[0].trim()}`,
                time: e.date || "",
                color: "#EA4335",
              })),
              ...events.slice(0, 2).map((e, i) => ({
                id: "c" + i,
                text: `Calendar — ${e.summary || "Untitled event"}`,
                time: e.start ? new Date(e.start).toLocaleDateString() : "",
                color: "#34A853",
              })),
            ];

            if (activity.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#475569", fontSize: "0.85rem" }}>
                  No activity yet — connect Discord or Google to see live updates.
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activity.map(item => (
                  <div key={item.id} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    transition: "background 0.2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, boxShadow: `0 0 8px ${item.color}`, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.83rem", lineHeight: 1.5, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</div>
                      <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: 2 }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        marginTop: 20,
        padding: "20px 24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid rgba(167,139,250,0.15)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: "1.2rem" }}>🚀</span>
          <h3 style={{ fontFamily: "'Sora', cursive", fontSize: "1rem", margin: 0 }}>Quick Actions</h3>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "📰 Today's Digest", href: "/dashboard/digest", color: "#4DEEEA" },
            { label: "📊 View Insights", href: "/dashboard/insights", color: "#a78bfa" },
            { label: "📁 Browse Archive", href: "/dashboard/archive", color: "#34D399" },
            { label: "🔔 Notifications", href: "/dashboard/notifications", color: "#f59e0b" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: `${action.color}0D`,
                border: `1px solid ${action.color}25`,
                color: action.color,
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${action.color}20`;
                e.currentTarget.style.borderColor = `${action.color}50`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${action.color}0D`;
                e.currentTarget.style.borderColor = `${action.color}25`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
