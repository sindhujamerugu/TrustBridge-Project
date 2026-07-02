import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { motion } from "framer-motion";
import { statsAPI } from "../services/api";

function fmtStat(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
  if (n >= 100)  return `${n}+`;
  return String(n);
}

export default function AboutPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsAPI.get()
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats({}));
  }, []);

  const STATS = [
    { v: stats ? fmtStat(stats.totalNewcomers)    : "—", l: "Newcomers Helped",           sub: "across Hyderabad"  },
    { v: stats ? fmtStat(stats.verifiedResidents) : "—", l: "Verified Community Members", sub: "Aadhaar-verified"  },
    { v: stats ? fmtStat(stats.activeServices)    : "—", l: "Active Services",             sub: "across 3 areas"   },
    { v: stats ? fmtStat(stats.totalReviews)      : "—", l: "Verified Reviews",            sub: "AI-moderated"     },
  ];

  return (
    <div style={{ background: "#fff", fontFamily: "Inter,system-ui,sans-serif" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "80px 0 60px", textAlign: "center" }}>
        <div className="wrap">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ display: "inline-flex", background: "#fff", borderRadius: 14, padding: "8px 14px" }}>
                <img src={logoImg} alt="TrustBridge" style={{ height: 52, width: "auto", objectFit: "contain", display: "block" }} />
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 16px" }}>
              About TrustBridge
            </h1>
            <p style={{ fontSize: 16, color: "#94a3b8", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              We help newcomers settle into a new city safely, by connecting them with local residents and trusted service providers.
            </p>
            {/* Legal ownership — required for payment gateway KYC */}
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 16 }}>
              Owned &amp; Operated by{" "}
              <strong style={{ color: "#93c5fd", fontWeight: 700 }}>Nasani Ragamala and M. Sindhuja</strong>
              {" "}·{" "}
              <a href="mailto:trustbridge.platform@gmail.com" style={{ color: "#60a5fa", textDecoration: "none" }}>
                trustbridge.platform@gmail.com
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderLeft: "1px solid #e2e8f0" }} className="ab-stats">
            {STATS.map((s) => (
              <div key={s.l} style={{ padding: "28px 24px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 5 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div style={{ padding: "72px 0" }}>
        <div className="wrap" style={{ maxWidth: 720, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Our Mission</p>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.125rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.2, letterSpacing: "-0.025em", margin: "0 0 20px" }}>
            Make every newcomer feel at home — safely and confidently
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8 }}>
            Moving to a new city is one of the most challenging experiences a person can face. TrustBridge was built to remove the fear, confusion, and vulnerability that newcomers experience by giving them access to a trusted community of local residents and services — right from day one.
          </p>
        </div>
      </div>

      {/* Vision */}
      <div style={{ background: "#f8fafc", padding: "64px 0" }}>
        <div className="wrap" style={{ maxWidth: 720, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Our Vision</p>
          <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            A world where no one has to feel alone in a new city
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8 }}>
            We envision a future where every city has a thriving network of local guides and trusted services, making relocation safe, efficient, and even joyful. Starting in Hyderabad — and growing across India.
          </p>
        </div>
      </div>

      {/* Story */}
      <div style={{ padding: "64px 0" }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, textAlign: "center" }}>The TrustBridge Story</p>
          <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.25, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 24px" }}>
            Built from a personal experience
          </h2>
          <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.85 }}>
            <p>TrustBridge started when our founder moved from a small town to Hyderabad for work. Within the first week, they encountered fake PG listings, unreliable service providers, and the overwhelming loneliness of not knowing anyone trustworthy in the city.</p>
            <p style={{ marginTop: 16 }}>That experience sparked an idea: what if every newcomer had access to a verified network of locals who genuinely wanted to help? What if every service provider was vetted, rated, and held accountable?</p>
            <p style={{ marginTop: 16 }}>TrustBridge was built to answer those questions — with AI-powered review moderation, Aadhaar-based verification, and a community built on real trust.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "60px 0", textAlign: "center" }}>
        <div className="wrap">
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Join the TrustBridge community</h2>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px" }}>Free to join. Verified by design. Trusted by thousands.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{ padding: "12px 28px", borderRadius: 10, background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}>
              Get Started Free
            </Link>
            <Link to="/contact" style={{ padding: "12px 28px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:640px){.ab-stats{grid-template-columns:1fr 1fr !important;}}`}</style>
    </div>
  );
}
