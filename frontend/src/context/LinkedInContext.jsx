import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  // Check connection status on mount / auth change
  const checkStatus = useCallback(async () => {
    const uid = getUid();
    if (!uid) return;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_URL}/linkedin/status/${uid}`, {
        signal: controller.signal
      });
      clearTimeout(id);

      if (!res.ok) return;
      const data = await res.json();
      setIsConnected(data.connected || false);
      if (data.profile) setLinkedInUser(data.profile);
    } catch (e) {
      if (e.name === 'AbortError') console.warn("LinkedIn status check timed out");
      else console.warn("LinkedIn status check failed:", e);
    }
  }, []);

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
      getLinkedInAuthUrl, fetchPosts, disconnectLinkedIn, checkStatus,
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
