import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../firebase";

const LinkedInContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function LinkedInProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInUser, setLinkedInUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsUnavailable, setPostsUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const getUid = () => auth.currentUser?.uid;
  const statusLock = useRef(false);
  const hasFetchedStatus = useRef(false);
  const hasAutoFetchedPosts = useRef(false);

  // Check connection status on mount / auth change
  const checkStatus = useCallback(async () => {
    const uid = getUid();
    if (!uid || statusLock.current || hasFetchedStatus.current) return;
    statusLock.current = true;
    hasFetchedStatus.current = true;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_URL}/linkedin/status/${uid}`, {
        signal: controller.signal
      });
      clearTimeout(id);

      if (!res.ok) {
        hasFetchedStatus.current = false; // retry on next attempt
        return;
      }
      const data = await res.json();
      setIsConnected(data.connected || false);
      if (data.profile) setLinkedInUser(data.profile);
    } catch (e) {
      if (e.name === 'AbortError') console.warn("LinkedIn status check timed out");
      else console.warn("LinkedIn status check failed:", e);
      hasFetchedStatus.current = false; // retry on next attempt
    } finally {
      statusLock.current = false;
    }
  }, []);

  // Force refresh status (for use after OAuth callback)
  const forceRefreshStatus = useCallback(async () => {
    hasFetchedStatus.current = false;
    statusLock.current = false;
    await checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        checkStatus();
      } else {
        setIsConnected(false);
        setLinkedInUser(null);
        setPosts([]);
      }
    });
    return unsub;
  }, [checkStatus]);

  // Auto-fetch posts when LinkedIn connects
  useEffect(() => {
    if (isConnected && !hasAutoFetchedPosts.current) {
      hasAutoFetchedPosts.current = true;
      fetchPosts();
    }
  }, [isConnected, fetchPosts]);

  // Reset auto-fetch flag on disconnect
  useEffect(() => {
    if (!isConnected) {
      hasAutoFetchedPosts.current = false;
    }
  }, [isConnected]);

  // LinkedIn OAuth URL
  const getLinkedInAuthUrl = useCallback(() => {
    const uid = getUid();
    if (!uid) throw new Error("Not logged in");
    return `${API_URL}/linkedin/install?uid=${uid}`;
  }, []);

  // Fetch LinkedIn posts
  const fetchPosts = useCallback(async () => {
    const uid = getUid();
    if (!uid || !isConnected) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/linkedin/posts/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPostsUnavailable(data.posts_unavailable || false);
      }
    } catch (e) {
      console.warn("Failed to fetch LinkedIn posts:", e);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Disconnect LinkedIn
  const disconnectLinkedIn = useCallback(async () => {
    const uid = getUid();
    if (!uid) return;
    try {
      await fetch(`${API_URL}/linkedin/disconnect/${uid}`, { method: "POST" });
    } catch (e) {
      console.warn("Disconnect error:", e);
    }
    setIsConnected(false);
    setLinkedInUser(null);
    setPosts([]);
    setPostsUnavailable(false);
  }, []);

  // Listen for OAuth popup message
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "LINKEDIN_CONNECTED") {
        checkStatus();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [checkStatus]);

  return (
    <LinkedInContext.Provider value={{
      isConnected, linkedInUser, posts, postsUnavailable, loading,
      getLinkedInAuthUrl, fetchPosts, disconnectLinkedIn, checkStatus, forceRefreshStatus,
    }}>
      {children}
    </LinkedInContext.Provider>
  );
}

export function useLinkedIn() {
  const ctx = useContext(LinkedInContext);
  if (!ctx) throw new Error("useLinkedIn must be used inside LinkedInProvider");
  return ctx;
}
