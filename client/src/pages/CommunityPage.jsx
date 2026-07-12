import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MapPin, Eye, MessageCircle, Search, X, CheckCircle,
  ThumbsUp, TrendingUp, Users, HelpCircle, Zap, BookOpen,
  Home, Truck, Heart, GraduationCap, ChevronRight, Shield,
  Star, Clock, Award, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { communityAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── constants ──────────────────────────────────────────────────────────────── */
const TOPICS = ["general","housing","transportation","food","healthcare","education"];

const TOPIC_META = {
  general:       { icon:<HelpCircle size={13}/>,   color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe",  label:"General"       },
  housing:       { icon:<Home size={13}/>,          color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe",  label:"Housing"       },
  transportation:{ icon:<Truck size={13}/>,         color:"#d97706", bg:"#fffbeb", border:"#fde68a",  label:"Transport"     },
  food:          { icon:<Star size={13}/>,          color:"#dc2626", bg:"#fef2f2", border:"#fecaca",  label:"Food"          },
  healthcare:    { icon:<Heart size={13}/>,         color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc",  label:"Healthcare"    },
  education:     { icon:<GraduationCap size={13}/>, color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0",  label:"Education"     },
  recommendation:{ icon:<Star size={13}/>,          color:"#b45309", bg:"#fffbeb", border:"#fde68a",  label:"Recommendation"},
};

const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const av = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

function timeAgo(d) {
  if(!d) return "";
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)    return "just now";
  if(s<3600)  return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ── Skeleton card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{background:"white",border:"1.5px solid #f1f5f9",borderRadius:16,padding:"22px 24px",marginBottom:0}}>
      <div style={{display:"flex",gap:12,marginBottom:14}}>
        <div style={{width:80,height:20,borderRadius:999,background:"#f1f5f9",animation:"pulse 1.5s ease-in-out infinite"}}/>
        <div style={{width:60,height:20,borderRadius:999,background:"#f1f5f9",animation:"pulse 1.5s ease-in-out infinite"}}/>
      </div>
      <div style={{width:"80%",height:18,borderRadius:8,background:"#f1f5f9",marginBottom:10,animation:"pulse 1.5s ease-in-out infinite"}}/>
      <div style={{width:"95%",height:13,borderRadius:8,background:"#f1f5f9",marginBottom:6,animation:"pulse 1.5s ease-in-out infinite"}}/>
      <div style={{width:"60%",height:13,borderRadius:8,background:"#f1f5f9",animation:"pulse 1.5s ease-in-out infinite"}}/>
    </div>
  );
}

/* ── AskModal (unchanged logic) ────────────────────────────────────────────── */
function AskModal({ onClose, onPosted, initialCategory="" }) {
  const [form, setForm] = useState({title:"",content:"",category:initialCategory||"general",location:""});
  const [sub, setSub] = useState(false);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      const {data} = await communityAPI.create(form);
      toast.success("Question posted!"); onPosted(data.data); onClose();
    } catch(err){ toast.error(err.response?.data?.message||"Failed"); } finally{ setSub(false); }
  };
  const fld = {width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.15s"};
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:20,width:"100%",maxWidth:560,padding:"28px",boxShadow:"0 24px 80px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:"0 0 2px"}}>Ask a Question</h2>
            <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Get trusted help from local residents</p>
          </div>
          <button onClick={onClose} style={{background:"#f8fafc",border:"none",cursor:"pointer",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={15} color="#64748b"/>
          </button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Question Title *</label>
            <input required value={form.title} onChange={e=>upd("title",e.target.value)}
              placeholder="What would you like to know?"
              style={fld} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Details</label>
            <textarea rows={4} value={form.content} onChange={e=>upd("content",e.target.value)}
              placeholder="Share more details about your question..."
              style={{...fld,resize:"vertical"}} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Category</label>
              <select value={form.category} onChange={e=>upd("category",e.target.value)}
                style={{...fld,background:"white",cursor:"pointer"}}>
                {TOPICS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Location (optional)</label>
              <input value={form.location} onChange={e=>upd("location",e.target.value)} placeholder="e.g. Miyapur"
                style={fld} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>
          </div>
          <button type="submit" disabled={sub||!form.title}
            style={{width:"100%",padding:"13px",borderRadius:12,border:"none",fontSize:15,fontWeight:700,
              cursor:sub||!form.title?"not-allowed":"pointer",
              background:sub||!form.title?"#e2e8f0":"#2563eb",color:sub||!form.title?"#94a3b8":"white",
              boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
            {sub?"Posting…":"Post Question"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── RecommendModal (unchanged logic) ──────────────────────────────────────── */
const SERVICE_CATEGORIES = ["Restaurants","Hostels","Grocery Stores","Pharmacies","Education","Transportation","Salons","Laundry","Banks","Other"];
const LOCATIONS = ["Bachupally","Miyapur","Secunderabad","Other"];

function RecommendModal({ onClose, onPosted }) {
  const [form, setForm] = useState({serviceName:"",category:"Restaurants",location:"Bachupally",address:"",description:"",contactInfo:""});
  const [sub, setSub] = useState(false);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const fld = {width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.15s"};
  const submit = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      const payload = {
        title:`Recommended: ${form.serviceName}`,
        content:[`📍 Category: ${form.category}`,`📍 Location: ${form.location}`,form.address?`🏠 Address: ${form.address}`:null,`\n${form.description}`,form.contactInfo?`📞 Contact: ${form.contactInfo}`:null].filter(Boolean).join("\n"),
        category:"recommendation",location:form.location,
        tags:["recommendation",form.category.toLowerCase(),form.location.toLowerCase()],
      };
      const {data} = await communityAPI.create(payload);
      toast.success("Service recommendation submitted!"); onPosted(data.data); onClose();
    } catch(err){ toast.error(err.response?.data?.message||"Failed"); } finally{ setSub(false); }
  };
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:20,width:"100%",maxWidth:560,padding:"28px",boxShadow:"0 24px 80px rgba(0,0,0,0.18)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>Recommend a Service</h2>
            <p style={{fontSize:13,color:"#64748b",margin:0}}>Share a trusted local service to help newcomers.</p>
          </div>
          <button onClick={onClose} style={{background:"#f8fafc",border:"none",cursor:"pointer",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:12}}>
            <X size={15} color="#64748b"/>
          </button>
        </div>
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:20,marginTop:16,fontSize:12,color:"#b45309"}}>
          ⭐ Your recommendation will be visible to newcomers and help them find trusted services.
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Service Name *</label>
            <input required value={form.serviceName} onChange={e=>upd("serviceName",e.target.value)} placeholder="e.g. Sri Adithya Pharmacy…" style={fld} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Category *</label>
              <select required value={form.category} onChange={e=>upd("category",e.target.value)} style={{...fld,background:"white",cursor:"pointer"}} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}>
                {SERVICE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Location *</label>
              <select required value={form.location} onChange={e=>upd("location",e.target.value)} style={{...fld,background:"white",cursor:"pointer"}} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}>
                {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Address <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
            <input value={form.address} onChange={e=>upd("address",e.target.value)} placeholder="e.g. Shop No. 5, Main Road" style={fld} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Why do you recommend this? *</label>
            <textarea required rows={4} value={form.description} onChange={e=>upd("description",e.target.value)} placeholder="Share your experience…" style={{...fld,resize:"vertical"}} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Contact <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
            <input value={form.contactInfo} onChange={e=>upd("contactInfo",e.target.value)} placeholder="Phone or website" style={fld} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button type="button" onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"white",fontSize:14,fontWeight:600,color:"#475569",cursor:"pointer"}}>Cancel</button>
            <button type="submit" disabled={sub||!form.serviceName.trim()||!form.description.trim()}
              style={{flex:2,padding:"12px",borderRadius:12,border:"none",fontSize:15,fontWeight:700,
                cursor:sub||!form.serviceName.trim()||!form.description.trim()?"not-allowed":"pointer",
                background:sub||!form.serviceName.trim()||!form.description.trim()?"#e2e8f0":"#d97706",
                color:sub||!form.serviceName.trim()||!form.description.trim()?"#94a3b8":"white"}}>
              {sub?"Submitting…":"⭐ Submit Recommendation"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── PostCard ───────────────────────────────────────────────────────────────── */
function PostCard({ p, index }) {
  const [hov, setHov] = useState(false);
  const meta = TOPIC_META[p.category] || TOPIC_META.general;
  const authorName = p.author?.name || p.user?.name || "Anonymous";
  const answers = p.answers?.length ?? p.answerCount ?? 0;
  const likes   = (p.likes||[]).length;
  const isResolved = p.isResolved || answers > 0;

  return (
    <motion.div
      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:index*0.04,duration:0.2}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <Link to={`/community/${p._id}`} style={{textDecoration:"none"}}>
        <div style={{
          background:"white",border:`1.5px solid ${hov?"#c7d2fe":"#f1f5f9"}`,borderRadius:16,padding:"20px 22px",
          transition:"all 0.18s",boxShadow:hov?"0 8px 32px rgba(37,99,235,0.1)":"0 1px 4px rgba(0,0,0,0.04)",
          transform:hov?"translateY(-1px)":"translateY(0)"}}>

          {/* Top row: badges + meta */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,
              padding:"4px 10px",borderRadius:999,background:meta.bg,color:meta.color,border:`1px solid ${meta.border}`}}>
              {meta.icon} {p.category==="recommendation"?"Recommendation":meta.label}
            </span>
            {isResolved && answers>0 && (
              <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,
                padding:"4px 10px",borderRadius:999,background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>
                <CheckCircle size={11}/> Answered
              </span>
            )}
            {p.location && (
              <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8",marginLeft:"auto"}}>
                <MapPin size={11}/>{p.location}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{fontSize:15,fontWeight:700,color:hov?"#2563eb":"#0f172a",margin:"0 0 7px",lineHeight:1.45,transition:"color 0.15s"}}>
            {p.title}
          </h3>

          {/* Excerpt */}
          {p.content && (
            <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px",lineHeight:1.6,
              overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              {p.content}
            </p>
          )}

          {/* Footer row */}
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            {/* Author */}
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:av(authorName),
                display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800,flexShrink:0}}>
                {authorName.charAt(0)}
              </div>
              <span style={{fontSize:12,color:"#475569",fontWeight:600}}>{authorName}</span>
            </div>
            <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
              <Clock size={11}/>{timeAgo(p.createdAt)}
            </span>

            {/* Stats */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto"}}>
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,
                color:answers>0?"#16a34a":"#94a3b8",fontWeight:answers>0?700:400}}>
                <MessageCircle size={12}/>{answers}
              </span>
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
                <ThumbsUp size={12}/>{likes}
              </span>
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#94a3b8"}}>
                <Eye size={12}/>{p.views||0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Sidebar blocks ─────────────────────────────────────────────────────────── */
function SideCard({ children, style={} }) {
  return (
    <div style={{background:"white",border:"1.5px solid #f1f5f9",borderRadius:16,
      padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...style}}>
      {children}
    </div>
  );
}
function SideTitle({ icon, title }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <span style={{fontSize:16}}>{icon}</span>
      <h3 style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:0}}>{title}</h3>
    </div>
  );
}

function TopContributors({ posts }) {
  // Build a map of users who have written at least one answer.
  // Asking questions alone does NOT qualify someone as a contributor.
  const map = {};
  posts.forEach(p => {
    if (!p.answers?.length) return; // skip posts with zero answers
    p.answers.forEach(ans => {
      const name = ans.author?.name;
      const id   = ans.author?._id || name;
      if (!name || !id) return;
      if (!map[id]) map[id] = { name, answers: 0, likes: 0 };
      map[id].answers++;
      // Count helpful votes: likes on this answer (if stored) OR
      // fall back to counting the answer's own presence once.
      map[id].likes += (ans.likes?.length ?? 0);
    });
  });

  // Sort: highest likes first, then most answers, then name
  const top = Object.values(map)
    .filter(c => c.answers > 0)          // must have answered at least once
    .sort((a, b) => (b.likes - a.likes) || (b.answers - a.answers))
    .slice(0, 5);

  return (
    <SideCard>
      <SideTitle icon="🏆" title="Top Contributors"/>
      {top.length === 0 ? (
        <div style={{textAlign:"center",padding:"12px 0"}}>
          <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 4px"}}>No contributors yet.</p>
          <p style={{fontSize:11,color:"#cbd5e1",margin:0}}>Be the first to help your community!</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {top.map((c,i)=>(
            <div key={c.name} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,fontWeight:700,color:"#94a3b8",width:16}}>{i+1}</span>
              <div style={{width:30,height:30,borderRadius:"50%",background:av(c.name),
                display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>
                {c.name.charAt(0)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:700,color:"#0f172a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</p>
                <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
                  {c.answers} {c.answers === 1 ? "answer" : "answers"}
                  {c.likes > 0 && ` · ${c.likes} helpful`}
                </p>
              </div>
              {i===0&&<span style={{fontSize:12}}>🥇</span>}
              {i===1&&<span style={{fontSize:12}}>🥈</span>}
              {i===2&&<span style={{fontSize:12}}>🥉</span>}
            </div>
          ))}
        </div>
      )}
    </SideCard>
  );
}

function NewcomersSection({ posts }) {
  // Users who have asked at least one question but have NOT answered any.
  // This correctly separates seekers from helpers.
  const askers   = {};  // id → { name, questions, latestAt }
  const answered = new Set();

  posts.forEach(p => {
    // Track everyone who has answered — they are contributors, not newcomers
    p.answers?.forEach(ans => {
      const aid = ans.author?._id || ans.author?.name;
      if (aid) answered.add(String(aid));
    });
    // Track question authors
    const name = p.author?.name || p.user?.name;
    const id   = String(p.author?._id || p.user?._id || name || '');
    if (!name || !id) return;
    if (!askers[id]) askers[id] = { name, questions: 0, latestAt: p.createdAt };
    askers[id].questions++;
    if (new Date(p.createdAt) > new Date(askers[id].latestAt)) {
      askers[id].latestAt = p.createdAt;
    }
  });

  // Keep only pure question-askers (no answers given)
  const newcomers = Object.entries(askers)
    .filter(([id]) => !answered.has(id))
    .map(([, v]) => v)
    .sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt))
    .slice(0, 5);

  if (!newcomers.length) return null;

  return (
    <SideCard>
      <SideTitle icon="👋" title="Newcomers"/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {newcomers.map(c => (
          <div key={c.name} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:av(c.name),
              display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:800,flexShrink:0}}>
              {c.name.charAt(0)}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:700,color:"#0f172a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</p>
              <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
                Asked {c.questions} {c.questions === 1 ? "question" : "questions"}
              </p>
            </div>
            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:999,
              background:"#f0fdf4",color:"#16a34a",flexShrink:0,whiteSpace:"nowrap"}}>
              New
            </span>
          </div>
        ))}
      </div>
    </SideCard>
  );
}

function TrendingQuestions({ posts }) {
  const trending = [...posts]
    .sort((a,b)=>((b.answers?.length??0)+(b.views||0)+(b.likes?.length||0))-((a.answers?.length??0)+(a.views||0)+(a.likes?.length||0)))
    .slice(0,4);
  if (!trending.length) return null;
  return (
    <SideCard>
      <SideTitle icon="🔥" title="Trending Questions"/>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {trending.map((p,i)=>{
          const meta = TOPIC_META[p.category] || TOPIC_META.general;
          return (
            <Link key={p._id} to={`/community/${p._id}`} style={{textDecoration:"none"}}>
              <div style={{padding:"10px 0",borderBottom:i<trending.length-1?"1px solid #f8fafc":"none",cursor:"pointer"}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999,
                    background:meta.bg,color:meta.color,flexShrink:0,marginTop:1}}>
                    {meta.label}
                  </span>
                </div>
                <p style={{fontSize:12,fontWeight:600,color:"#0f172a",margin:"4px 0 4px",lineHeight:1.4,
                  overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                  {p.title}
                </p>
                <span style={{fontSize:11,color:"#94a3b8"}}>{p.answers?.length??0} answers · {timeAgo(p.createdAt)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </SideCard>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const [posts, setPosts]       = useState([]);
  const [loading, setLd]        = useState(true);
  const [showModal, setShowM]   = useState(false);
  const [showRec, setShowRec]   = useState(false);
  const [q, setQ]               = useState("");
  const [selTopic, setTopic]    = useState("");
  const [activeTab, setTab]     = useState("all");

  useEffect(()=>{
    communityAPI.getAll().then(({data})=>setPosts(data.data||[])).catch(()=>setPosts([])).finally(()=>setLd(false));
    const action = sp.get("action");
    if (user) {
      if (action==="ask")       setShowM(true);
      if (action==="recommend") setShowRec(true);
    }
  },[]);

  /* filtering */
  const filtered = posts.filter(p => {
    const ms = !q || p.title?.toLowerCase().includes(q.toLowerCase()) || p.content?.toLowerCase().includes(q.toLowerCase());
    const mc = !selTopic || p.category?.toLowerCase()===selTopic;
    let mt = true;
    if (activeTab==="solved")      mt = (p.answers?.length??0)>0;
    if (activeTab==="unanswered")  mt = (p.answers?.length??0)===0;
    if (activeTab==="trending")    mt = ((p.views||0)+(p.likes?.length||0))>5;
    if (activeTab==="newest")      mt = true; // will be sorted
    if (["housing","transportation","food","healthcare","education"].includes(activeTab)) {
      mt = p.category===activeTab;
    }
    return ms && mc && mt;
  });

  const sorted = activeTab==="trending"
    ? [...filtered].sort((a,b)=>((b.views||0)+(b.likes?.length||0)+(b.answers?.length||0))-((a.views||0)+(a.likes?.length||0)+(a.answers?.length||0)))
    : [...filtered].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const totalAnswers   = posts.reduce((s,p)=>s+(p.answers?.length??0),0);
  const totalLikes     = posts.reduce((s,p)=>s+(p.likes?.length||0),0);
  const membersSet     = new Set(posts.map(p=>p.author?._id||p.user?._id).filter(Boolean));

  const TABS = [
    {id:"all",label:"All"},
    {id:"trending",label:"🔥 Trending"},
    {id:"newest",label:"✨ Newest"},
    {id:"solved",label:"✅ Solved"},
    {id:"unanswered",label:"❓ Unanswered"},
    {id:"housing",label:"🏠 Housing"},
    {id:"food",label:"🍽 Food"},
    {id:"transportation",label:"🚗 Transport"},
    {id:"healthcare",label:"❤️ Healthcare"},
    {id:"education",label:"📚 Education"},
  ];

  const goAsk = () => user ? setShowM(true) : (window.location.href="/login");
  const goRec = () => user ? setShowRec(true) : (window.location.href="/login");

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>

      {/* ── Hero section ─────────────────────────────────────────────────────── */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 100%)",paddingTop:28,paddingBottom:28}}>
        <div className="wrap">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.12)",
                padding:"5px 14px",borderRadius:999,marginBottom:12}}>
                <Users size={13} color="rgba(255,255,255,0.9)"/>
                <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.9)"}}>TrustBridge Community</span>
              </div>
              <h1 style={{fontSize:30,fontWeight:800,color:"white",margin:"0 0 8px",lineHeight:1.2}}>
                Community Forum
              </h1>
              <p style={{fontSize:14,color:"rgba(255,255,255,0.8)",margin:"0 0 20px",maxWidth:480,lineHeight:1.6}}>
                Ask questions, share local tips, and get trusted help from people who know Hyderabad best.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={goAsk}
                  style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 22px",borderRadius:10,
                    background:"white",color:"#2563eb",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
                    boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
                  <Plus size={16}/> Ask a Question
                </button>
                <button onClick={goRec}
                  style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 22px",borderRadius:10,
                    background:"rgba(255,255,255,0.12)",color:"white",border:"1.5px solid rgba(255,255,255,0.25)",
                    cursor:"pointer",fontSize:14,fontWeight:600}}>
                  ⭐ Recommend a Service
                </button>
              </div>
            </div>
            {/* Stats row */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                {icon:<Users size={18}/>, label:"Members",   value:membersSet.size||"—"},
                {icon:<HelpCircle size={18}/>,label:"Questions",value:posts.length},
                {icon:<MessageCircle size={18}/>,label:"Answers",value:totalAnswers},
                {icon:<ThumbsUp size={18}/>,label:"Helpful Votes",value:totalLikes},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.12)",borderRadius:12,
                  padding:"14px 18px",minWidth:90,textAlign:"center",border:"1px solid rgba(255,255,255,0.18)"}}>
                  <div style={{color:"rgba(255,255,255,0.8)",marginBottom:4,display:"flex",justifyContent:"center"}}>{s.icon}</div>
                  <p style={{fontSize:20,fontWeight:800,color:"white",margin:"0 0 2px"}}>{s.value}</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.7)",margin:0}}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="wrap" style={{paddingTop:20,paddingBottom:48}}>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:22,alignItems:"start"}} className="cf-grid">

          {/* ── Main column ──────────────────────────────────────────────────── */}
          <div>
            {/* Search */}
            <div style={{position:"relative",marginBottom:14}}>
              <Search style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
                width:15,height:15,color:"#94a3b8"}}/>
              <input value={q} onChange={e=>setQ(e.target.value)}
                placeholder="Search questions, topics, and local advice..."
                style={{width:"100%",height:48,paddingLeft:42,paddingRight:40,border:"1.5px solid #e2e8f0",
                  borderRadius:12,fontSize:14,background:"white",outline:"none",boxSizing:"border-box",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                onFocus={e=>{e.target.style.borderColor="#2563eb";e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.1)"}}
                onBlur={e=>{e.target.style.borderColor="#e2e8f0";e.target.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"}}/>
              {q && (
                <button onClick={()=>setQ("")}
                  style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",padding:4}}>
                  <X size={14} color="#94a3b8"/>
                </button>
              )}
            </div>

            {/* Filter tabs — horizontally scrollable */}
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:18,paddingBottom:4}} className="hide-scrollbar">
              {TABS.map(t=>{
                const active = activeTab===t.id;
                return (
                  <button key={t.id} onClick={()=>{setTab(t.id);setTopic(["housing","food","transportation","healthcare","education"].includes(t.id)?t.id:"");}}
                    style={{padding:"7px 14px",borderRadius:999,border:"1.5px solid",whiteSpace:"nowrap",
                      fontSize:12,fontWeight:active?700:500,cursor:"pointer",transition:"all 0.15s",flexShrink:0,
                      background:active?"#2563eb":"white",color:active?"white":"#374151",
                      borderColor:active?"#2563eb":"#e2e8f0",
                      boxShadow:active?"0 2px 8px rgba(37,99,235,0.2)":"none"}}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Results count */}
            {!loading && (
              <p style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>
                <strong style={{color:"#374151"}}>{sorted.length}</strong> {sorted.length===1?"post":"posts"}
                {q && <> matching "<strong style={{color:"#2563eb"}}>{q}</strong>"</>}
              </p>
            )}

            {/* Posts */}
            {loading ? (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[1,2,3,4].map(i=><SkeletonCard key={i}/>)}
              </div>
            ) : sorted.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 24px",background:"white",borderRadius:16,
                border:"1.5px solid #f1f5f9",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:44,marginBottom:12}}>🤔</div>
                <h3 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>No discussions found</h3>
                <p style={{fontSize:13,color:"#64748b",margin:"0 0 20px"}}>
                  {q ? `No results for "${q}"` : "Be the first to start a conversation!"}
                </p>
                <button onClick={goAsk}
                  style={{padding:"11px 24px",borderRadius:10,background:"#2563eb",color:"white",
                    border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  Ask a Question
                </button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {sorted.map((p,i)=><PostCard key={p._id} p={p} index={i}/>)}
              </div>
            )}
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────────── */}
          <div style={{display:"flex",flexDirection:"column",gap:14,position:"sticky",top:84,minWidth:0,maxWidth:300,width:"100%"}}>

            <TrendingQuestions posts={posts}/>
            <TopContributors posts={posts}/>
            <NewcomersSection posts={posts}/>

            {/* Newcomer Corner */}
            <SideCard>
              <SideTitle icon="🌱" title="Newcomer Corner"/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {icon:"🏠",label:"Find Accommodation",to:"/services?category=Hostels"},
                  {icon:"🚗",label:"Transportation Guide",to:"/services?category=Transportation"},
                  {icon:"🆘",label:"Emergency Contacts",to:"/emergency-contacts"},
                  {icon:"🎓",label:"Student Tips",to:"/student-tips"},
                  {icon:"❓",label:"Frequently Asked",to:"/faq"},
                ].map(item=>(
                  <Link key={item.label} to={item.to} style={{textDecoration:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,
                      transition:"background 0.12s",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:15}}>{item.icon}</span>
                      <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{item.label}</span>
                      <ChevronRight size={13} color="#94a3b8" style={{marginLeft:"auto"}}/>
                    </div>
                  </Link>
                ))}
              </div>
            </SideCard>

            {/* Community Guidelines */}
            <SideCard>
              <SideTitle icon="📋" title="Community Guidelines"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  "Be respectful and supportive to newcomers.",
                  "Post questions with clear, specific details.",
                  "Mark your post as resolved once answered.",
                  "No spam or self-promotion without context.",
                ].map(g=>(
                  <div key={g} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <CheckCircle size={13} color="#16a34a" style={{flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{g}</span>
                  </div>
                ))}
              </div>
            </SideCard>

            {/* Quick CTAs */}
            <button onClick={goAsk}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px dashed #bfdbfe",
                background:"#f0f7ff",fontSize:13,fontWeight:600,color:"#2563eb",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"}
              onMouseLeave={e=>e.currentTarget.style.background="#f0f7ff"}>
              <Plus size={14}/> Ask a Question
            </button>
            <button onClick={goRec}
              style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px dashed #fde68a",
                background:"#fffdf5",fontSize:13,fontWeight:600,color:"#b45309",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#fef9c3"}
              onMouseLeave={e=>e.currentTarget.style.background="#fffdf5"}>
              ⭐ Recommend a Service
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && <AskModal onClose={()=>setShowM(false)} onPosted={p=>setPosts(prev=>[p,...prev])} initialCategory={sp.get("category")||"general"}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showRec && <RecommendModal onClose={()=>setShowRec(false)} onPosted={p=>setPosts(prev=>[p,...prev])}/>}
      </AnimatePresence>

      <style>{`
        @media(max-width:1024px){.cf-grid{grid-template-columns:1fr !important;}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}
        .hide-scrollbar::-webkit-scrollbar{display:none;}
        .overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;
          justify-content:center;z-index:400;padding:16px;backdrop-filter:blur(2px);}
        .cf-grid > *{min-width:0;}
      `}</style>
    </div>
  );
}
