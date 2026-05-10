import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DiscordContext = createContext(null);

export function DiscordProvider({ children }) {
  const [discordUser, setDiscordUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  // 🔒 request locks (THIS fixes spam loops)
  const guildsLock = useRef(false);
  const messagesLock = useRef(false);
  const statusLock = useRef(false);
  const hasFetchedStatus = useRef(false);

  // =========================
  // AUTH LISTENER
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Reset status fetch flag when user changes
  useEffect(() => {
    hasFetchedStatus.current = false;
  }, [user?.uid]);

  // =========================
  // DISCORD STATUS
  // =========================
  const fetchDiscordStatus = useCallback(async () => {
    if (!user || statusLock.current || hasFetchedStatus.current) return;

    statusLock.current = true;
    hasFetchedStatus.current = true;

    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_URL}/discord/user/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(id);

      if (!res.ok) {
        hasFetchedStatus.current = false; // retry on next attempt
        return;
      }

      const data = await res.json();
      setDiscordUser(data.connected ? data : null);

      // Auto-fetch guilds if connected (for page reload case)
      if (data.connected) {
        refreshGuilds();
      }
    } catch (err) {
      if (err.name === 'AbortError') console.warn("Discord status check timed out");
      else console.error("Discord status check error:", err);
      // Reset so we can retry on next attempt
      hasFetchedStatus.current = false;
    } finally {
      statusLock.current = false;
    }
  }, [user]);

  // Force refresh status (for use after OAuth callback) - defined AFTER fetchDiscordStatus
  const forceRefreshStatus = useCallback(async () => {
    hasFetchedStatus.current = false;
    statusLock.current = false;
    await fetchDiscordStatus();
  }, [fetchDiscordStatus]);

  useEffect(() => {
    if (user) fetchDiscordStatus();
  }, [user, fetchDiscordStatus]);

  // =========================
  // AUTH URL
  // =========================
  const getDiscordAuthUrl = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch(`${API_URL}/discord/auth-url?uid=${user.uid}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed auth URL");

      const data = await res.json();
      return data.auth_url;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Backend not responding. Please check if the backend is running.");
      }
      throw err;
    }
  }, [user]);

  // =========================
  // BOT INVITE URL
  // =========================
  const getBotInviteUrl = useCallback(async (guildId = "") => {
    const params = guildId ? `?guild_id=${guildId}` : "";
    const url = `${API_URL}/discord/bot-invite${params}`;
    console.log(`🔵 Fetching bot invite URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed bot invite URL");

    const data = await res.json();
    console.log(`🟢 Bot invite URL: ${data.invite_url}`);
    return data.invite_url;
  }, []);

  // =========================
  // CONNECT
  // =========================
  const connectDiscord = useCallback(
    async (code) => {
      if (!user) throw new Error("Not authenticated");

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/discord/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, code }),
        });

        if (!res.ok) throw new Error("Discord connect failed");

        const data = await res.json();

        setDiscordUser({
          connected: true,
          discord_username: data.discord_username,
          discord_email: data.discord_email,
        });

        // Auto-fetch guilds after connecting
        refreshGuilds();

        return data;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // =========================
  // DISCONNECT
  // =========================
  const disconnectDiscord = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const token = await user.getIdToken();

      await fetch(`${API_URL}/discord/disconnect/${user.uid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setDiscordUser(null);
      setGuilds([]);
      setMessages([]);
      hasFetchedStatus.current = false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // =========================
  // GUILDS (FIXED LOOP)
  // =========================
  const refreshGuilds = useCallback(async () => {
    if (!user || guildsLock.current) return;

    guildsLock.current = true;
    setLoading(true);

    try {
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_URL}/discord/guilds/${user.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Guild fetch failed");

      const data = await res.json();
      console.log("🟢 refreshGuilds response:", { guildCount: data.guilds?.length, guildNames: data.guilds?.map(g => g.name) });
      setGuilds(data.guilds || []);
      console.log("🟢 guilds state updated:", data.guilds?.length || 0, "guilds");

      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      guildsLock.current = false;
      setLoading(false);
    }
  }, [user]);

  // =========================
  // MESSAGES (FIXED LOOP)
  // =========================
  const fetchMessages = useCallback(
    async (guildId = null, channelId = null, limit = 50) => {
      console.log(`🔵 fetchMessages called: guildId=${guildId}, channelId=${channelId}, lock=${messagesLock.current}`);
      if (!user || messagesLock.current) {
        console.log(`🔴 fetchMessages blocked: user=${!!user}, lock=${messagesLock.current}`);
        return;
      }

      messagesLock.current = true;
      setLoading(true);

      try {
        const token = await user.getIdToken();

        let url = `${API_URL}/discord/messages/${user.uid}?limit=${limit}`;
        if (guildId) url += `&guild_id=${guildId}`;
        if (channelId) url += `&channel_id=${channelId}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Messages fetch failed");

        const data = await res.json();
        console.log(`🟢 fetchMessages response:`, { msgCount: data.messages?.length, source: data.source });
        setMessages(data.messages || []);
        console.log(`🟢 messages state updated: ${data.messages?.length || 0} messages`);

        return data;
      } catch (err) {
        setError(err.message);
      } finally {
        messagesLock.current = false;
        setLoading(false);
      }
    },
    [user]
  );

  // =========================
  // CONTEXT VALUE (STABLE)
  // =========================
  const value = useMemo(
    () => ({
      discordUser,
      guilds,
      messages,
      loading,
      error,
      connectDiscord,
      disconnectDiscord,
      refreshGuilds,
      fetchMessages,
      getDiscordAuthUrl,
      getBotInviteUrl,
      fetchDiscordStatus,
      forceRefreshStatus,
      isConnected: !!discordUser?.connected,
    }),
    [
      discordUser,
      guilds,
      messages,
      loading,
      error,
      connectDiscord,
      disconnectDiscord,
      refreshGuilds,
      fetchMessages,
      getDiscordAuthUrl,
      getBotInviteUrl,
      fetchDiscordStatus,
      forceRefreshStatus,
    ]
  );

  return (
    <DiscordContext.Provider value={value}>
      {children}
    </DiscordContext.Provider>
  );
}

export const useDiscord = () => useContext(DiscordContext);
