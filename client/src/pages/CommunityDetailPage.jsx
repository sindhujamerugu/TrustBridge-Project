import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Eye, MessageCircle, ThumbsUp, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { communityAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";

const AV = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777"];
const av = n => AV[(n?.charCodeAt(0)||0) % AV.length];

function timeAgo(d){
  if(!d) return "";
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60) return "just now";
  if(s<3600) return Math.floor(s/60)+"m ago";
  if(s<86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

function Av({name,size=36}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:av(name||"?"),display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:Math.round(size*.38),flexShrink:0}}>{(name||"?").charAt(0)}</div>;
}

function DotsMenu({items}){
  const [open,setOpen]=useState(false);
  const r=useRef(null);
  useEffect(()=>{
    const fn=e=>{if(r.current&&!r.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);
  return(
    <div ref={r} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:30,height:30,borderRadius:8,border:"1.5px solid #e2e8f0",background:open?"#f1f5f9":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <MoreVertical style={{width:15,height:15,color:"#64748b"}}/>
      </button>
      {open&&(
        <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:200,background:"white",borderRadius:10,border:"1.5px solid #e2e8f0",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:160,overflow:"hidden"}}>
          {items.map((it,i)=>(
            <button key={i} onClick={()=>{it.action();setOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:it.danger?"#dc2626":"#374151",textAlign:"left",transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=it.danger?"#fef2f2":"#f8fafc"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {it.icon} {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LikeBtn({liked,count,onLike,small}){
  return(
    <button onClick={onLike} style={{display:"flex",alignItems:"center",gap:small?4:6,padding:small?"4px 10px":"6px 14px",borderRadius:8,border:`1.5px solid ${liked?"#2563eb":"#e2e8f0"}`,background:liked?"#eff6ff":"white",cursor:"pointer",fontSize:small?11:12,fontWeight:600,color:liked?"#2563eb":"#64748b",transition:"all .15s"}}
      onMouseDown={e=>e.currentTarget.style.transform="scale(.93)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <ThumbsUp style={{width:small?11:13,height:small?11:13,fill:liked?"#2563eb":"none"}}/> {count}
    </button>
  );
}

function Confirm({msg,onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
      <motion.div initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} style={{background:"white",borderRadius:16,padding:"24px",maxWidth:360,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 8px"}}>Confirm Delete</p>
        <p style={{fontSize:13,color:"#64748b",margin:"0 0 20px",lineHeight:1.6}}>{msg}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"white",fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:"#dc2626",fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}}>Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CommunityDetailPage(){
  const {id}=useParams();
  const {user}=useAuth();
  const nav=useNavigate();
  const [post,setPost]=useState(null);
  const [ans,setAns]=useState("");
  const [loading,setLd]=useState(true);
  const [sub,setSub]=useState(false);
  const subRef=useRef(false);
  const [editingQ,setEditingQ]=useState(false);
  const [editQF,setEditQF]=useState({title:"",content:"",category:"",location:""});
  const [savingQ,setSavingQ]=useState(false);
  const [editingA,setEditingA]=useState(null);
  const [editAT,setEditAT]=useState("");
  const [savingA,setSavingA]=useState(false);
  const [delQ,setDelQ]=useState(false);
  const [delA,setDelA]=useState(null);

  const uid=user?String(user._id||user.id||""):"";
  const owns=a=>uid!==""&&String(a?._id||a||"")===uid;

  useEffect(()=>{
    communityAPI.getById(id).then(({data})=>setPost(data.data)).catch(()=>toast.error("Post not found")).finally(()=>setLd(false));
  },[id]);

  const submit=async e=>{
    e.preventDefault();
    if(!ans.trim()||!user){toast.error("Sign in to answer");return;}
    if(subRef.current) return;
    subRef.current=true; setSub(true);
    try{const{data}=await communityAPI.addAnswer(id,ans);setPost(data.data);setAns("");toast.success("Answer posted!");}
    catch(err){toast.error(err.response?.data?.message||"Failed");}
    finally{subRef.current=false; setSub(false);}
  };

  const likePost=async()=>{
    if(!user){toast.error("Sign in to like");return;}
    const was=!!(post.likes||[]).find(l=>String(l._id||l)===uid);
    setPost(p=>({...p,likes:was?(p.likes||[]).filter(l=>String(l._id||l)!==uid):[...(p.likes||[]),uid]}));
    try{await communityAPI.likePost(id);}catch{setPost(p=>({...p,likes:was?[...(p.likes||[]),uid]:(p.likes||[]).filter(l=>String(l._id||l)!==uid)}));}
  };

  const likeAns=async aid=>{
    if(!user){toast.error("Sign in to like");return;}
    const a=(post.answers||[]).find(x=>x._id===aid);if(!a)return;
    const was=!!(a.likes||[]).find(l=>String(l._id||l)===uid);
    setPost(p=>({...p,answers:p.answers.map(x=>x._id!==aid?x:{...x,likes:was?(x.likes||[]).filter(l=>String(l._id||l)!==uid):[...(x.likes||[]),uid]})}));
    try{await communityAPI.likeAnswer(id,aid);}catch{setPost(p=>({...p,answers:p.answers.map(x=>x._id!==aid?x:{...x,likes:was?[...(x.likes||[]),uid]:(x.likes||[]).filter(l=>String(l._id||l)!==uid)})}));}
  };

  const saveQ=async()=>{
    if(!editQF.title.trim()){toast.error("Title required");return;} setSavingQ(true);
    try{const{data}=await communityAPI.update(id,editQF);setPost(data.data);setEditingQ(false);toast.success("Updated!");}
    catch(err){toast.error(err.response?.data?.message||"Failed");}finally{setSavingQ(false);}
  };
  const delQFn=async()=>{
    try{await communityAPI.remove(id);toast.success("Deleted");nav("/community");}
    catch(err){toast.error(err.response?.data?.message||"Failed");}setDelQ(false);
  };
  const saveA=async aid=>{
    if(!editAT.trim()){toast.error("Cannot be empty");return;} setSavingA(true);
    try{const{data}=await communityAPI.editAnswer(id,aid,editAT);setPost(data.data);setEditingA(null);toast.success("Updated!");}
    catch(err){toast.error(err.response?.data?.message||"Failed");}finally{setSavingA(false);}
  };
  const delAFn=async()=>{
    if(!delA)return;
    try{await communityAPI.deleteAnswer(id,delA);setPost(p=>({...p,answers:p.answers.filter(a=>a._id!==delA)}));toast.success("Deleted");}
    catch(err){toast.error(err.response?.data?.message||"Failed");}setDelA(null);
  };

  if(loading)return <LoadingSpinner size="lg"/>;
  if(!post)return(<div style={{padding:"80px 24px",textAlign:"center"}}><Link to="/community" style={{color:"#2563eb",fontWeight:600,textDecoration:"none",fontSize:14,display:"inline-flex",alignItems:"center",gap:6}}><ArrowLeft style={{width:14,height:14}}/> Back</Link></div>);

  const aName=post.author?.name||"Anonymous";
  const answers=post.answers||[];
  const isMine=owns(post.author);
  const liked=!!(post.likes||[]).find(l=>String(l._id||l)===uid);

  return(
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div className="wrap" style={{paddingTop:24,paddingBottom:56,maxWidth:720}}>
        <Link to="/community" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"#64748b",textDecoration:"none",marginBottom:20}}>
          <ArrowLeft style={{width:14,height:14}}/> Back to Community
        </Link>

        {/* Question card */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"24px",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          {editingQ?(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <input value={editQF.title} onChange={e=>setEditQF(f=>({...f,title:e.target.value}))} placeholder="Title" style={{padding:"10px 14px",border:"1.5px solid #93c5fd",borderRadius:10,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <textarea rows={4} value={editQF.content} onChange={e=>setEditQF(f=>({...f,content:e.target.value}))} style={{padding:"10px 14px",border:"1.5px solid #93c5fd",borderRadius:10,fontSize:14,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setEditingQ(false)} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"white",fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer"}}>Cancel</button>
                <button onClick={saveQ} disabled={savingQ} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:savingQ?"#e2e8f0":"#2563eb",fontSize:13,fontWeight:700,color:savingQ?"#94a3b8":"white",cursor:savingQ?"not-allowed":"pointer"}}>{savingQ?"Saving...":"Save Changes"}</button>
              </div>
            </div>
          ):(
            <>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                <div style={{flex:1}}>
                  {post.category&&<span style={{display:"inline-block",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,background:"#eff6ff",color:"#2563eb",marginBottom:10,textTransform:"capitalize"}}>{post.category}</span>}
                  <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:"0 0 12px",lineHeight:1.4}}>{post.title}</h1>
                </div>
                {isMine&&<DotsMenu items={[
                  {label:"Edit Question",icon:<Pencil size={13}/>,action:()=>{setEditQF({title:post.title||"",content:post.content||"",category:post.category||"",location:post.location||""});setEditingQ(true);}},
                  {label:"Delete Question",icon:<Trash2 size={13}/>,action:()=>setDelQ(true),danger:true}
                ]}/>}
              </div>
              <p style={{fontSize:14,color:"#475569",lineHeight:1.7,margin:"0 0 20px"}}>{post.content}</p>
              <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:16,borderTop:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><Av name={aName} size={28}/><span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{aName}</span></div>
                <span style={{fontSize:12,color:"#94a3b8",display:"flex",alignItems:"center",gap:4}}><Eye style={{width:12,height:12}}/>{post.views||0}</span>
                <span style={{fontSize:12,color:"#94a3b8",display:"flex",alignItems:"center",gap:4}}><MessageCircle style={{width:12,height:12}}/>{answers.length}</span>
                <span style={{fontSize:12,color:"#94a3b8"}}>{timeAgo(post.createdAt)}</span>
                {post.editedAt&&<span style={{fontSize:11,color:"#cbd5e1"}}>edited</span>}
                <div style={{marginLeft:"auto"}}><LikeBtn liked={liked} count={(post.likes||[]).length} onLike={likePost}/></div>
              </div>
            </>
          )}
        </div>

        {/* Answers */}
        {answers.length>0&&(
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>{answers.length} Answer{answers.length!==1?"s":""}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <AnimatePresence>
                {answers.map((a,i)=>{
                  const n=a.author?.name||"Community Member";
                  const al=!!(a.likes||[]).find(l=>String(l._id||l)===uid);
                  const am=owns(a.author);
                  return(
                    <motion.div key={a._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-16}} transition={{delay:i*.04}}
                      style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Av name={n} size={32}/>
                          <div>
                            <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{n}</span>
                            <div style={{fontSize:11,color:"#94a3b8"}}>{timeAgo(a.createdAt)}{a.editedAt&&" edited"}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <LikeBtn liked={al} count={(a.likes||[]).length} onLike={()=>likeAns(a._id)} small/>
                          {am&&editingA!==a._id&&<DotsMenu items={[
                            {label:"Edit Answer",icon:<Pencil size={13}/>,action:()=>{setEditingA(a._id);setEditAT(a.content||"");}},
                            {label:"Delete Answer",icon:<Trash2 size={13}/>,action:()=>setDelA(a._id),danger:true}
                          ]}/>}
                        </div>
                      </div>
                      {editingA===a._id?(
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          <textarea rows={4} value={editAT} onChange={e=>setEditAT(e.target.value)} style={{width:"100%",padding:"10px 14px",border:"1.5px solid #93c5fd",borderRadius:10,fontSize:14,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                            <button onClick={()=>setEditingA(null)} style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"white",fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}><X style={{width:11,height:11,display:"inline",marginRight:4}}/>Cancel</button>
                            <button onClick={()=>saveA(a._id)} disabled={savingA} style={{padding:"8px 16px",borderRadius:9,border:"none",background:savingA?"#e2e8f0":"#2563eb",fontSize:12,fontWeight:700,color:savingA?"#94a3b8":"white",cursor:savingA?"not-allowed":"pointer"}}>{savingA?"Saving...":"Save"}</button>
                          </div>
                        </div>
                      ):(
                        <p style={{fontSize:14,color:"#374151",lineHeight:1.7,margin:0}}>{a.content||a.text||""}</p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Post Answer */}
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>Your Answer</h3>
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
            <textarea rows={5} value={ans} onChange={e=>setAns(e.target.value)} placeholder="Share your knowledge or experience..."
              style={{width:"100%",padding:"14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.65,transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button type="submit" disabled={sub||!ans.trim()} style={{display:"flex",alignItems:"center",gap:7,padding:"11px 22px",borderRadius:10,border:"none",fontSize:14,fontWeight:700,cursor:sub||!ans.trim()?"not-allowed":"pointer",background:sub||!ans.trim()?"#e2e8f0":"#2563eb",color:sub||!ans.trim()?"#94a3b8":"white",boxShadow:sub||!ans.trim()?"none":"0 4px 14px rgba(37,99,235,.3)"}}>
                <Send style={{width:15,height:15}}/> Post Answer
              </button>
            </div>
          </form>
        </div>
      </div>

      {delQ&&<Confirm msg="Delete this question? This cannot be undone." onConfirm={delQFn} onCancel={()=>setDelQ(false)}/>}
      {delA&&<Confirm msg="Delete this answer?" onConfirm={delAFn} onCancel={()=>setDelA(null)}/>}
    </div>
  );
}