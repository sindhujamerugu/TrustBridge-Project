import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

const COLS = [
  {
    title: "Platform",
    links: [
      { label: "Services",     to: "/services"  },
      { label: "Local Guides", to: "/residents" },
      { label: "Community",    to: "/community" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",    to: "/about"   },
      { label: "Contact",  to: "/contact" },
      { label: "Careers",  to: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center",              to: "/help"    },
      { label: "Privacy Policy",           to: "/privacy" },
      { label: "Terms & Conditions",       to: "/terms"   },
      { label: "Refund & Cancellation",    to: "/refund"  },
      { label: "Contact Us",               to: "/contact" },
      { label: "About Us",                 to: "/about"   },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{
      background: "#0a0f1e",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      fontFamily: "Inter,system-ui,sans-serif",
      color: "#94a3b8",
    }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 32 }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "inline-flex", background: "#fff", borderRadius: 10, padding: "6px 10px" }}>
                <img
                  src={logoImg}
                  alt="TrustBridge"
                  style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.65, maxWidth: 200 }}>
              Helping newcomers settle safely in Hyderabad with verified locals and trusted services.
            </p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "8px 0 0", lineHeight: 1.5 }}>
              Designed &amp; Developed by{" "}
              <strong style={{ color: "#94a3b8", fontWeight: 600 }}>Nasani Ragamala &amp; Sindhuja Merugu</strong>
            </p>
            <a href="mailto:trustbridge.platform@gmail.com"
              style={{ display:"inline-block", marginTop:6, fontSize:11, color:"#94a3b8", textDecoration:"none",
                transition:"color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#fff"}
              onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>
              trustbridge.platform@gmail.com
            </a>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="wrap" style={{ paddingTop: 18, paddingBottom: 18, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#475569" }}>© {new Date().getFullYear()} TrustBridge. All rights reserved.</span>
            <span style={{ fontSize: 11, color: "#374151" }}>Designed &amp; Developed by <strong style={{ color: "#475569" }}>Nasani Ragamala &amp; Sindhuja Merugu</strong> · Hanamkonda, Telangana, India</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {[{l:"Privacy Policy",to:"/privacy"},{l:"Terms",to:"/terms"},{l:"Refund Policy",to:"/refund"},{l:"Contact",to:"/contact"}].map(({l,to}) => (
              <Link key={l} to={to} style={{ fontSize: 12, color: "#475569", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#475569"; }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
