import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, ArrowLeft, MessageSquare, ThumbsUp, Star } from "lucide-react";
import toast from "react-hot-toast";
import { userAPI, chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";
import { MessageModal } from "./ResidentsPage";

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

const CONN_LABELS = {
  local_resident:"Local Resident",student:"Student",employee:"Employee",
  business_owner:"Business Owner",other:"Other"
};
const CONN_COLORS = {
  local_resident:{bg:"#eff6ff",color:"#2563eb"},
  student:{bg:"#f0fdf4",color:"#16a34a"},
  employee:{bg:"#fff7ed",color:"#d97706"},
  business_owner:{bg:"#faf5ff",color:"#7c3aed"},
  other:{bg:"#f1f5f9",color:"#64748b"},
};

function getBadgeLabel(total) {
  if (total>=50) return "Top Contributor";
  if (total>=20) return "Trusted Contributor";
  if (total>=5)  return "Active Contributor";
  return "New Contributor";
}

// Format "Member Since" from a date — e.g. "July 2026"
function formatMemberSince(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Format "Last Active" as a relative string — e.g. "Today", "2 hours ago"
function formatLastActive(date) {
  if (!date) return null;
  const now  = Date.now();
  const d    = new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000); // seconds
  if (diff < 60)          return "Just now";
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2)   return "Yesterday";
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 86400 * 14)  return "Last week";
  if (diff < 86400 * 30)  return `${Math.floor(diff / (86400 * 7))} weeks ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function GuideProfilePage() {
  const { id }   = useParams();
  const { user } = useAuth();
  const nav      = useNavigate();
  const [guide, setGuide]       = useState(null);
  const [ld, setLd]             = useState(true);
  const [msgOpen,  setMsgOpen]  = useState(false);
  const [msgText,  setMsgText]  = useState("");
  const [sending,  setSending]  = useState(false);

  useEffect(()=>{
    userAPI.getResident(id)
      .then(({data})=>setGuide(data.data))
      .catch(()=>toast.error("Guide not found"))
      .finally(()=>setLd(false));
  },[id]);

  const openMessage = () => {
    if (!user) { nav("/login"); return; }
    setMsgText("");
    setMsgOpen(true);
  };

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    const rid = guide?.user?._id || guide?.user || id;
    try {
      const { data } = await chatAPI.createConversation(rid);
      const convId   = data.data._id;
      await chatAPI.sendMessage(convId, { content: msgText.trim() });
      toast.success("Message sent!");
      setMsgOpen(false);
      nav(`/chat?resident=${rid}`);
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to send message");
    } finally { setSending(false); }
  };

  if (ld) return <LoadingSpinner size="lg"/>;
  if (!guide) return (
    <div style={{textAlign:"center",padding:"80px 24px"}}>
      <Link to="/residents" style={{color:"#2563eb",fontWeight:600,textDecoration:"none"}}>← Back to Local Guides</Link>
    </div>
  );

  const u = guide.user || guide;
  const conn = guide.connectionToArea || u.connectionToArea;
  const connLabel = CONN_LABELS[conn] || "Community Member";
  const connStyle = CONN_COLORS[conn] || {bg:"#f1f5f9",color:"#64748b"};
  const qa  = guide.questionsAnswered    || 0;
  const hv  = guide.helpfulVotes         || 0;
  const rs  = guide.recommendationsShared|| 0;
  const total = qa+hv+rs;
  const badgeLabel = getBadgeLabel(total);
  const expertise = guide.areasOfExpertise?.length ? guide.areasOfExpertise :
    guide.specialties?.length ? guide.specialties :
    ["Finding accommodation","Grocery & markets","Transport routes","Local documentation","Medical clinics","Community events"];

  return (
    <>
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Back nav */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"14px 0"}}>
        <div className="wrap">
          <Link to="/residents" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,
            color:"#64748b",fontWeight:600,textDecoration:"none"}}>
            <ArrowLeft style={{width:14,height:14}}/> Back to Local Guides
          </Link>
        </div>
      </div>

      <div className="wrap" style={{paddingTop:28,paddingBottom:56}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:24,alignItems:"start"}} className="gp-grid">

          {/* ── Left ── */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Profile card */}
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:16}}>
                <div style={{width:80,height:80,borderRadius:"50%",background:av(u.name),
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"white",fontSize:28,fontWeight:800,flexShrink:0}}>
                  {u.name?.charAt(0)?.toUpperCase()}{u.name?.split(" ")[1]?.charAt(0)?.toUpperCase()||""}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:0}}>{u.name}</h1>
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
                      padding:"3px 10px",borderRadius:999,background:"#f0fdf4",color:"#16a34a"}}>
                      🌱 {badgeLabel}
                    </span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#64748b"}}>
                      <MapPin style={{width:12,height:12}}/>{guide.area||u.location||"Hyderabad"}
                    </span>
                    <span style={{fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:6,
                      background:connStyle.bg,color:connStyle.color}}>
                      {connLabel}
                    </span>
                  </div>
                  {guide.bio && <p style={{fontSize:13,color:"#475569",lineHeight:1.65,margin:"12px 0 0"}}>{guide.bio}</p>}
                  {!guide.bio && (
                    <p style={{fontSize:13,color:"#475569",lineHeight:1.65,margin:"12px 0 0"}}>
                      Hi! I'm {u.name}, a {connLabel.toLowerCase()} in {guide.area||u.location||"Hyderabad"}. I'm happy to help newcomers find accommodation, navigate the city, and feel at home. Feel free to reach out!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contribution stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[
                {icon:<MessageSquare style={{width:20,height:20,color:"#2563eb"}}/>, bg:"#eff6ff", value:qa, label:"Questions Answered"},
                {icon:<ThumbsUp style={{width:20,height:20,color:"#16a34a"}}/>,     bg:"#f0fdf4", value:hv, label:"Helpful Votes"},
                {icon:<Star style={{width:20,height:20,color:"#d97706"}}/>,         bg:"#fffbeb", value:rs, label:"Recommendations Shared"},
              ].map(s=>(
                <div key={s.label} style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:12,
                  padding:"18px 16px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",
                    justifyContent:"center",margin:"0 auto 10px"}}>
                    {s.icon}
                  </div>
                  <p style={{fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>{s.value}</p>
                  <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* How I Can Help */}
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>How I Can Help</h3>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {expertise.map(e=>(
                  <span key={e} style={{padding:"6px 14px",borderRadius:999,background:"#f0f9ff",
                    border:"1px solid #bae6fd",fontSize:12,fontWeight:600,color:"#0369a1"}}>
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Community Reputation */}
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:"0 0 16px"}}>Community Reputation</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {label:"Newcomers Helped", value:qa,  color:"#2563eb"},
                  {label:"Helpful Votes",    value:hv,  color:"#16a34a"},
                  {label:"Recommendations",  value:rs,  color:"#d97706"},
                ].map(s=>(
                  <div key={s.label} style={{border:"1.5px solid #e2e8f0",borderRadius:12,padding:"18px 14px",textAlign:"center"}}>
                    <p style={{fontSize:26,fontWeight:800,color:s.color,margin:"0 0 4px"}}>{s.value}</p>
                    <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div style={{position:"sticky",top:84}}>
            <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px",boxShadow:"0 4px 20px rgba(0,0,0,0.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:av(u.name),
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"white",fontSize:16,fontWeight:800,flexShrink:0}}>
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <p style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:0}}>{u.name}</p>
                  <p style={{fontSize:11,color:"#16a34a",fontWeight:600,margin:"2px 0 0",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
                    Active contributor
                  </p>
                </div>
              </div>
              <button onClick={openMessage}
                style={{width:"100%",padding:"12px",borderRadius:10,background:"#2563eb",color:"white",
                  border:"none",fontSize:14,fontWeight:700,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  boxShadow:"0 2px 10px rgba(37,99,235,0.3)",marginBottom:10}}>
                <MessageCircle style={{width:16,height:16}}/> Message {u.name?.split(" ")[0]}
              </button>
              <Link to="/residents" style={{display:"block",textAlign:"center",padding:"11px",borderRadius:10,
                background:"white",border:"1.5px solid #e2e8f0",fontSize:13,fontWeight:600,
                color:"#374151",textDecoration:"none"}}>
                Browse All Guides
              </Link>
              <div style={{marginTop:18,paddingTop:16,borderTop:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {label:"Location",   value:guide.area||u.location||"Hyderabad",   color:"#0f172a"},
                  {label:"Connection", value:connLabel,                              color:"#7c3aed"},
                  {label:"Badge",      value:badgeLabel,                             color:"#16a34a"},
                  {label:"Helpful Votes", value:String(hv),                         color:"#d97706"},
                  ...(u.createdAt ? [{label:"Member Since", value:formatMemberSince(u.createdAt), color:"#0891b2"}] : []),
                  ...(u.lastActiveAt||u.lastLogin ? [{label:"Last Active", value:formatLastActive(u.lastActiveAt||u.lastLogin), color:"#16a34a"}] : []),
                ].map(r=>(
                  <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#94a3b8"}}>{r.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:r.color}}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.gp-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>

    <MessageModal
      target={msgOpen ? guide : null}
      text={msgText}
      onText={setMsgText}
      sending={sending}
      onSend={sendMessage}
      onClose={()=>setMsgOpen(false)}
    />
    </>
  );
}
