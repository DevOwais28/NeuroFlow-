import { useState, useEffect } from "react";
import { useDiscord } from "../context/DiscordContext";
import { auth } from "../firebase";

export default function DiscordSettings() {
  const {
    discordUser,
    guilds,
    loading,
    error,
    isConnected,
    disconnectDiscord,
    refreshGuilds,
    getDiscordAuthUrl
  } = useDiscord();

  const [showGuilds, setShowGuilds] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      const timer = setTimeout(() => setLocalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle Discord connect
  const handleConnect = async () => {
    console.log("🔵 Connect button clicked");
    
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      console.error("🔴 User not authenticated");
      setLocalError("Please log in first to connect Discord");
      return;
    }
    
    console.log("🟢 User authenticated:", user.uid);
    
    try {
      setLocalError(null);
      console.log("🔵 Calling getDiscordAuthUrl...");
      const authUrl = await getDiscordAuthUrl();
      console.log("🟢 Got auth URL:", authUrl);
      window.location.href = authUrl;
    } catch (err) {
      console.error("🔴 Discord connect error:", err);
      setLocalError(err.message);
    }
  };

  // Handle Discord disconnect
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Discord account?")) {
      return;
    }
    
    try {
      setLocalError(null);
      await disconnectDiscord();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  // Handle refresh guilds
  const handleRefreshGuilds = async () => {
    try {
      setLocalError(null);
      await refreshGuilds();
      setShowGuilds(true);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div style={{
      padding: "24px",
      borderRadius: "16px",
      background: "var(--bg-card)",
      border: "1px solid var(--border-primary)",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: "1.2rem",
        fontWeight: 700,
        marginBottom: "16px",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <span style={{ fontSize: "1.5rem" }}>💬</span>
        Discord Integration
      </h2>

      {localError && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
          marginBottom: "16px",
          fontSize: "0.9rem"
        }}>
          {localError}
        </div>
      )}

      {isConnected ? (
        <div>
          {/* Connected State */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(77, 238, 234, 0.05)",
            border: "1px solid rgba(77, 238, 234, 0.2)",
            marginBottom: "16px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5865F2, #7289DA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem"
            }}>
              🎮
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "4px"
              }}>
                {discordUser?.discord_username}
              </div>
              <div style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)"
              }}>
                {discordUser?.discord_email}
              </div>
              <div style={{
                fontSize: "0.75rem",
                color: "#34D399",
                marginTop: "4px"
              }}>
                ● Connected
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={handleRefreshGuilds}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Loading..." : "🔄 Refresh Servers"}
            </button>
            
            <button
              onClick={() => setShowGuilds(!showGuilds)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              {showGuilds ? "Hide Servers" : "📋 View Servers"}
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: loading ? 0.6 : 1
              }}
            >
              Disconnect
            </button>
          </div>

          {/* Guilds List */}
          {showGuilds && guilds.length > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)"
            }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "12px",
                color: "var(--text-primary)"
              }}>
                Your Discord Servers ({guilds.length})
              </h3>
              <div style={{
                display: "grid",
                gap: "8px"
              }}>
                {guilds.map((guild) => (
                  <div
                    key={guild.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-primary)"
                    }}
                  >
                    {guild.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%"
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#5865F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "white"
                      }}>
                        {guild.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontSize: "0.9rem"
                      }}>
                        {guild.name}
                      </div>
                      {guild.owner && (
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#fbbf24"
                        }}>
                          👑 Owner
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showGuilds && guilds.length === 0 && !loading && (
            <div style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-muted)",
              textAlign: "center"
            }}>
              No servers found. Click "Refresh Servers" to fetch your Discord servers.
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Not Connected State */}
          <p style={{
            color: "var(--text-secondary)",
            marginBottom: "20px",
            lineHeight: 1.6
          }}>
            Connect your Discord account to receive important updates, notifications, 
            and see your server activity directly in NeuroFlow.
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #5865F2, #7289DA)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "scale(1.02)";
                e.target.style.boxShadow = "0 4px 20px rgba(88, 101, 242, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>💬</span>
            {loading ? "Connecting..." : "Connect Discord"}
          </button>

          <div style={{
            marginTop: "16px",
            fontSize: "0.85rem",
            color: "var(--text-muted)"
          }}>
            You will be redirected to Discord to authorize access.
          </div>
        </div>
      )}
    </div>
  );
}
