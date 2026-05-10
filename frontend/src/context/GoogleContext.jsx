import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const GoogleContext = createContext();
export const useGoogle = () => useContext(GoogleContext);

export const GoogleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [googleUser, setGoogleUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const emailsLock = useRef(false);
  const eventsLock = useRef(false);
  const statusLock = useRef(false);
  const hasFetchedStatus = useRef(false);

  // Track Firebase auth state reactively
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      hasFetchedStatus.current = false; // reset on user change
    });
    return unsub;
  }, []);

  // =========================
  // STATUS
  // =========================
  const fetchGoogleStatus = useCallback(async (currentUser) => {
    const u = currentUser || user;
    if (!u || statusLock.current || hasFetchedStatus.current) return;
    statusLock.current = true;
    hasFetchedStatus.current = true;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/google/status/${u.uid}`);
      if (!res.ok) {
        hasFetchedStatus.current = false;
        return;
      }
      const data = await res.json();
      setGoogleUser(data.connected ? { email: data.email, name: data.name, picture: data.picture } : null);
      setIsConnected(data.connected);
    } catch (err) {
      console.error("Google status error:", err);
      setError(err.message);
      hasFetchedStatus.current = false; // retry on next attempt
    } finally {
      statusLock.current = false;
      setLoading(false);
    }
  }, [user]);

  // Force refresh status (for use after OAuth callback) - defined AFTER fetchGoogleStatus
  const forceRefreshStatus = useCallback(async () => {
    hasFetchedStatus.current = false;
    statusLock.current = false;
    await fetchGoogleStatus();
  }, [fetchGoogleStatus]);

  // Auto-fetch status when user is available
  useEffect(() => {
    if (user && !hasFetchedStatus.current) {
      hasFetchedStatus.current = true;
      fetchGoogleStatus(user);
    }
  }, [user, fetchGoogleStatus]);

  // =========================
  // AUTH URL — built directly on frontend, no backend call needed
  // =========================
  const getGoogleAuthUrl = useCallback(() => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not logged in — please sign in first");

    const CLIENT_ID   = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT    = import.meta.env.VITE_GOOGLE_REDIRECT_URI || "http://localhost:5173/google/callback";
    const SCOPES      = [
      "openid", "email", "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" ");

    if (!CLIENT_ID) throw new Error("VITE_GOOGLE_CLIENT_ID not set in .env");

    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT,
      response_type: "code",
      scope:         SCOPES,
      state:         u.uid,
      access_type:   "offline",
      prompt:        "consent",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("🔵 Google OAuth URL:", url);
    return url;
  }, []);

  // =========================
  // EMAILS
  // =========================
  const fetchEmails = useCallback(async (limit = 10) => {
    const u = auth.currentUser;
    if (!u || emailsLock.current) return;
    emailsLock.current = true;
    setLoading(true);

    try {
      const token = await u.getIdToken();
      const res = await fetch(`${API_URL}/google/emails/${u.uid}?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Emails fetch failed");
      const data = await res.json();
      setEmails(data.emails || []);
      return data;
    } catch (err) {
      console.error("Gmail fetch error:", err);
      setError(err.message);
    } finally {
      emailsLock.current = false;
      setLoading(false);
    }
  }, []);

  // =========================
  // CALENDAR EVENTS
  // =========================
  const fetchEvents = useCallback(async (limit = 10) => {
    const u = auth.currentUser;
    if (!u || eventsLock.current) return;
    eventsLock.current = true;
    setLoading(true);

    try {
      const token = await u.getIdToken();
      const res = await fetch(`${API_URL}/google/events/${u.uid}?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Events fetch failed");
      const data = await res.json();
      setEvents(data.events || []);
      return data;
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError(err.message);
    } finally {
      eventsLock.current = false;
      setLoading(false);
    }
  }, []);

  // =========================
  // DISCONNECT
  // =========================
  const disconnectGoogle = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    setLoading(true);
    try {
      const token = await u.getIdToken();
      await fetch(`${API_URL}/google/disconnect/${u.uid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoogleUser(null);
      setEmails([]);
      setEvents([]);
      setIsConnected(false);
      hasFetchedStatus.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    googleUser,
    isConnected,
    emails,
    events,
    loading,
    error,
    fetchGoogleStatus,
    forceRefreshStatus,
    getGoogleAuthUrl,
    fetchEmails,
    fetchEvents,
    disconnectGoogle,
  };

  return <GoogleContext.Provider value={value}>{children}</GoogleContext.Provider>;
};
