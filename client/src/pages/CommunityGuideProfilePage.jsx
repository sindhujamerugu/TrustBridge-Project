import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, ArrowLeft, CheckCircle, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { userAPI, communityAPI, chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MessageModal } from "./ResidentsPage";

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

function timeAgo(d) {
  if (!d) return null;
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "Just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 86400*2) return "Yesterday";
  if (s < 86400*7) return `${Math.floor(s/86400)} days ago`;
  return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

function memberSince(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { month:"long", year:"numeric" });
}

/* ── Skeleton loader ─────────────────────────────────────────────────────────── */
function SkeletonProfile() {
  return (
    <div style={{ background:"#f0f4f8", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"14px 0" }}>
        <div className="wrap">
          <div style={{ width:140, height:16, borderRadius:8, background:"#e2e8f0", animation:"pulse 1.5s ease infinite" }}/>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop:28, paddingBottom:56 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }} className="cgp-grid">
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16, padding:24 }}>
                <div style={{ width:"60%", height:18, borderRadius:8, background:"#e2e8f0", marginBottom:12, animation:"pulse 1.5s ease infinite" }}/>
                <div style={{ width:"80%", height:13, borderRadius:8, background:"#e2e8f0", marginBottom:8, animation:"pulse 1.5s ease infinite" }}/>
                <div style={{ width:"70%", height:13, borderRadius:8, background:"#e2e8f0", animation:"pulse 1.5s ease infinite" }}/>
              </div>
            ))}
          </div>
          <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16, padding:22, height:280, animation:"pulse 1.5s ease infinite" }}/>
        </div>
      </div>
    </div>
  );
}

export default function CommunityGuideProfilePage() {
  const { userId } = useParams();
  const { user }   = useAuth();
  const nav        = useNavigate();

  const [guide,     setGuide]    = useState(null);
  const [posts,     setPosts]    = useState([]);
  const [ld,        setLd]       = useState(true);
  const [notFound,  setNotFound] = useState(false);
  const [msgOpen,   setMsgOpen]  = useState(false);
  const [msgText,   setMsgText]  = useState("");
  const [sending,   setSending]  = useState(false);

  useEffect(() => {
    // Fetch profile by User ID
    userAPI.getResidentByUserId(userId)
      .then(({ data }) => {
        const profile = data.data;
        // Only residents (Community Guides) get a profile
        const u = profile.user || profile;
        if (u.role && u.role !== 'resident') { setNotFound(true); return; }
        setGuide(profile);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLd(false));

    // Fetch community posts for recent contributions
    communityAPI.getAll()
      .then(({ data }) => {
        const allPosts = data.data || [];
        // Collect posts where this user answered OR asked
        const contributions = [];
        allPosts.forEach(p => {
          if (String(p.author?._id) === String(userId) || String(p.user?._id) === String(userId)) {
            contributions.push({ type:"asked", title: p.title, date: p.createdAt, id: p._id });
          }
          (p.answers || []).forEach(ans => {
            if (String(ans.author?._id) === String(userId)) {
              contributions.push({ type:"answered", title: p.title, date: ans.createdAt || p.createdAt, id: p._id });
            }
          });
        });
        // Sort newest first
        contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPosts(contributions.slice(0, 5));
      })
      .catch(() => {});
  }, [userId]);

  const openMessage = () => {
    if (!user) { nav("/login"); return; }
    setMsgText(""); setMsgOpen(true);
  };

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    const rid = guide?.user?._id || userId;
    try {
      const { data } = await chatAPI.createConversation(rid);
      await chatAPI.sendMessage(data.data._id, { content: msgText.trim() });
      toast.success("Message sent!");
      setMsgOpen(false);
      nav(`/chat?resident=${rid}`);
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to send");
    } finally { setSending(false); }
  };

  if (ld) return <SkeletonProfile/>;

  if (notFound) return (
    <div style={{ textAlign:"center", padding:"80px 24px", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
      <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>Community Guide Not Found</h2>
      <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px" }}>
        This guide profile doesn't exist or is not available.
      </p>
      <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 22px",
        borderRadius:10, background:"#2563eb", color:"white", textDecoration:"none",
        fontSize:14, fontWeight:700 }}>
        ← Back to Home
      </Link>
    </div>
  );

  const u         = guide.user || guide;
  const qa        = guide.questionsAnswered    || 0;
  const hv        = guide.helpfulVotes         || 0;
  const languages = guide.languages?.length ? guide.languages : null;
  const bio       = guide.bio || null;

  return (
    <>
    <div style={{ background:"#f0f4f8", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Back nav */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"14px 0" }}>
        <div className="wrap">
          <button onClick={() => nav(-1)} style={{
            display:"inline-flex", alignItems:"center", gap:6, fontSize:13,
            color:"#64748b", fontWeight:600, background:"none", border:"none",
            cursor:"pointer", padding:0,
          }}>
            <ArrowLeft style={{ width:14, height:14 }}/> Back
          </button>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:28, paddingBottom:56 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24, alignItems:"start" }} className="cgp-grid">

          {/* ── Left ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Hero card */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
              style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
                padding:"28px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:20 }}>
                {/* Avatar */}
                <div style={{ width:80, height:80, borderRadius:"50%", background:av(u.name),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontSize:28, fontWeight:800, flexShrink:0,
                  boxShadow:`0 4px 16px ${av(u.name)}44` }}>
                  {u.name?.charAt(0)?.toUpperCase()}{u.name?.split(" ")[1]?.charAt(0)?.toUpperCase()||""}
                </div>
                <div style={{ flex:1 }}>
                  {/* Name + verified */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>{u.name}</h1>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11,
                      fontWeight:700, padding:"3px 10px", borderRadius:999,
                      background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>
                      Verified Community Guide
                    </span>
                  </div>

                  {/* Location */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    {(guide.area || u.location) && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                        <MapPin style={{ width:12, height:12 }}/>{guide.area || u.location}
                      </span>
                    )}
                    {u.createdAt && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#94a3b8" }}>
                        <Calendar style={{ width:11, height:11 }}/>
                        Member since {memberSince(u.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display:"flex", gap:16, paddingTop:18, borderTop:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                {[
                  { icon:"💬", label:"Answers", value: qa },
                  { icon:"👍", label:"Helpful Votes", value: hv },
                ].map(s => (
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10,
                    background:"#f8fafc", borderRadius:10, padding:"10px 16px",
                    border:"1px solid #f1f5f9", flex:1, minWidth:120 }}>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontSize:18, fontWeight:800, color:"#0f172a", margin:0, lineHeight:1 }}>{s.value}</p>
                      <p style={{ fontSize:11, color:"#94a3b8", margin:"3px 0 0" }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
                padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 12px" }}>About</h3>
              <p style={{ fontSize:13, color: bio ? "#475569" : "#94a3b8", lineHeight:1.65, margin:0,
                fontStyle: bio ? "normal" : "italic" }}>
                {bio || "No bio added yet."}
              </p>
            </motion.div>

            {/* Languages */}
            {languages && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
                  padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 12px" }}>Languages Spoken</h3>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {languages.map(lang => (
                    <span key={lang} style={{ padding:"5px 14px", borderRadius:999,
                      background:"#f0f9ff", border:"1px solid #bae6fd",
                      fontSize:12, fontWeight:600, color:"#0369a1" }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent contributions */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
                padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 14px" }}>Recent Contributions</h3>
              {posts.length === 0 ? (
                <p style={{ fontSize:13, color:"#94a3b8", margin:0, fontStyle:"italic" }}>No contributions yet.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {posts.map((c, i) => (
                    <Link key={i} to={`/community/${c.id}`} style={{ textDecoration:"none" }}>
                      <div style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:10,
                        background:"#f8fafc", border:"1px solid #f1f5f9", transition:"all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.borderColor="#bfdbfe"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#f1f5f9"; }}>
                        <span style={{ fontSize:13, flexShrink:0,
                          color: c.type==="answered" ? "#2563eb" : "#64748b",
                          fontWeight:600, minWidth:70 }}>
                          {c.type === "answered" ? "Answered" : "Asked"}
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:600, color:"#0f172a", margin:0,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            "{c.title}"
                          </p>
                          {c.date && (
                            <span style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:3, marginTop:2 }}>
                              <Clock style={{ width:10, height:10 }}/>{timeAgo(c.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:0.4, delay:0.08 }}
            style={{ position:"sticky", top:84 }}>
            <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
              padding:"22px", boxShadow:"0 4px 20px rgba(0,0,0,0.07)" }}>

              {/* Mini avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:av(u.name),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontSize:16, fontWeight:800, flexShrink:0 }}>
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>{u.name}</p>
                  <p style={{ fontSize:11, color:"#16a34a", fontWeight:600, margin:"2px 0 0",
                    display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>
                    Active contributor
                  </p>
                </div>
              </div>

              {/* Message button */}
              <button onClick={openMessage}
                style={{ width:"100%", padding:"12px", borderRadius:10, background:"#2563eb",
                  color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:"0 2px 10px rgba(37,99,235,0.3)", marginBottom:10,
                  transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background="#1d4ed8"; e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#2563eb"; e.currentTarget.style.transform="translateY(0)"; }}>
                <MessageCircle style={{ width:16, height:16 }}/> Message {u.name?.split(" ")[0]}
              </button>

              <Link to="/residents" style={{ display:"block", textAlign:"center", padding:"11px",
                borderRadius:10, background:"white", border:"1.5px solid #e2e8f0",
                fontSize:13, fontWeight:600, color:"#374151", textDecoration:"none" }}>
                Browse All Guides
              </Link>

              {/* Info rows */}
              <div style={{ marginTop:18, paddingTop:16, borderTop:"1px solid #f1f5f9",
                display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"Location",      value: guide.area || u.location || "Hyderabad", color:"#0f172a" },
                  { label:"Answers",       value: String(qa),                               color:"#2563eb" },
                  { label:"Helpful Votes", value: String(hv),                               color:"#16a34a" },
                  u.createdAt ? { label:"Member Since", value: memberSince(u.createdAt),    color:"#0891b2" } : null,
                ].filter(Boolean).map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{r.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.cgp-grid{grid-template-columns:1fr !important;}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </div>

    <MessageModal
      target={msgOpen ? { user: u, area: guide.area, connectionToArea: guide.connectionToArea } : null}
      text={msgText}
      onText={setMsgText}
      sending={sending}
      onSend={sendMessage}
      onClose={() => setMsgOpen(false)}
    />
    </>
  );
}
