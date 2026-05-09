import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { authAPI } from "../api/api";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "../components/LogoIcon";
import Toast from "../components/Toast";

const AUTH_CSS = `
  :root {
    --bg-primary: #03050f;
    --bg-card: rgba(255,255,255,0.02);
    --text-primary: #F8FAFC;
    --text-secondary: #64748b;
    --border-color: rgba(255,255,255,0.06);
  }
  [data-theme="light"] {
    --bg-primary: #f8fafc;
    --bg-card: rgba(255,255,255,0.7);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --border-color: rgba(0,0,0,0.1);
  }
  .glow-btn {
    transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease;
    cursor: pointer;
  }
  .glow-btn:hover {
    transform: scale(1.04) translateY(-2px);
    box-shadow: 0 0 52px rgba(77,238,234,0.58) !important;
  }
`;

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "info" });
  };

  const getErrorMessage = (err) => {
    const code = err.code || "";
    const detail = err.response?.data?.detail || "";
    const msg = err.message || "";

    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Invalid email or password. Please try again.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many failed login attempts. Please wait 10 minutes and try again.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in popup was closed. Please try again.";
    }
    if (code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection.";
    }
    if (code === "auth/invalid-verification-code") {
      return "Invalid verification code. Please try again.";
    }
    if (detail) return detail;
    if (msg.includes("Firebase")) return msg.replace("Firebase: ", "");
    return msg || "Something went wrong. Please try again.";
  };

  const validateForm = () => {
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (unverifiedUser) {
      await handleResendVerification(e);
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showToast(validationError, "error");
      return;
    }
    setLoading(true);
    setError("");
    setUnverifiedUser(null);
    try {
      // Step 1: Client-side signin
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);

      // Step 2: Check email verification
      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        setError("Email not verified. Check your inbox or click below to resend.");
        return;
      }

      // Step 3: Get ID token and verify with backend
      const idToken = await userCredential.user.getIdToken();
      const verifyResponse = await authAPI.verifyToken(idToken);

      // Step 4: Backend confirmed - allow access
      if (verifyResponse.data.can_access) {
        showToast("Login successful!", "success");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!unverifiedUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      showToast("Verification email sent! Check your inbox.", "success");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get ID token and verify with backend
      const idToken = await result.user.getIdToken();
      const verifyResponse = await authAPI.verifyToken(idToken);

      if (verifyResponse.data.can_access) {
        showToast("Login successful!", "success");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      setError("Please enter your email address first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, form.email);
      showToast("Password reset email sent! Check your inbox.", "success");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast message={toast.show ? toast.message : ""} type={toast.type} onClose={hideToast} />
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      {/* Light mode gradient background */}
      <div style={{ 
        position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)",
        opacity: theme === 'light' ? 1 : 0,
        transition:"opacity 0.3s ease", zIndex:0
      }}/>
      {/* Background glow like landing page */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "50vh", background: theme === 'light' ? "radial-gradient(ellipse,rgba(8,145,178,0.15) 0%,transparent 60%)" : "radial-gradient(ellipse,rgba(77,238,234,0.08) 0%,transparent 60%)", pointerEvents: "none", zIndex:1 }} />
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 40, height: 40, borderRadius: "50%",
          background: "var(--bg-card)", border: "1px solid var(--border-color)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: theme === "dark" ? "#fbbf24" : "#64748b",
          transition: "all 0.2s",
        }}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <LogoIcon size={44} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>NeuroFlow</span>
          </Link>
        </div>

        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "var(--text-primary)", marginBottom: 8, textAlign: "center" }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: 40 }}>
            Sign in to continue reducing your cognitive load
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%", padding: "16px 18px", borderRadius: 14,
                  background: "var(--bg-card)", border: "1px solid var(--border-color)",
                  color: "var(--text-primary)", fontSize: "0.95rem", outline: "none",
                }}
                placeholder="Email address"
                onFocus={(e) => { e.target.style.borderColor = "rgba(77,238,234,0.3)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.background = "rgba(255,255,255,0.02)"; }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  width: "100%", padding: "16px 50px 16px 18px", borderRadius: 14,
                  background: "var(--bg-card)", border: "1px solid var(--border-color)",
                  color: "var(--text-primary)", fontSize: "0.95rem", outline: "none",
                }}
                placeholder="Password"
                onFocus={(e) => { e.target.style.borderColor = "rgba(77,238,234,0.3)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.background = "rgba(255,255,255,0.02)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px 8px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{ fontSize: "0.85rem", color: "#64748b", textDecoration: "none", transition: "color 0.2s", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#4DEEEA"}
                onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p style={{ fontSize: "0.85rem", color: "#ef4444", textAlign: "center" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow-btn"
              style={{
                width: "100%", padding: "16px", borderRadius: 100, border: "none",
                fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "1rem",
                color: "#03050f", background: unverifiedUser ? "linear-gradient(135deg,#f87171,#ef4444)" : "linear-gradient(135deg,#4DEEEA,#34D399)",
                boxShadow: unverifiedUser ? "0 0 28px rgba(248,113,113,0.35)" : "0 0 28px rgba(77,238,234,0.35)",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}
            >
              {loading ? (unverifiedUser ? "Sending..." : "Signing in...") : (unverifiedUser ? "Resend Verification Email" : "Sign In")}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 100,
              background: "var(--bg-card)", border: "1px solid var(--border-color)",
              fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "0.9rem",
              color: "var(--text-primary)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center", marginTop: 28 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#0ea5a5", textDecoration: "none", fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <style>{AUTH_CSS}</style>
    </div>
    </>
  );
}
