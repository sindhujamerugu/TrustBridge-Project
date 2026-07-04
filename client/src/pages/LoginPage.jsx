import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from "lucide-react";
import logoImg from "../assets/logo.png";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/ui/GoogleSignInButton";

const DASH = { newcomer:"/dashboard/newcomer", resident:"/dashboard/resident", provider:"/dashboard/provider", admin:"/dashboard/admin" };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [show,  setShow]  = useState(false);
  const [loading, setLd]  = useState(false);
  const { login }         = useAuth();
  const nav               = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setLd(true);
    try { const u = await login(email, pw); toast.success(`Welcome back, ${u.name}!`); nav(DASH[u.role] || "/"); }
    catch (err) { toast.error(err.response?.data?.message || "Login failed"); }
    finally { setLd(false); }
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#f8fafc", display: "flex", flexDirection: "column" }}>

      {/* ── minimal auth header ── */}
      <header style={{ height: 56, flexShrink: 0, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", paddingInline: "clamp(1.25rem,4vw,3rem)", gap: 12, justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src={logoImg} alt="TrustBridge" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
        </Link>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#0f172a"}
          onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
          <ChevronLeft style={{ width: 15, height: 15 }} /> Back to Home
        </Link>
      </header>

      {/* ── two-column body ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "45fr 55fr", minHeight: 0, overflow: "hidden" }} className="auth-grid">

        {/* LEFT — illustration */}
        <div style={{ background: "linear-gradient(150deg,#060c1d 0%,#0e2040 50%,#071828 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 40px", position: "relative", overflow: "hidden" }} className="auth-left">
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(37,99,235,0.22) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: "relative", textAlign: "center", maxWidth: 380 }}>
            {/* compact SVG illustration viewBox 360x220 */}
            <div style={{ marginBottom: 28 }}>
              <svg viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 340 }}>
                {/* city skyline — left cluster */}
                <rect x="10"  y="90"  width="36" height="110" rx="2" fill="#1e3a5f" opacity=".7" />
                <rect x="15"  y="98"  width="7"  height="8"   rx="1" fill="#60a5fa" opacity=".5" />
                <rect x="26"  y="98"  width="7"  height="8"   rx="1" fill="#60a5fa" opacity=".4" />
                <rect x="15"  y="112" width="7"  height="8"   rx="1" fill="#60a5fa" opacity=".6" />
                <rect x="26"  y="112" width="7"  height="8"   rx="1" fill="#60a5fa" opacity=".3" />
                <rect x="50"  y="60"  width="50" height="140" rx="2" fill="#1e3a5f" opacity=".9" />
                <rect x="57"  y="70"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".6" />
                <rect x="71"  y="70"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".8" />
                <rect x="85"  y="70"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".5" />
                <rect x="57"  y="87"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".4" />
                <rect x="71"  y="87"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".7" />
                <rect x="85"  y="87"  width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".5" />
                <rect x="57"  y="104" width="9"  height="10"  rx="1" fill="#93c5fd" opacity=".4" />
                <rect x="105" y="72"  width="42" height="128" rx="2" fill="#1e3a5f" opacity=".7" />
                <rect x="112" y="80"  width="8"  height="9"   rx="1" fill="#60a5fa" opacity=".5" />
                <rect x="124" y="80"  width="8"  height="9"   rx="1" fill="#60a5fa" opacity=".7" />
                <rect x="112" y="95"  width="8"  height="9"   rx="1" fill="#60a5fa" opacity=".4" />
                <rect x="124" y="95"  width="8"  height="9"   rx="1" fill="#60a5fa" opacity=".6" />
                {/* city skyline — right cluster */}
                <rect x="250" y="68"  width="46" height="132" rx="2" fill="#1e3a5f" opacity=".8" />
                <rect x="258" y="77"  width="8"  height="9"   rx="1" fill="#93c5fd" opacity=".5" />
                <rect x="270" y="77"  width="8"  height="9"   rx="1" fill="#93c5fd" opacity=".7" />
                <rect x="282" y="77"  width="8"  height="9"   rx="1" fill="#93c5fd" opacity=".4" />
                <rect x="258" y="93"  width="8"  height="9"   rx="1" fill="#93c5fd" opacity=".6" />
                <rect x="270" y="93"  width="8"  height="9"   rx="1" fill="#93c5fd" opacity=".3" />
                <rect x="300" y="82"  width="34" height="118" rx="2" fill="#1e3a5f" opacity=".6" />
                <rect x="320" y="75"  width="38" height="125" rx="2" fill="#1e3a5f" opacity=".7" />
                {/* ground */}
                <rect x="0" y="196" width="360" height="24" fill="#0d1b38" opacity=".8" />
                {/* connection arc */}
                <path d="M138 152 Q180 108 222 152" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5 4" opacity=".7" />
                {/* left person — newcomer */}
                <circle cx="118" cy="138" r="20" fill="#1e3a5f" opacity=".5" />
                <circle cx="118" cy="128" r="10" fill="#fde68a" />
                <path d="M109 125 Q118 119 127 125 Q125 120 118 118 Q111 120 109 125Z" fill="#92400e" />
                <circle cx="115" cy="129" r="1.5" fill="#78350f" />
                <circle cx="121" cy="129" r="1.5" fill="#78350f" />
                <path d="M116 133 Q118 135 120 133" stroke="#78350f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <rect x="109" y="138" width="20" height="16" rx="4" fill="#3b82f6" />
                <line x1="111" y1="154" x2="109" y2="170" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                <line x1="127" y1="154" x2="129" y2="170" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                {/* luggage */}
                <rect x="96"  y="162" width="14" height="11" rx="2" fill="#2563eb" />
                <rect x="99"  y="159" width="8"  height="4"  rx="2" fill="#1d4ed8" />
                <circle cx="99"  cy="174" r="2" fill="#1e40af" />
                <circle cx="107" cy="174" r="2" fill="#1e40af" />
                {/* right person — local guide */}
                <circle cx="242" cy="138" r="20" fill="#064e3b" opacity=".5" />
                <circle cx="242" cy="128" r="10" fill="#fcd34d" />
                <path d="M233 125 Q242 119 251 125 Q249 120 242 118 Q235 120 233 125Z" fill="#78350f" />
                <circle cx="239" cy="129" r="1.5" fill="#78350f" />
                <circle cx="245" cy="129" r="1.5" fill="#78350f" />
                <path d="M240 134 Q242 136 244 134" stroke="#78350f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <rect x="233" y="138" width="20" height="16" rx="4" fill="#059669" />
                <line x1="235" y1="154" x2="233" y2="170" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                <line x1="251" y1="154" x2="253" y2="170" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                {/* verified badge on guide */}
                <circle cx="253" cy="125" r="8" fill="#059669" />
                <path d="M249 125 L251.5 128 L257 122" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* handshake zone */}
                <circle cx="180" cy="158" r="15" fill="rgba(59,130,246,0.15)" />
                <circle cx="180" cy="158" r="9"  fill="rgba(59,130,246,0.2)" />
                <text x="174" y="163" fontSize="10">🤝</text>
                {/* trust shield floating */}
                <rect x="160" y="88" width="40" height="18" rx="9" fill="#059669" />
                <text x="165" y="101" fontSize="8" fill="white" fontWeight="700">✓ Verified</text>
              </svg>
            </div>

            <h2 style={{ fontSize: "clamp(1.1rem,1.8vw,1.4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Trusted people. Trusted services. One community.
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
              Connect with verified local residents, discover trusted services, and settle into your new city with confidence.
            </p>
          </motion.div>
        </div>

        {/* RIGHT — form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "#f8fafc", overflowY: "auto" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", maxWidth: 480 }}>

            <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)" }}>

              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em", margin: "0 0 5px" }}>Welcome Back</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Sign in to your TrustBridge account</p>
              </div>

              <form onSubmit={submit} autoComplete="off">
                {/* email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8", pointerEvents: "none" }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@example.com"
                      autoComplete="new-password"
                      style={{ width: "100%", height: 50, paddingLeft: 42, paddingRight: 14, border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", background: "#fff", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                      onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>

                {/* password */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Password</label>
                    <button type="button" style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Forgot Password?</button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8", pointerEvents: "none" }} />
                    <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      style={{ width: "100%", height: 50, paddingLeft: 42, paddingRight: 46, border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", background: "#fff", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                      onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }} />
                    <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
                      {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {/* submit */}
                <button type="submit" disabled={loading}
                  style={{ width: "100%", height: 50, background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, transition: "background 0.15s, box-shadow 0.15s", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                  {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight style={{ width: 15, height: 15 }} /></>}
                </button>
              </form>

              {/* Google sign-in divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0 14px" }}>
                <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500, whiteSpace:"nowrap" }}>or continue with</span>
                <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
              </div>
              <GoogleSignInButton role="newcomer" label="Continue with Google" />

              {/* signup link */}
              <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 20, marginBottom: 0 }}>
                New to TrustBridge?{" "}
                <Link to="/register" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>Create Account</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .auth-grid { grid-template-columns: 1fr !important; overflow-y: auto !important; }
          .auth-left  { display: none !important; }
        }
      `}</style>
    </div>
  );
}
