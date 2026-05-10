import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useGoogle } from "../context/GoogleContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { forceRefreshStatus } = useGoogle();
  const [status, setStatus] = useState("Connecting to Google...");
  const [error, setError] = useState(null);
  const processed = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const stateUid = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Google authorization failed: ${errorParam}`);
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    if (!code) {
      setError("No authorization code received from Google.");
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (processed.current) return;

      const uid = user?.uid || stateUid;

      if (!uid) {
        processed.current = true;
        setError("Not logged in. Please sign in first, then connect Google.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      processed.current = true;
      unsubscribe();

      try {
        setStatus("Linking your Google account…");

        const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/google/callback`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const res = await fetch(`${API_URL}/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            uid, 
            code, 
            redirect_uri: REDIRECT_URI 
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server error ${res.status}`);
        }

        const data = await res.json();
        await forceRefreshStatus();

        setStatus(`✅ Connected as ${data.email || "you"}!`);
        setTimeout(() => navigate("/dashboard/profile"), 1500);
      } catch (err) {
        console.error("Google callback error:", err);
        setError(err.message || "Something went wrong.");
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    });

    return () => unsubscribe();
  }, [searchParams, navigate, forceRefreshStatus]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
      fontFamily: "'Sora', cursive",
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        maxWidth: 400,
      }}>
        {error ? (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>❌</div>
            <h2 style={{ margin: "0 0 10px", color: "#ef4444", fontFamily: "'Sora',cursive" }}>
              Connection Failed
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 20px" }}>{error}</p>
            <p style={{ color: "#64748b", fontSize: "0.78rem" }}>Redirecting you back…</p>
          </>
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" style={{ marginBottom: 20 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <h2 style={{ margin: "0 0 10px", fontFamily: "'Sora',cursive" }}>Linking Google</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 24px" }}>{status}</p>
            <div style={{
              width: 36,
              height: 36,
              border: "3px solid rgba(66,133,244,0.2)",
              borderTop: "3px solid #4285F4",
              borderRadius: "50%",
              animation: "spin 0.9s linear infinite",
              margin: "0 auto",
            }} />
            <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
