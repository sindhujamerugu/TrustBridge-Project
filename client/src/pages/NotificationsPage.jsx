import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationAPI } from "../services/api";
import { LoadingSpinner, EmptyState } from "../components/ui/Cards";

// Icon + colour per notification type
const TYPE_CONFIG = {
  booking:      { icon: "📅", bg: "#eff6ff",  color: "#2563eb" },
  review:       { icon: "⭐", bg: "#fffbeb",  color: "#d97706" },
  reward:       { icon: "🎁", bg: "#f0fdf4",  color: "#16a34a" },
  system:       { icon: "🔔", bg: "#f8fafc",  color: "#64748b" },
  community:    { icon: "💬", bg: "#faf5ff",  color: "#7c3aed" },
  message:      { icon: "✉️", bg: "#eff6ff",  color: "#2563eb" },
  fraud:        { icon: "🚨", bg: "#fef2f2",  color: "#dc2626" },
  verification: { icon: "🛡️", bg: "#f0fdf4",  color: "#16a34a" },
  payment:      { icon: "💳", bg: "#eff6ff",  color: "#0891b2" },
  trust_score:  { icon: "📊", bg: "#faf5ff",  color: "#7c3aed" },
};
const DEFAULT_CFG = { icon: "🔔", bg: "#f8fafc", color: "#64748b" };

export default function NotificationsPage() {
  const nav = useNavigate();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLd]      = useState(true);
  const [tab,     setTab]     = useState("all");

  useEffect(() => {
    notificationAPI.getAll()
      .then(({ data }) => {
        const list = data.data || [];
        setNotifs(list);
        // Auto-mark all unread as read when the page opens, then broadcast
        // to the Navbar so the badge updates without a page refresh.
        const hasUnread = list.some(n => !n.isRead);
        if (hasUnread) {
          notificationAPI.markAllRead().then(() => {
            setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
            // Dispatch a custom event that Navbar listens to for badge refresh
            window.dispatchEvent(new CustomEvent('notifications:read'));
          }).catch(() => {});
        }
      })
      .finally(() => setLd(false));
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent('notifications:read'));
  };

  const handleClick = async (n) => {
    // Mark this notification as read if not already
    if (!n.isRead) {
      await notificationAPI.markRead(n._id);
      setNotifs(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x));
      window.dispatchEvent(new CustomEvent('notifications:read'));
    }
    // Navigate to link if present
    if (n.link) nav(n.link);
  };

  const shown  = tab === "unread" ? notifs.filter(n => !n.isRead) : notifs;
  const unread = notifs.filter(n => !n.isRead).length;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="wrap py-8" style={{ maxWidth: 600 }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:"1.4rem", fontWeight:800, color:"#0f172a", margin:0 }}>Notifications</h1>
          {unread > 0 && (
            <p style={{ fontSize:12, color:"#64748b", margin:"4px 0 0" }}>{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"7px 14px", borderRadius:99, fontSize:13, fontWeight:600,
            border:"1.5px solid #e2e8f0", background:"#fff", color:"#475569",
            cursor:"pointer",
          }}>
            <CheckCheck style={{ width:14, height:14 }} /> Mark all read
          </button>
        )}
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          { id:"all",    label:`All (${notifs.length})` },
          { id:"unread", label:`Unread (${unread})`     },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"7px 16px", borderRadius:99, fontSize:13, fontWeight:700,
            border:"1.5px solid",
            borderColor: tab === t.id ? "#2563eb" : "#e2e8f0",
            background:  tab === t.id ? "#2563eb" : "#fff",
            color:       tab === t.id ? "#fff"    : "#475569",
            cursor:"pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* list */}
      {shown.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="No notifications to show." />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <AnimatePresence>
            {shown.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || DEFAULT_CFG;
              const hasLink = !!n.link;
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, x:-16 }} transition={{ delay: i * 0.03 }}
                  onClick={() => handleClick(n)}
                  style={{
                    display:"flex", alignItems:"flex-start", gap:14,
                    padding:"14px 16px", borderRadius:14,
                    border:`1.5px solid ${n.isRead ? "#f1f5f9" : "#bfdbfe"}`,
                    background: n.isRead ? "#fff" : "#eff6ff",
                    cursor: hasLink ? "pointer" : "default",
                    transition:"box-shadow 0.15s, border-color 0.15s",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={e => {
                    if (hasLink) e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* icon */}
                  <div style={{
                    width:40, height:40, borderRadius:11, flexShrink:0,
                    background: cfg.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:18,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* text */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{
                      fontSize:13, fontWeight:700, color:"#0f172a",
                      margin:"0 0 3px", lineHeight:1.4,
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontSize:12, color:"#64748b",
                      margin:"0 0 6px", lineHeight:1.5,
                    }}>
                      {n.message}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day:"numeric", month:"short", year:"numeric",
                        })}
                        {" · "}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour:"2-digit", minute:"2-digit",
                        })}
                      </span>
                      {hasLink && (
                        <span style={{ fontSize:11, fontWeight:700, color: cfg.color }}>
                          View →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* unread dot */}
                  {!n.isRead && (
                    <div style={{
                      width:9, height:9, borderRadius:"50%",
                      background:"#2563eb", flexShrink:0, marginTop:4,
                    }} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
