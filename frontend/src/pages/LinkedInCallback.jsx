import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLinkedIn } from "../context/LinkedInContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { forceRefreshStatus } = useLinkedIn();
  const [status, setStatus] = useState("Connecting to LinkedIn...");
  const [error, setError] = useState(null);
  const processed = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const stateUid = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`LinkedIn authorization failed: ${errorParam}`);
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    if (!code) {
      setError("No authorization code received from LinkedIn.");
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (processed.current) return;

      const uid = user?.uid || stateUid;

      if (!uid) {
        processed.current = true;
        setError("Not logged in. Please sign in first, then connect LinkedIn.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      processed.current = true;
      unsubscribe();

      try {
        setStatus("Linking your LinkedIn account…");

        const REDIRECT_URI = `${window.location.origin}/linkedin/callback`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const res = await fetch(`${API_URL}/linkedin/callback`, {
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

        setStatus(`✅ Connected as ${data.name || "you"}!`);
        setTimeout(() => navigate("/dashboard/profile"), 1500);
      } catch (err) {
        console.error("LinkedIn callback error:", err);
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
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
    }}>
      <div style={{ 
        textAlign: "center", 
        padding: "2rem",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        backdropFilter: "blur(10px)",
        maxWidth: "400px"
      }}>
        {error ? (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
            <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Connection Failed</h2>
            <p style={{ color: "#9ca3af" }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "spin 1s linear infinite" }}>⚙️</div>
            <h2 style={{ color: "white", marginBottom: "0.5rem" }}>Connecting...</h2>
            <p style={{ color: "#9ca3af" }}>{status}</p>
          </>
        )}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
