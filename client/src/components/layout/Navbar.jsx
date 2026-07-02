import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Bell, User, LogOut, ChevronDown,
  MessageCircle, LayoutDashboard, Settings, HelpCircle,
  Calendar, Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notificationAPI } from "../../services/api";
import logoImg from "../../assets/logo.png";

const NAV = [
  { to: "/",          label: "Home"         },
  { to: "/services",  label: "Services"     },
  { to: "/residents", label: "Local Guides" },
  { to: "/community", label: "Community"    },
];
const DASH = {
  newcomer: "/dashboard/newcomer",
  resident: "/dashboard/resident",
  provider: "/dashboard/provider",
  admin:    "/dashboard/admin",
};
const ROLE_COLORS = {
  newcomer: { bg: "#dbeafe", color: "#1d4ed8" },
  resident: { bg: "#dcfce7", color: "#15803d" },
  provider: { bg: "#ede9fe", color: "#6d28d9" },
  admin:    { bg: "#fee2e2", color: "#b91c1c" },
};
const AV_PALETTE = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const avBg      = n  => AV_PALETTE[(n?.charCodeAt(0) || 0) % AV_PALETTE.length];
const isRealAv  = url => url && !url.includes("placehold.co") && (url.startsWith("http") || url.startsWith("data:"));

/* ── Reusable avatar bubble ── */
function Avatar({ user, size = 32, radius = 9 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: avBg(user?.name), flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: Math.round(size * 0.42), fontWeight: 800,
    }}>
      {isRealAv(user?.avatar)
        ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : user?.name?.charAt(0)}
    </div>
  );
}

/* ── Dropdown menu item ── */
function DropItem({ to, Icon, label, danger, onClick, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to || "#"} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8, margin: "1px 0",
        fontSize: 13, fontWeight: 500, textDecoration: "none",
        color: danger ? "#dc2626" : "#374151",
        background: hov ? (danger ? "#fef2f2" : "#f8fafc") : "transparent",
        transition: "background 0.12s",
      }}>
      <Icon style={{ width: 15, height: 15, color: danger ? "#dc2626" : "#94a3b8", flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
          borderRadius: 99, background: "#2563eb", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
        }}>{badge > 9 ? "9+" : badge}</span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [drop,        setDrop]        = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [unread,      setUnread]      = useState(0);
  const [unreadMsgs,  setUnreadMsgs]  = useState(0);
  const dropRef   = useRef(null);
  const searchRef = useRef(null);

  /* scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* notification / message counts */
  useEffect(() => {
    if (!user) { setUnread(0); setUnreadMsgs(0); return; }
    notificationAPI.getAll({ unreadOnly: "true" })
      .then(({ data }) => setUnread(data.unreadCount ?? 0)).catch(() => {});
    import("../../services/api").then(({ chatAPI }) =>
      chatAPI.getConversations().then(({ data }) => {
        const myId = user._id || user.id;
        setUnreadMsgs((data.data || []).reduce((s, c) => s + (c.unreadCount?.[myId] || 0), 0));
      }).catch(() => {})
    );
  }, [user]);

  /* close everything on route change */
  useEffect(() => { setMobileOpen(false); setDrop(false); }, [loc.pathname]);

  /* close dropdown on outside click */
  useEffect(() => {
    if (!drop) return;
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [drop]);

  /* lock body scroll when mobile drawer open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = p => p === "/" ? loc.pathname === "/" : loc.pathname.startsWith(p);

  const handleSearch = e => {
    e.preventDefault();
    if (searchQ.trim()) {
      nav(`/services?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ("");
      searchRef.current?.blur();
    }
  };

  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.newcomer;

  return (
    <>
      {/* ═══════════ HEADER ═══════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, height: 64,
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #e2e8f0" : "1px solid rgba(226,232,240,0.6)",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.25s, border-color 0.25s",
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <div className="wrap" style={{
          height: "100%", display: "flex", alignItems: "center",
          gap: 16, justifyContent: "space-between",
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <img
              src={logoImg}
              alt="TrustBridge"
              style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }}
            />
          </Link>

          {/* ── Desktop nav links ── */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }} className="hidden md:flex">
            {NAV.map(n => {
              const active = isActive(n.to);
              return (
                <Link key={n.to} to={n.to} style={{
                  position: "relative", padding: "6px 13px", borderRadius: 8,
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  textDecoration: "none", transition: "color 0.15s, background 0.15s",
                  color: active ? "#2563eb" : "#4b5563",
                  background: "transparent",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = active ? "#2563eb" : "#4b5563"; e.currentTarget.style.background = "transparent"; }}
                >
                  {n.label}
                  {/* active underline dot */}
                  {active && (
                    <motion.span layoutId="nav-pill"
                      style={{
                        position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                        width: 18, height: 3, borderRadius: 999, background: "#2563eb",
                        display: "block",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Search bar (center) ── */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 340, position: "relative" }} className="hidden md:block">
            <Search style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 14, height: 14,
              color: searchFocus ? "#2563eb" : "#94a3b8",
              transition: "color 0.15s", pointerEvents: "none",
            }} />
            <input
              ref={searchRef}
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search services, guides, or locations…"
              style={{
                width: "100%", height: 38,
                paddingLeft: 36, paddingRight: 14,
                border: `1.5px solid ${searchFocus ? "#93c5fd" : "#e2e8f0"}`,
                borderRadius: 999,
                fontSize: 12.5, color: "#0f172a",
                background: searchFocus ? "#fff" : "#f8fafc",
                outline: "none",
                boxShadow: searchFocus ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                fontFamily: "inherit",
              }}
            />
          </form>

          {/* ── Desktop right ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} className="hidden md:flex">
            {user ? (
              <>
                {/* Bell */}
                <Link to="/notifications" style={{
                  position: "relative", width: 38, height: 38, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748b", textDecoration: "none", transition: "background 0.15s, color 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
                >
                  <Bell style={{ width: 18, height: 18 }} />
                  {unread > 0 && (
                    <span style={{
                      position: "absolute", top: 5, right: 5,
                      minWidth: 15, height: 15, borderRadius: 99,
                      background: "#ef4444", color: "#fff",
                      fontSize: 8.5, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                      border: "2px solid #fff",
                    }}>{unread > 9 ? "9+" : unread}</span>
                  )}
                </Link>

                {/* Profile dropdown trigger */}
                <div ref={dropRef} style={{ position: "relative" }}>
                  <button onClick={() => setDrop(d => !d)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "4px 10px 4px 4px", borderRadius: 99,
                    border: `1.5px solid ${drop ? "#bfdbfe" : "#e2e8f0"}`,
                    background: drop ? "#f8fafc" : "white",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = drop ? "#bfdbfe" : "#e2e8f0"; e.currentTarget.style.background = drop ? "#f8fafc" : "white"; }}
                  >
                    <Avatar user={user} size={30} radius={99} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown style={{ width: 13, height: 13, color: "#94a3b8", transition: "transform 0.2s", transform: drop ? "rotate(180deg)" : "none" }} />
                  </button>

                  <AnimatePresence>
                    {drop && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.14 }}
                        style={{
                          position: "absolute", right: 0, top: "calc(100% + 10px)",
                          width: 272, background: "white",
                          border: "1.5px solid #e2e8f0", borderRadius: 16,
                          boxShadow: "0 12px 40px rgba(0,0,0,0.13)", overflow: "hidden", zIndex: 200,
                        }}>

                        {/* User header */}
                        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <Avatar user={user} size={42} radius={12} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.name}
                              </p>
                              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.email}
                              </p>
                              <span style={{
                                display: "inline-block", fontSize: 10, fontWeight: 700,
                                padding: "2px 8px", borderRadius: 999, textTransform: "capitalize",
                                background: roleStyle.bg, color: roleStyle.color,
                              }}>{user.role}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: "6px 8px" }}>
                          <DropItem to={DASH[user.role]} Icon={LayoutDashboard} label="Dashboard" />
                          <DropItem to="/bookings"       Icon={Calendar}         label="My Bookings" />
                          <DropItem to="/chat"           Icon={MessageCircle}    label="Messages" badge={unreadMsgs} />
                          <DropItem to="/notifications"  Icon={Bell}             label="Notifications" badge={unread} />
                        </div>
                        <div style={{ height: 1, background: "#f1f5f9", margin: "0 10px" }} />
                        <div style={{ padding: "6px 8px" }}>
                          <DropItem to="/profile"  Icon={User}       label="Profile" />
                          <DropItem to="/settings" Icon={Settings}   label="Settings" />
                          <DropItem to="/help"     Icon={HelpCircle} label="Help Center" />
                        </div>
                        <div style={{ height: 1, background: "#f1f5f9", margin: "0 10px" }} />
                        <div style={{ padding: "6px 8px 8px" }}>
                          <DropItem Icon={LogOut} label="Sign Out" danger
                            onClick={e => { e.preventDefault(); setDrop(false); setShowLogout(true); }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  padding: "7px 16px", borderRadius: 8,
                  fontSize: 13.5, fontWeight: 500, color: "#4b5563",
                  textDecoration: "none", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.background = "transparent"; }}
                >Sign In</Link>

                <Link to="/register" style={{
                  padding: "8px 18px", borderRadius: 99,
                  fontSize: 13.5, fontWeight: 700, color: "#fff",
                  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  textDecoration: "none",
                  boxShadow: "0 2px 10px rgba(37,99,235,0.38)",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,0.38)"; e.currentTarget.style.transform = "none"; }}
                >Get Started</Link>
              </>
            )}
          </div>

          {/* ── Hamburger (mobile only) ── */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden" style={{
            width: 38, height: 38, borderRadius: 10,
            border: "1.5px solid #e2e8f0", background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <Menu style={{ width: 18, height: 18, color: "#475569" }} />
          </button>
        </div>
      </header>

      {/* ═══════════ MOBILE DRAWER ═══════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.48)", backdropFilter: "blur(3px)" }} />

            {/* drawer panel */}
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 300, zIndex: 201,
                background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.14)",
                display: "flex", flexDirection: "column",
                fontFamily: "Inter, system-ui, sans-serif",
              }}>

              {/* drawer header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={logoImg}
                    alt="TrustBridge"
                    style={{ height: 34, width: "auto", objectFit: "contain", display: "block" }}
                  />
                </div>
                <button onClick={() => setMobileOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X style={{ width: 15, height: 15, color: "#64748b" }} />
                </button>
              </div>

              {/* mobile search */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <form onSubmit={e => { handleSearch(e); setMobileOpen(false); }} style={{ position: "relative" }}>
                  <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8", pointerEvents: "none" }} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search services, guides…"
                    style={{ width: "100%", height: 40, paddingLeft: 36, paddingRight: 12, border: "1.5px solid #e2e8f0", borderRadius: 999, fontSize: 13, outline: "none", background: "#f8fafc", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "#93c5fd"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.background = "#f8fafc"; }}
                  />
                </form>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
                {/* nav links */}
                {NAV.map(n => {
                  const active = isActive(n.to);
                  return (
                    <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", borderRadius: 10, marginBottom: 2,
                      fontSize: 14, fontWeight: active ? 700 : 500, textDecoration: "none",
                      color: active ? "#2563eb" : "#374151",
                      background: active ? "#eff6ff" : "transparent",
                    }}>
                      {n.label}
                      {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />}
                    </Link>
                  );
                })}

                <div style={{ height: 1, background: "#f1f5f9", margin: "10px 4px" }} />

                {user ? (
                  <>
                    {/* user identity strip */}
                    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", marginBottom: 6, background: "#f8fafc", borderRadius: 12 }}>
                      <Avatar user={user} size={40} radius={12} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, textTransform: "capitalize", background: roleStyle.bg, color: roleStyle.color, display: "inline-block", marginTop: 3 }}>{user.role}</span>
                      </div>
                    </div>

                    {[
                      { to: DASH[user.role], label: "Dashboard",     Icon: LayoutDashboard },
                      { to: "/bookings",     label: "My Bookings",   Icon: Calendar        },
                      { to: "/chat",         label: "Messages",      Icon: MessageCircle, badge: unreadMsgs },
                      { to: "/notifications",label: "Notifications", Icon: Bell,          badge: unread     },
                      { to: "/profile",      label: "Profile",       Icon: User            },
                      { to: "/settings",     label: "Settings",      Icon: Settings        },
                      { to: "/help",         label: "Help Center",   Icon: HelpCircle      },
                    ].map(item => (
                      <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "10px 14px", borderRadius: 10, marginBottom: 2,
                        fontSize: 13.5, fontWeight: 500, color: "#374151", textDecoration: "none",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <item.Icon style={{ width: 16, height: 16, color: "#94a3b8", flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99, background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    <div style={{ height: 1, background: "#f1f5f9", margin: "8px 4px" }} />
                    <button onClick={() => { setMobileOpen(false); setShowLogout(true); }} style={{
                      display: "flex", alignItems: "center", gap: 11, width: "100%",
                      padding: "10px 14px", borderRadius: 10,
                      fontSize: 13.5, fontWeight: 500, color: "#dc2626",
                      background: "transparent", border: "none", cursor: "pointer",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
                    <Link to="/login" onClick={() => setMobileOpen(false)} style={{
                      display: "block", textAlign: "center", padding: "12px",
                      borderRadius: 10, border: "1.5px solid #e2e8f0",
                      fontSize: 14, fontWeight: 600, color: "#374151", textDecoration: "none",
                    }}>Sign In</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} style={{
                      display: "block", textAlign: "center", padding: "12px", borderRadius: 10,
                      background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                      fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
                    }}>Get Started Free</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════ SIGN OUT CONFIRMATION ═══════════ */}
      <AnimatePresence>
        {showLogout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(15,23,42,0.52)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, fontFamily: "Inter, system-ui, sans-serif",
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowLogout(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.18 }}
              style={{ background: "white", borderRadius: 20, padding: "28px 28px 24px", maxWidth: 360, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <LogOut style={{ width: 22, height: 22, color: "#dc2626" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 8px" }}>Sign Out?</h2>
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", margin: "0 0 24px", lineHeight: 1.65 }}>
                Are you sure you want to sign out of TrustBridge?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowLogout(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={async () => { setShowLogout(false); await logout(); nav("/"); }} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
