import { useState } from "react";
import { auth } from "../firebase";
import { useDiscord } from "../context/DiscordContext";
import { useGoogle } from "../context/GoogleContext";
import { useLinkedIn } from "../context/LinkedInContext";

export default function ProfilePage() {
  const user = auth.currentUser;
  const [saved, setSaved] = useState(false);
  const [discordConnecting, setDiscordConnecting] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [linkedInConnecting, setLinkedInConnecting] = useState(false);
  const { discordUser, isConnected: discordConnected, disconnectDiscord, getDiscordAuthUrl } = useDiscord();
  const { googleUser, isConnected: googleConnected, disconnectGoogle, getGoogleAuthUrl } = useGoogle();
  const { linkedInUser, isConnected: linkedInConnected, disconnectLinkedIn, getLinkedInAuthUrl } = useLinkedIn();

  const [settings, setSettings] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    notifications: true,
    weeklyReport: true,
    focusMode: false,
    aiAggression: "balanced",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content" style={{ color: "var(--text-primary)" }}>
      <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.8rem", margin: "0 0 8px" }}>Profile & Settings</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 32px" }}>
        Manage your account and NeuroFlow preferences
      </p>

      {/* Profile Card */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "rgba(7,11,26,0.6)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        marginBottom: 24,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#4DEEEA,#34D399)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#03050f",
        }}>
          {user?.email?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 4 }}>{user?.displayName || "User"}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{user?.email}</div>
          <div style={{
            display: "inline-block",
            marginTop: 6,
            padding: "2px 10px",
            borderRadius: 100,
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.2)",
            fontSize: "0.7rem",
            color: "#34D399",
            fontWeight: 600,
          }}>
            Verified
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        marginBottom: 24,
      }}>
        <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: "0 0 20px" }}>Account</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>Display Name</label>
            <input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>Email</label>
            <input
              value={settings.email}
              disabled
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* Discord Integration */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: discordConnected ? "1px solid rgba(88,101,242,0.3)" : "1px solid var(--border-primary)",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {/* Discord logo */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.927 19.927 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: 0 }}>Discord Integration</h3>
          <span style={{
            marginLeft: "auto",
            fontSize: "0.68rem",
            padding: "3px 10px",
            borderRadius: 100,
            background: discordConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
            color: discordConnected ? "#34D399" : "#ef4444",
            fontWeight: 600,
          }}>
            {discordConnected ? "● Connected" : "● Not connected"}
          </span>
        </div>

        {discordConnected ? (
          <div>
            <div style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(88,101,242,0.07)",
              border: "1px solid rgba(88,101,242,0.15)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg,#5865F2,#4DEEEA)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", color: "#fff", fontWeight: 700,
              }}>
                {discordUser?.discord_username?.charAt(0)?.toUpperCase() || "D"}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  @{discordUser?.discord_username || "Unknown"}
                </div>
                {discordUser?.discord_email && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {discordUser.discord_email}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
              To get DM message access, disconnect and reconnect with the new permissions.
            </p>
            <button
              onClick={async () => {
                await disconnectDiscord();
              }}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.07)",
                color: "#ef4444",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              }}
            >
              Disconnect Discord
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 14px" }}>
              Link your Discord account to get AI-powered summaries of your messages and server activity.
            </p>
            <button
              onClick={async () => {
                setDiscordConnecting(true);
                try {
                  const url = await getDiscordAuthUrl();
                  window.location.href = url;
                } catch (e) {
                  console.error(e);
                  setDiscordConnecting(false);
                }
              }}
              disabled={discordConnecting}
              style={{
                padding: "9px 22px",
                borderRadius: 8,
                border: "1px solid rgba(88,101,242,0.4)",
                background: discordConnecting ? "rgba(88,101,242,0.05)" : "rgba(88,101,242,0.12)",
                color: "#5865F2",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: discordConnecting ? "default" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={e => {
                if (!discordConnecting) e.currentTarget.style.background = "rgba(88,101,242,0.2)";
              }}
              onMouseLeave={e => {
                if (!discordConnecting) e.currentTarget.style.background = "rgba(88,101,242,0.12)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.927 19.927 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              {discordConnecting ? "Redirecting…" : "Connect Discord"}
            </button>
          </div>
        )}
      </div>

      {/* Google Integration */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: googleConnected ? "1px solid rgba(66,133,244,0.3)" : "1px solid var(--border-primary)",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {/* Google logo */}
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: 0 }}>Google Integration</h3>
          <span style={{
            marginLeft: "auto", fontSize: "0.68rem", padding: "3px 10px",
            borderRadius: 100,
            background: googleConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
            color: googleConnected ? "#34D399" : "#ef4444",
            fontWeight: 600,
          }}>
            {googleConnected ? "● Connected" : "● Not connected"}
          </span>
        </div>

        {googleConnected ? (
          <div>
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(66,133,244,0.07)",
              border: "1px solid rgba(66,133,244,0.15)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
            }}>
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4285F4,#34A853)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", color: "#fff", fontWeight: 700,
                }}>
                  {googleUser?.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{googleUser?.name || "Google User"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{googleUser?.email}</div>
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
              Gmail and Google Calendar are active. Emails and events will appear on your dashboard.
            </p>
            <button
              onClick={disconnectGoogle}
              style={{
                padding: "9px 20px", borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.07)",
                color: "#ef4444", fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
            >
              Disconnect Google
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 14px" }}>
              Connect Google to sync your Gmail inbox and upcoming Calendar events directly into NeuroFlow.
            </p>
            <button
              onClick={() => {
                try {
                  const url = getGoogleAuthUrl();
                  console.log("🔵 Redirecting to:", url);
                  window.location.replace(url);
                } catch (e) {
                  console.error("🔴 Google connect error:", e);
                  alert("Connect failed: " + e.message);
                }
              }}
              disabled={googleConnecting}
              style={{
                padding: "9px 22px", borderRadius: 8,
                border: "1px solid rgba(66,133,244,0.4)",
                background: googleConnecting ? "rgba(66,133,244,0.05)" : "rgba(66,133,244,0.12)",
                color: "#4285F4", fontSize: "0.85rem", fontWeight: 600,
                cursor: googleConnecting ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { if (!googleConnecting) e.currentTarget.style.background = "rgba(66,133,244,0.2)"; }}
              onMouseLeave={e => { if (!googleConnecting) e.currentTarget.style.background = "rgba(66,133,244,0.12)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleConnecting ? "Redirecting…" : "Connect Google"}
            </button>
          </div>
        )}
      </div>

      {/* LinkedIn Integration */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: linkedInConnected ? "1px solid rgba(10,102,194,0.3)" : "1px solid var(--border-primary)",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          {/* LinkedIn logo */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: 0 }}>LinkedIn Integration</h3>
          <span style={{
            marginLeft: "auto", fontSize: "0.68rem", padding: "3px 10px",
            borderRadius: 100,
            background: linkedInConnected ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
            color: linkedInConnected ? "#34D399" : "#ef4444",
            fontWeight: 600,
          }}>
            {linkedInConnected ? "● Connected" : "● Not connected"}
          </span>
        </div>

        {linkedInConnected ? (
          <div>
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(10,102,194,0.07)",
              border: "1px solid rgba(10,102,194,0.15)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
            }}>
              {linkedInUser?.picture ? (
                <img src={linkedInUser.picture} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg,#0A66C2,#00a0dc)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", color: "#fff", fontWeight: 700,
                }}>
                  {linkedInUser?.name?.charAt(0)?.toUpperCase() || "L"}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{linkedInUser?.name || "LinkedIn User"}</div>
                {linkedInUser?.email && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{linkedInUser.email}</div>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
              LinkedIn is connected. Your professional network activity will appear in your digest.
            </p>
            <button
              onClick={disconnectLinkedIn}
              style={{
                padding: "9px 20px", borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.07)",
                color: "#ef4444", fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
            >
              Disconnect LinkedIn
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 14px" }}>
              Connect LinkedIn to sync your professional network activity and get AI summaries of important updates.
            </p>
            <button
              onClick={() => {
                setLinkedInConnecting(true);
                try {
                  const url = getLinkedInAuthUrl();
                  window.open(url, "LinkedIn OAuth", "width=600,height=700");
                  setTimeout(() => setLinkedInConnecting(false), 3000);
                } catch (e) {
                  console.error("LinkedIn connect error:", e);
                  alert("Connect failed: " + e.message);
                  setLinkedInConnecting(false);
                }
              }}
              disabled={linkedInConnecting}
              style={{
                padding: "9px 22px", borderRadius: 8,
                border: "1px solid rgba(10,102,194,0.4)",
                background: linkedInConnecting ? "rgba(10,102,194,0.05)" : "rgba(10,102,194,0.12)",
                color: "#0A66C2", fontSize: "0.85rem", fontWeight: 600,
                cursor: linkedInConnecting ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { if (!linkedInConnecting) e.currentTarget.style.background = "rgba(10,102,194,0.2)"; }}
              onMouseLeave={e => { if (!linkedInConnecting) e.currentTarget.style.background = "rgba(10,102,194,0.12)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {linkedInConnecting ? "Opening…" : "Connect LinkedIn"}
            </button>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        marginBottom: 24,
      }}>
        <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: "0 0 20px" }}>Preferences</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Toggle
            label="Push Notifications"
            desc="Get notified about important messages instantly"
            checked={settings.notifications}
            onChange={(v) => setSettings({ ...settings, notifications: v })}
          />
          <Toggle
            label="Weekly Report"
            desc="Receive a summary of your attention insights every Monday"
            checked={settings.weeklyReport}
            onChange={(v) => setSettings({ ...settings, weeklyReport: v })}
          />
          <Toggle
            label="Focus Mode"
            desc="Only show critical notifications during work hours"
            checked={settings.focusMode}
            onChange={(v) => setSettings({ ...settings, focusMode: v })}
          />

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>AI Filtering Aggression</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["conservative", "balanced", "aggressive"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSettings({ ...settings, aiAggression: opt })}
                  style={{
                    flex: 1,
                    maxWidth: 120,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    background: settings.aiAggression === opt ? "rgba(77,238,234,0.12)" : "var(--bg-secondary)",
                    color: settings.aiAggression === opt ? "var(--accent-cyan)" : "var(--text-muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        padding: "24px",
        borderRadius: 16,
        background: "rgba(239,68,68,0.04)",
        border: "1px solid rgba(239,68,68,0.12)",
      }}>
        <h3 style={{ fontFamily: "'Sora',cursive", fontSize: "1.1rem", margin: "0 0 12px", color: "#ef4444" }}>Danger Zone</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
          Deleting your account will remove all data and cannot be undone.
        </p>
        <button style={{
          padding: "8px 20px",
          borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.08)",
          color: "#ef4444",
          fontSize: "0.8rem",
          cursor: "pointer",
          fontWeight: 500,
        }}>
          Delete Account
        </button>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 28px",
            borderRadius: 100,
            border: "none",
            background: "linear-gradient(135deg,var(--accent-cyan),var(--accent-emerald))",
            color: "var(--bg-primary)",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked ? "var(--accent-cyan)" : "var(--bg-secondary)",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
