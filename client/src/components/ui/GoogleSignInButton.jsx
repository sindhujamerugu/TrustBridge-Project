import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const DASH = {
  newcomer: "/dashboard/newcomer",
  resident: "/dashboard/resident",
  provider: "/dashboard/provider",
  admin:    "/dashboard/admin",
};

/* Google official icon SVG */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function GoogleSignInButton({ role = "newcomer", label = "Continue with Google" }) {
  const { loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };

    // Load GIS script if not already loaded
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const existing = document.getElementById("google-gis-script");
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.id = "google-gis-script";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", initGoogle);
      }
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      toast.error("Google sign-in was cancelled.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential, role);
      toast.success(`Welcome, ${user.name}!`);
      nav(DASH[user.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!CLIENT_ID || CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
      toast.error("Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.");
      return;
    }
    if (!window.google?.accounts?.id) {
      toast.error("Google Sign-In is loading. Please try again in a moment.");
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render the button popup
        window.google.accounts.id.renderButton(btnRef.current, {
          type: "standard", size: "large", theme: "outline",
          text: "continue_with", shape: "rectangular", width: 400,
        });
        btnRef.current?.querySelector("div[role=button]")?.click();
      }
    });
  };

  return (
    <div>
      {/* Hidden div for GIS renderButton fallback */}
      <div ref={btnRef} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          width: "100%", height: 50, borderRadius: 10,
          border: "1.5px solid #e2e8f0", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 14, fontWeight: 600, color: "#374151",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          opacity: loading ? 0.7 : 1,
          position: "relative",
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#f9fafb"; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
      >
        {loading ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>{label}</span>
          </>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
