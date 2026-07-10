import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, CheckCircle, XCircle, Search, MessageCircle, BookOpen, Star } from "lucide-react";
import { motion } from "framer-motion";
import { bookingAPI, serviceAPI, communityAPI, notificationAPI } from "../../services/api";
import { LoadingSpinner } from "../../components/ui/Cards";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLE = {
  confirmed: { cls: "badge-green", Icon: CheckCircle },
  pending:   { cls: "badge-amber", Icon: Clock },
  completed: { cls: "badge-blue",  Icon: CheckCircle },
  cancelled: { cls: "badge-red",   Icon: XCircle },
};

const ACTION_CARDS = [
  { emoji: "🏠", label: "Find Accommodation", to: "/services?category=Hostels",  bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", shadow: "rgba(37,99,235,0.12)"  },
  { emoji: "🤝", label: "Find Local Guide",   to: "/residents",                   bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", shadow: "rgba(22,163,74,0.12)"  },
  { emoji: "🔍", label: "Discover Services",  to: "/services",                    bg: "#faf5ff", border: "#ddd6fe", text: "#7c3aed", shadow: "rgba(124,58,237,0.12)" },
  { emoji: "💬", label: "Ask Community",      to: "/community",                   bg: "#fffbeb", border: "#fde68a", text: "#b45309", shadow: "rgba(180,83,9,0.12)"   },
];

const CATEGORIES = [
  { label: "Hostels",   to: "/services?category=Hostels"        },
 { label: "Grocery",   to: "/services?category=Grocery+Stores" },
  { label: "Transport", to: "/services?category=Transportation" },
  { label: "Education", to: "/services?category=Education"      },
];

export default function NewcomerDashboard() {
  const { user }               = useAuth();
  const navigate               = useNavigate();
  const [books,   setBooks]    = useState([]);
  const [recommended, setRec]  = useState([]);
  const [posts,   setPosts]    = useState([]);
  const [unread,  setUnread]   = useState(0);
  const [loading, setLoading]  = useState(true);
  const [query,   setQuery]    = useState("");

  useEffect(() => {
    Promise.all([
      bookingAPI.getMy(),
      serviceAPI.getAll({ sort: "featured", limit: 4 }),
      communityAPI.getAll(),
      notificationAPI.getAll({ unreadOnly: "true" }),
    ])
      .then(([b, s, c, n]) => {
        setBooks(b.data.data || []);
        setRec(s.data.data?.slice(0, 4) || []);
        setPosts(c.data.data?.slice(0, 3) || []);
        setUnread(n.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/services?search=${encodeURIComponent(q)}`);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="wrap py-8" style={{ fontFamily: "Inter,system-ui,sans-serif" }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(1.375rem,2.5vw,1.75rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>What would you like help with today?</p>
      </div>

      {/* Quick search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Search style={{ width: 18, height: 18, color: "#94a3b8", flexShrink: 0 }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search services, guides, community…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0f172a", background: "transparent" }} />
          {query && (
            <button type="submit" style={{ padding: "6px 16px", borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
              Search
            </button>
          )}
        </div>
      </form>

      {/* 4 action cards 2×2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }} className="action-grid">
        {ACTION_CARDS.map(c => (
          <motion.div key={c.label} whileHover={{ y: -3, boxShadow: `0 8px 28px ${c.shadow}` }} transition={{ duration: 0.15 }}>
            <Link to={c.to} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 20px", borderRadius: 16, background: c.bg, border: `1.5px solid ${c.border}`, textDecoration: "none", transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 30 }}>{c.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>{c.label}</span>
              </div>
              <ArrowRight style={{ width: 17, height: 17, color: c.text, opacity: 0.7, flexShrink: 0 }} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Category strip */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Recommended for You
        </p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="hide-scrollbar">
          {CATEGORIES.map(cat => (
            <Link key={cat.label} to={cat.to} style={{ display: "inline-flex", alignItems: "center", padding: "8px 18px", borderRadius: 999, background: "#f8fafc", border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom 2-col: Recent Bookings + Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="bottom-grid">

        {/* Recent Bookings */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontWeight: 800, color: "#0f172a", fontSize: 15, margin: 0 }}>Recent Bookings</h2>
            <Link to="/bookings" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {books.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #e2e8f0" }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>📅</p>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>No bookings yet. Browse services to get started.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {books.slice(0, 5).map((b, i) => {
                const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
                return (
                  <motion.div key={b._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 11, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.service?.title}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                        {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{b.time ? ` · ${b.time}` : ""}
                      </p>
                    </div>
                    <span className={`badge ${s.cls} text-[11px] capitalize shrink-0`}>{b.status}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity (replaces Nearby Guides) */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontWeight: 800, color: "#0f172a", fontSize: 15, margin: 0 }}>Recent Activity</h2>
            <Link to="/activity" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {/* Messages shortcut */}
            <Link to="/chat" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 11, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#bfdbfe"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageCircle style={{ width: 16, height: 16, color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: "0 0 2px" }}>Messages</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Chat with your local guides</p>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
            </Link>

            {/* Community posts */}
            {posts.slice(0, 2).map((post, i) => (
              <Link key={post._id} to={`/community/${post._id}`} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 11, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#bfdbfe"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <BookOpen style={{ width: 16, height: 16, color: "#16a34a" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{post.answers?.length || 0} answers · Community</p>
                </div>
              </Link>
            ))}

            {/* Recommended service teaser */}
            {recommended[0] && (
              <Link to={`/services/${recommended[0]._id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 11, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#bfdbfe"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Star style={{ width: 16, height: 16, color: "#d97706" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recommended[0].title}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{recommended[0].category} · {recommended[0].location}</p>
                </div>
                <ArrowRight style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
              </Link>
            )}

            {posts.length === 0 && !recommended[0] && (
              <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #e2e8f0" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>✨</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Your activity will appear here as you explore TrustBridge.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .action-grid { grid-template-columns: 1fr !important; }
          .bottom-grid  { grid-template-columns: 1fr !important; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
