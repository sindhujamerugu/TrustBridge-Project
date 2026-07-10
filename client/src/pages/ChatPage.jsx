import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { Send, MessageCircle, Search, MoreVertical, Users, Compass, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { LoadingSpinner } from "../components/ui/Cards";

/* ── helpers ── */
const AV_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#0f766e"];
const avColor = n => AV_COLORS[(n?.charCodeAt(0)||0) % AV_COLORS.length];

function Avatar({ name, size=36, online=false }) {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:avColor(name||"?"),
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"white", fontWeight:800, fontSize:Math.round(size*0.38) }}>
        {(name||"?").charAt(0).toUpperCase()}
      </div>
      {online && (
        <span style={{ position:"absolute", bottom:1, right:1, width:9, height:9,
          borderRadius:"50%", background:"#22c55e", border:"2px solid white" }}/>
      )}
    </div>
  );
}

function fmt(d) {
  if (!d) return "";
  const date = new Date(d), now = new Date();
  const isToday     = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();
  if (isToday)     return date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
function fmtMsg(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}
function dateLabel(d) {
  if (!d) return "";
  const date = new Date(d), now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === new Date(now - 86400000).toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short", year:"numeric" });
}

/* ── Full-page empty state (no conversations at all) ── */
function NoConversations() {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
      style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
        padding:"clamp(24px,6vh,60px) 24px 40px", background:"linear-gradient(160deg,#f8faff 0%,#f0f4f8 100%)",
        textAlign:"center", overflowY:"auto" }}>

      {/* Illustration */}
      <div style={{ position:"relative", marginBottom:28 }}>
        <div style={{ width:100, height:100, borderRadius:"50%",
          background:"linear-gradient(135deg,#dbeafe,#eff6ff)", display:"flex",
          alignItems:"center", justifyContent:"center",
          boxShadow:"0 8px 32px rgba(37,99,235,0.12)" }}>
          <MessageCircle style={{ width:44, height:44, color:"#2563eb" }}/>
        </div>
        {/* decorative dots */}
        {[
          { top:-10, right:-10, size:22, bg:"#e0f2fe", delay:0 },
          { top:10,  left:-18, size:14, bg:"#ddd6fe", delay:0.15 },
          { bottom:-8, right:4, size:16, bg:"#bbf7d0", delay:0.3 },
        ].map((d,i)=>(
          <motion.div key={i}
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ delay:d.delay, type:"spring", stiffness:300 }}
            style={{ position:"absolute", top:d.top, right:d.right, left:d.left, bottom:d.bottom,
              width:d.size, height:d.size, borderRadius:"50%", background:d.bg }}/>
        ))}
      </div>

      <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>
        No conversations yet
      </h2>
      <p style={{ fontSize:13, color:"#64748b", lineHeight:1.7, maxWidth:320, margin:"0 0 32px" }}>
        Connect with local guides, community members, and service providers
        to get trusted help settling into Hyderabad.
      </p>

      {/* CTA cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
        {[
          { to:"/residents",  Icon:Users,   label:"Browse Local Guides",   desc:"Get help from people who know the area",    bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" },
          { to:"/community",  Icon:Compass, label:"Explore Community",     desc:"Ask questions, share tips, connect",        bg:"#faf5ff", color:"#7c3aed", border:"#ddd6fe" },
          { to:"/services",   Icon:Store,   label:"Find Services",         desc:"Discover verified local services nearby",   bg:"#f0fdf4", color:"#16a34a", border:"#bbf7d0" },
        ].map(({ to, Icon, label, desc, bg, color, border }) => (
          <Link key={to} to={to} style={{ textDecoration:"none" }}>
            <motion.div whileHover={{ y:-2, boxShadow:"0 8px 24px rgba(0,0,0,0.09)" }}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                background:"white", border:`1.5px solid ${border}`, borderRadius:14,
                cursor:"pointer", transition:"box-shadow 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width:40, height:40, borderRadius:10, background:bg,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon style={{ width:18, height:18, color }} />
              </div>
              <div style={{ textAlign:"left" }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", margin:0 }}>{label}</p>
                <p style={{ fontSize:11, color:"#64748b", margin:"2px 0 0" }}>{desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Chat pane empty state (conversations exist but none selected) ── */
function SelectConversationPrompt() {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}
      style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:"#f8fafc", gap:12, padding:32 }}>
      <div style={{ width:64, height:64, borderRadius:"50%",
        background:"linear-gradient(135deg,#dbeafe,#eff6ff)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 16px rgba(37,99,235,0.1)" }}>
        <MessageCircle style={{ width:28, height:28, color:"#2563eb" }}/>
      </div>
      <p style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:0 }}>Your Messages</p>
      <p style={{ fontSize:13, color:"#64748b", textAlign:"center", maxWidth:280, lineHeight:1.6, margin:0 }}>
        Select a conversation from the sidebar to continue chatting.
      </p>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user }                                        = useAuth();
  const { socket, joinConversation, leaveConversation } = useSocket();
  const [sp]               = useSearchParams();
  const { conversationId } = useParams();
  const [convs,  setConvs]  = useState([]);
  const [active, setActive] = useState(null);
  const [msgs,   setMsgs]   = useState([]);
  const [text,   setText]   = useState("");
  const [typing, setTyping] = useState(false);
  const [ld,     setLd]     = useState(true);
  const [search, setSearch] = useState("");
  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const ttRef    = useRef(null);

  /* ── Load conversations ── */
  useEffect(() => {
    chatAPI.getConversations().then(({ data }) => {
      const list = data.data || [];
      setConvs(list);

      if (conversationId) {
        const found = list.find(c => c._id === conversationId);
        if (found) {
          selectConv(found);
        } else {
          chatAPI.getMessages(conversationId)
            .then(() => chatAPI.getConversations())
            .then(({ data: fresh }) => {
              const freshList = fresh.data || [];
              setConvs(freshList);
              const target = freshList.find(c => c._id === conversationId);
              if (target) selectConv(target);
            })
            .catch(() => { if (list.length > 0) selectConv(list[0]); });
        }
        return;
      }

      const rid = sp.get("resident");
      if (rid) {
        chatAPI.createConversation(rid)
          .then(({ data: cd }) => {
            const conv = cd.data;
            setConvs(prev => prev.find(c => c._id === conv._id)
              ? prev.map(c => c._id === conv._id ? conv : c)
              : [conv, ...prev]);
            selectConv(conv);
          })
          .catch(() => {
            const found = list.find(c => c.participants?.some(p => (p._id||p) === rid));
            if (found) selectConv(found);
            else if (list.length > 0) selectConv(list[0]);
          });
        return;
      }

      if (list.length > 0) selectConv(list[0]);
    }).catch(() => {}).finally(() => setLd(false));
  }, []);

  /* ── Socket events ── */
  useEffect(() => {
    if (!socket || !active) return;
    const onMsg = m => {
      setMsgs(p => p.some(x => x._id === m._id) ? p : [...p, m]);
      setConvs(prev => {
        const updated = prev.map(c =>
          c._id === active._id
            ? { ...c, lastMessage: m.content, lastMessageAt: m.createdAt }
            : c
        );
        return [...updated].sort((a,b) =>
          new Date(b.lastMessageAt||b.updatedAt) - new Date(a.lastMessageAt||a.updatedAt)
        );
      });
      scroll();
    };
    const onTyp  = () => setTyping(true);
    const onStop = () => setTyping(false);
    socket.on("new_message", onMsg);
    socket.on("typing",      onTyp);
    socket.on("stop_typing", onStop);
    return () => {
      socket.off("new_message", onMsg);
      socket.off("typing",      onTyp);
      socket.off("stop_typing", onStop);
    };
  }, [socket, active]);

  useEffect(scroll, [msgs]);

  function scroll() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 40);
  }

  const selectConv = async (c) => {
    if (active?._id === c._id) return;
    if (active) leaveConversation(active._id);
    setActive(c);
    joinConversation(c._id);
    try {
      const { data } = await chatAPI.getMessages(c._id);
      setMsgs(data.data || []);
    } catch { setMsgs([]); }
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !active) return;
    const t = text;
    setText("");
    try {
      const { data } = await chatAPI.sendMessage(active._id, { content: t });
      const msg = data?.data || {
        _id: String(Date.now()),
        content: t,
        sender: { _id: user?._id || user?.id, name: user?.name },
        createdAt: new Date().toISOString(),
      };
      setMsgs(p => p.some(x => x._id === msg._id) ? p : [...p, msg]);
      socket?.emit("stop_typing", { conversationId: active._id });
    } catch {
      toast.error("Failed to send");
      setText(t);
    }
  };

  const onKey  = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const onType = () => {
    socket?.emit("typing", { conversationId: active._id });
    clearTimeout(ttRef.current);
    ttRef.current = setTimeout(() => socket?.emit("stop_typing", { conversationId: active._id }), 2000);
  };

  const other  = c => c.participants?.find(p => (p._id || p) !== (user?._id || user?.id));
  const isMine = m => { const sid = m.sender?._id || m.sender; return sid === (user?._id || user?.id); };

  const filtered  = convs.filter(c => !search || other(c)?.name?.toLowerCase().includes(search.toLowerCase()));
  const otherUser = active ? other(active) : null;
  const hasConvs  = convs.length > 0;

  /* ── Loading ── */
  if (ld) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"calc(100vh - 64px)" }}>
      <LoadingSpinner/>
    </div>
  );

  /* ── Full-page empty (no conversations) ── */
  if (!hasConvs) return (
    <div style={{ padding:"16px", height:"calc(100vh - 64px)", background:"#f0f4f8",
      fontFamily:"Inter,system-ui,sans-serif", boxSizing:"border-box",
      display:"flex", alignItems:"stretch" }}>
      <div style={{ flex:1, background:"white", borderRadius:16, border:"1.5px solid #e2e8f0",
        boxShadow:"0 2px 16px rgba(0,0,0,0.06)", overflow:"auto", display:"flex" }}>
        <NoConversations/>
      </div>
    </div>
  );

  /* ── Main chat layout ── */
  return (
    <div style={{ padding:"16px", height:"calc(100vh - 64px)", background:"#f0f4f8",
      fontFamily:"Inter,system-ui,sans-serif", boxSizing:"border-box" }}>
      <div style={{ display:"flex", height:"100%", background:"white", borderRadius:16,
        border:"1.5px solid #e2e8f0", boxShadow:"0 2px 16px rgba(0,0,0,0.06)", overflow:"hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ width:260, minWidth:260, borderRight:"1px solid #e2e8f0",
          display:"flex", flexDirection:"column", background:"#fafafa", flexShrink:0 }}
          className="chat-sidebar">

          {/* Sidebar header */}
          <div style={{ padding:"16px 14px 12px", borderBottom:"1px solid #e2e8f0", background:"white" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h2 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>Messages</h2>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99,
                background:"#eff6ff", color:"#2563eb" }}>
                {convs.length}
              </span>
            </div>
            {/* Search — only shown when there are conversations */}
            <div style={{ position:"relative" }}>
              <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                width:13, height:13, color:"#94a3b8", pointerEvents:"none" }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{ width:"100%", height:36, paddingLeft:32, paddingRight:10,
                  border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:12,
                  background:"#f8fafc", outline:"none", boxSizing:"border-box", color:"#374151",
                  transition:"border-color 0.15s" }}
                onFocus={e=>e.target.style.borderColor="#2563eb"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>
          </div>

          {/* Conversation list */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {filtered.length === 0 && search ? (
              <div style={{ padding:"32px 16px", textAlign:"center" }}>
                <Search style={{ width:20, height:20, color:"#cbd5e1", margin:"0 auto 8px" }}/>
                <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>No results for "{search}"</p>
              </div>
            ) : filtered.map(c => {
              const o   = other(c);
              const isA = active?._id === c._id;
              const myId   = user?._id || user?.id;
              const unread = c.unreadCount?.get?.(myId) || c.unreadCount?.[myId] || 0;
              return (
                <button key={c._id} onClick={() => selectConv(c)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                    padding:"11px 14px", border:"none",
                    borderLeft:`3px solid ${isA ? "#2563eb" : "transparent"}`,
                    background: isA ? "white" : "transparent",
                    cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}
                  onMouseEnter={e=>{ if(!isA) e.currentTarget.style.background="#f1f5f9"; }}
                  onMouseLeave={e=>{ if(!isA) e.currentTarget.style.background="transparent"; }}>
                  <Avatar name={o?.name} size={36} online={false}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <p style={{ fontSize:13, fontWeight: unread>0||isA ? 700:600,
                        color: isA ? "#2563eb" : "#0f172a",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0 }}>
                        {o?.name || "Unknown"}
                      </p>
                      <span style={{ fontSize:10, color:"#94a3b8", flexShrink:0, marginLeft:4 }}>
                        {fmt(c.lastMessageAt || c.updatedAt)}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                      <p style={{ fontSize:11, color: unread>0&&!isA?"#374151":"#94a3b8",
                        fontWeight: unread>0&&!isA?600:400,
                        margin:"2px 0 0", flex:1,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {c.lastMessage || "Start a conversation"}
                      </p>
                      {unread > 0 && !isA && (
                        <span style={{ fontSize:9, fontWeight:800, minWidth:16, height:16,
                          borderRadius:99, background:"#2563eb", color:"#fff",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          padding:"0 4px", flexShrink:0 }}>
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat pane ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {otherUser ? (
            <>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 20px", borderBottom:"1px solid #e2e8f0", flexShrink:0, background:"white" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <Avatar name={otherUser.name} size={38} online={true}/>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>{otherUser.name}</p>
                    <p style={{ fontSize:11, color:"#16a34a", fontWeight:600, margin:"2px 0 0",
                      display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>
                      Active now
                    </p>
                  </div>
                </div>
                <button style={{ background:"none", border:"none", cursor:"pointer", padding:6,
                  borderRadius:8, transition:"background 0.12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <MoreVertical style={{ width:16, height:16, color:"#94a3b8" }}/>
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"20px 24px",
                display:"flex", flexDirection:"column", gap:12, background:"#f8fafc" }}>
                {msgs.length === 0 && (
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:60 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ width:48, height:48, borderRadius:"50%", background:"#e2e8f0",
                        display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                        <MessageCircle style={{ width:22, height:22, color:"#94a3b8" }}/>
                      </div>
                      <p style={{ fontSize:13, color:"#64748b", margin:0, lineHeight:1.6 }}>
                        No messages yet.<br/>
                        <span style={{ color:"#94a3b8" }}>Say hello to {otherUser.name}! 👋</span>
                      </p>
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {msgs.map((m, i) => {
                    const mine    = isMine(m);
                    const prevMsg = msgs[i - 1];
                    const showDate = !prevMsg ||
                      new Date(m.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                    return (
                      <div key={m._id||i}>
                        {showDate && (
                          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"8px 0" }}>
                            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
                            <span style={{ fontSize:10, fontWeight:700, color:"#94a3b8",
                              background:"#f8fafc", padding:"2px 10px", borderRadius:99, whiteSpace:"nowrap" }}>
                              {dateLabel(m.createdAt)}
                            </span>
                            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
                          </div>
                        )}
                        <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                          style={{ display:"flex", gap:8, flexDirection:mine?"row-reverse":"row", alignItems:"flex-end" }}>
                          <Avatar name={mine ? user?.name : otherUser.name} size={28}/>
                          <div style={{ maxWidth:"65%", display:"flex", flexDirection:"column", gap:3,
                            alignItems:mine?"flex-end":"flex-start" }}>
                            <div style={{ padding:"9px 14px",
                              borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              background: mine ? "#2563eb" : "white",
                              color: mine ? "white" : "#0f172a",
                              border: mine ? "none" : "1px solid #e2e8f0",
                              fontSize:13, lineHeight:1.55, wordBreak:"break-word",
                              boxShadow: mine ? "0 2px 8px rgba(37,99,235,0.2)" : "0 1px 3px rgba(0,0,0,0.04)" }}>
                              {m.content}
                            </div>
                            <span style={{ fontSize:10, color:"#94a3b8" }}>{fmtMsg(m.createdAt)}</span>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>
                {typing && (
                  <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                    <Avatar name={otherUser.name} size={28}/>
                    <div style={{ background:"white", border:"1px solid #e2e8f0",
                      borderRadius:"16px 16px 16px 4px", padding:"10px 14px",
                      display:"flex", gap:4, alignItems:"center" }}>
                      {[0,1,2].map(i=>(
                        <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8",
                          animation:`typingBounce 1.2s ${i*0.2}s infinite` }}/>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef}/>
              </div>

              {/* Input */}
              <form onSubmit={send} style={{ display:"flex", alignItems:"center", gap:10,
                padding:"12px 16px", borderTop:"1px solid #e2e8f0", background:"white", flexShrink:0 }}>
                <input ref={inputRef} value={text}
                  onChange={e=>{ setText(e.target.value); onType(); }}
                  onKeyDown={onKey}
                  placeholder={`Message ${otherUser.name}…`}
                  style={{ flex:1, height:44, padding:"0 16px",
                    border:"1.5px solid #e2e8f0", borderRadius:10,
                    fontSize:13, background:"#f8fafc", outline:"none",
                    color:"#0f172a", fontFamily:"inherit", transition:"all 0.15s" }}
                  onFocus={e=>{ e.target.style.borderColor="#2563eb"; e.target.style.background="white"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onBlur={e=>{ e.target.style.borderColor="#e2e8f0"; e.target.style.background="#f8fafc"; e.target.style.boxShadow="none"; }}/>
                <button type="submit" disabled={!text.trim()}
                  style={{ width:42, height:42, borderRadius:10, border:"none",
                    background: text.trim() ? "#2563eb" : "#e2e8f0",
                    color: text.trim() ? "white" : "#94a3b8",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor: text.trim() ? "pointer" : "not-allowed",
                    flexShrink:0, transition:"all 0.15s",
                    boxShadow: text.trim() ? "0 2px 8px rgba(37,99,235,0.25)" : "none" }}>
                  <Send style={{ width:16, height:16 }}/>
                </button>
              </form>
            </>
          ) : (
            <SelectConversationPrompt/>
          )}
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%,60%,100% { transform:translateY(0); }
          30% { transform:translateY(-4px); }
        }
        @media(max-width:700px) {
          .chat-sidebar { width:72px !important; min-width:72px !important; }
          .chat-sidebar .conv-name, .chat-sidebar .conv-preview,
          .chat-sidebar h2, .chat-sidebar input { display:none !important; }
        }
        @media(max-width:480px) {
          .chat-sidebar { display:none !important; }
        }
      `}</style>
    </div>
  );
}
