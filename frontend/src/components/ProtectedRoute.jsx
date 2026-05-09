import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, reload } from "firebase/auth";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Force reload to get latest email verification status
        await reload(currentUser);
        setUser(currentUser);
        setVerified(currentUser.emailVerified);
      } else {
        setUser(null);
        setVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#4DEEEA", fontFamily: "'Inter',sans-serif", fontSize: "1rem" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!verified) {
    return (
      <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Sora',cursive", fontSize: "1.5rem", color: "#F8FAFC", marginBottom: 16 }}>
            Email Verification Required
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", marginBottom: 24 }}>
            Please verify your email address before accessing the dashboard. Check your inbox for the verification link.
          </p>
          <a href="/login" style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 100,
            background: "linear-gradient(135deg,#4DEEEA,#34D399)",
            color: "#03050f",
            fontFamily: "'Inter',sans-serif",
            fontWeight: 700,
            textDecoration: "none",
          }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return children;
}
