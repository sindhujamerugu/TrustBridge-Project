import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, MapPin, Building2, ChevronLeft, ArrowRight, Check } from "lucide-react";
import logoImg from "../assets/logo.png";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/ui/GoogleSignInButton";
import { PasswordField, ConfirmPasswordField, isPasswordValid } from "../components/ui/PasswordField";

const ROLES = [
  {
    id:"newcomer", emoji:"🎓", label:"Newcomer",
    desc:"Find trusted locals, services, and guidance in your new city.",
    benefits:["Browse Services","Find Accommodation","Community Support"],
  },
  {
    id:"resident", emoji:"🤝", label:"Community Member",
    desc:"Help newcomers by sharing local knowledge, recommendations, and community support.",
    benefits:["Answer Questions","Share Recommendations","Support Newcomers"],
    highlight: true,
  },
  {
    id:"provider", emoji:"🏢", label:"Service Provider",
    desc:"Offer verified services to newcomers and residents.",
    benefits:["List Services","Manage Bookings","Grow Business"],
  },
];

const LOCS = ["Bachupally","Miyapur","Secunderabad"];
const CONNECTIONS = ["Local Resident","Student","Employee","Business Owner","Other"];
const DASH = { newcomer:"/dashboard/newcomer", resident:"/dashboard/resident", provider:"/dashboard/provider" };

export default function RegisterPage() {
  const [step, setStep]   = useState(1);
  const [role, setRole]   = useState("");
  const [form, setForm]   = useState({ name:"", email:"", password:"", confirm:"", phone:"", location:"", businessName:"", connection:"" });
  const [loading, setLd]  = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!isPasswordValid(form.password)) {
      toast.error("Please satisfy all password requirements.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLd(true);
    try {
      const u = await register({ ...form, role });
      toast.success("Account created! Welcome to TrustBridge.");
      nav(DASH[u.role] || "/");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally { setLd(false); }
  };

  const inputStyle = (focused) => ({
    width:"100%", height:52, paddingLeft:42, paddingRight:14,
    border:`1.5px solid ${focused?"#2563eb":"#e2e8f0"}`,
    boxShadow: focused?"0 0 0 3px rgba(37,99,235,0.1)":"none",
    borderRadius:11, fontSize:14, color:"#0f172a", background:"#fff",
    outline:"none", transition:"all 0.15s", boxSizing:"border-box",
  });

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",flexDirection:"column",fontFamily:"Inter,system-ui,sans-serif"}}>

      {/* header */}
      <header style={{height:60,background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",paddingInline:"clamp(1.25rem,4vw,3rem)",justifyContent:"space-between"}}>
        <Link to="/" style={{display:"flex",alignItems:"center",textDecoration:"none"}}>
          <img src={logoImg} alt="TrustBridge" style={{height:36,width:"auto",objectFit:"contain",display:"block"}}/>
        </Link>
        <Link to="/" style={{display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:600,color:"#64748b",textDecoration:"none"}}>
          <ChevronLeft style={{width:14,height:14}}/> Back to Home
        </Link>
      </header>

      <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 20px"}}>
        <div style={{width:"100%",maxWidth:960}}>

          {/* Step indicator */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:32}}>
            {["Choose role","Your details"].map((label,i) => {
              const done = step > i+1, active = step===i+1;
              return (
                <div key={label} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,
                    background:done?"#16a34a":active?"#2563eb":"#e2e8f0",color:(done||active)?"#fff":"#94a3b8"}}>
                    {done?<Check style={{width:14,height:14}}/>:i+1}
                  </div>
                  <span style={{fontSize:13,fontWeight:600,color:(done||active)?"#0f172a":"#94a3b8"}}>{label}</span>
                  {i===0 && <div style={{width:60,height:2,background:step>1?"#2563eb":"#e2e8f0"}}/>}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step===1 && (
              <motion.div key="s1" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                <div style={{background:"#fff",borderRadius:24,padding:"clamp(28px,4vw,48px)",boxShadow:"0 2px 24px rgba(0,0,0,0.07)"}}>
                  <div style={{textAlign:"center",marginBottom:36}}>
                    <h1 style={{fontSize:"clamp(1.5rem,3vw,2rem)",fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>Join TrustBridge</h1>
                    <p style={{fontSize:15,color:"#64748b",margin:0}}>Choose how you'd like to be part of our community</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}} className="role-grid">
                    {ROLES.map(r => {
                      const sel = role===r.id;
                      return (
                        <button key={r.id} onClick={()=>setRole(r.id)}
                          style={{textAlign:"left",padding:"24px 22px",borderRadius:18,cursor:"pointer",transition:"all 0.18s",
                            background:sel?"#eff6ff":"#f8fafc",
                            border:`2px solid ${sel?"#2563eb":"#e2e8f0"}`,
                            boxShadow:sel?"0 4px 20px rgba(37,99,235,0.12)":"none"}}>
                          <div style={{fontSize:"2rem",marginBottom:14}}>{r.emoji}</div>
                          <h3 style={{fontSize:15,fontWeight:700,color:sel?"#1d4ed8":"#0f172a",margin:"0 0 6px"}}>{r.label}</h3>
                          <p style={{fontSize:12,color:"#64748b",marginBottom:14,lineHeight:1.55}}>{r.desc}</p>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {r.benefits.map(b=>(
                              <div key={b} style={{display:"flex",alignItems:"center",gap:8}}>
                                <Check style={{width:13,height:13,color:sel?"#2563eb":"#94a3b8",flexShrink:0}}/>
                                <span style={{fontSize:12,color:sel?"#1e40af":"#475569",fontWeight:500}}>{b}</span>
                              </div>
                            ))}
                          </div>
                          {sel && (
                            <div style={{marginTop:14,display:"flex",alignItems:"center",gap:6}}>
                              <div style={{width:18,height:18,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <Check style={{width:10,height:10,color:"#fff"}}/>
                              </div>
                              <span style={{fontSize:11,fontWeight:700,color:"#2563eb"}}>Selected</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button disabled={!role} onClick={()=>setStep(2)}
                    style={{width:"100%",height:54,marginTop:28,borderRadius:14,border:"none",fontSize:15,fontWeight:700,cursor:role?"pointer":"not-allowed",
                      background:role?"#2563eb":"#e2e8f0",color:role?"#fff":"#94a3b8",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      boxShadow:role?"0 4px 16px rgba(37,99,235,0.3)":"none"}}>
                    Continue <ArrowRight style={{width:16,height:16}}/>
                  </button>
                  <p style={{textAlign:"center",fontSize:13,color:"#64748b",marginTop:20}}>
                    Already have an account? <Link to="/login" style={{color:"#2563eb",fontWeight:700,textDecoration:"none"}}>Sign In</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step===2 && (
              <motion.div key="s2" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.25}}>
                <div style={{background:"#fff",borderRadius:24,padding:"clamp(28px,4vw,40px)",boxShadow:"0 2px 24px rgba(0,0,0,0.07)",maxWidth:540,margin:"0 auto"}}>
                  <button onClick={()=>setStep(1)} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:600,color:"#64748b",background:"none",border:"none",cursor:"pointer",marginBottom:24,padding:0}}>
                    <ChevronLeft style={{width:15,height:15}}/> Back
                  </button>
                  <h1 style={{fontSize:"1.5rem",fontWeight:800,color:"#0f172a",margin:"0 0 4px"}}>Create your account</h1>
                  <p style={{fontSize:14,color:"#64748b",margin:"0 0 28px"}}>
                    Joining as a <strong style={{color:"#2563eb"}}>{ROLES.find(r=>r.id===role)?.label}</strong>
                  </p>
                  <form onSubmit={submit} autoComplete="off" style={{display:"flex",flexDirection:"column",gap:16}}>
                    {/* Full Name + Email row */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}} className="form-grid">
                      {[
                        {key:"name",  label:"Full Name",     Icon:User,  type:"text",     ph:"Your full name",       req:true},
                        {key:"email", label:"Email Address",  Icon:Mail,  type:"email",    ph:"you@example.com",      req:true},
                      ].map(({key,label,Icon,type,ph,req})=>(
                        <FieldBox key={key} label={label} Icon={Icon} type={type} value={form[key]} onChange={v=>upd(key,v)} placeholder={ph} required={req}/>
                      ))}
                    </div>
                    <PasswordField value={form.password} onChange={v=>upd("password",v)}/>
                    <ConfirmPasswordField value={form.confirm} password={form.password} onChange={v=>upd("confirm",v)}/>
                    {/* Location dropdown */}
                    <div>
                      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Location</label>
                      <div style={{position:"relative"}}>
                        <MapPin style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
                        <select value={form.location} onChange={e=>upd("location",e.target.value)} required
                          style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:14,color:form.location?"#0f172a":"#94a3b8",background:"#fff",outline:"none",cursor:"pointer",appearance:"none",boxSizing:"border-box"}}>
                          <option value="">Select your area</option>
                          {LOCS.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Connection to area (for resident) */}
                    {role==="resident" && (
                      <div>
                        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>
                          Connection to Area <span style={{color:"#94a3b8",fontWeight:400,fontSize:12}}>— helps newcomers understand your background</span>
                        </label>
                        <div style={{position:"relative"}}>
                          <User style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8"}}/>
                          <select value={form.connection} onChange={e=>upd("connection",e.target.value)}
                            style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:14,color:form.connection?"#0f172a":"#94a3b8",background:"#fff",outline:"none",cursor:"pointer",appearance:"none",boxSizing:"border-box"}}>
                            <option value="">Select your connection</option>
                            {CONNECTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    {role==="provider" && (
                      <>
                        <FieldBox label="Business Name" Icon={Building2} value={form.businessName} onChange={v=>upd("businessName",v)} placeholder="Your business name" required/>
                        <PhoneBox value={form.phone} onChange={v=>upd("phone",v)}/>
                      </>
                    )}
                    {(() => {
                      const pwdOk = isPasswordValid(form.password) && form.password === form.confirm && form.confirm.length > 0;
                      const btnDisabled = loading || !pwdOk;
                      return (
                        <button type="submit" disabled={btnDisabled}
                          style={{width:"100%",height:54,marginTop:8,borderRadius:12,border:"none",fontSize:15,fontWeight:700,
                            cursor:btnDisabled?"not-allowed":"pointer",
                            background:btnDisabled?"#e2e8f0":"#2563eb",
                            color:btnDisabled?"#94a3b8":"#fff",
                            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                            boxShadow:btnDisabled?"none":"0 4px 16px rgba(37,99,235,0.3)",
                            transition:"all 0.2s"}}>
                          {loading?"Creating account…":<>Create Account <ArrowRight style={{width:16,height:16}}/></>}
                        </button>
                      );
                    })()}
                  </form>
                  {/* Google sign-in divider */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0 14px" }}>
                    <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                    <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500, whiteSpace:"nowrap" }}>or sign up with</span>
                    <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                  </div>
                  <GoogleSignInButton role={role || "newcomer"} label="Continue with Google" />
                  <p style={{textAlign:"center",fontSize:13,color:"#64748b",marginTop:16}}>
                    Already have an account? <Link to="/login" style={{color:"#2563eb",fontWeight:700,textDecoration:"none"}}>Sign In</Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media(max-width:767px){.role-grid{grid-template-columns:1fr !important;}.form-grid{grid-template-columns:1fr !important;}}
        @media(min-width:768px) and (max-width:1023px){.role-grid{grid-template-columns:1fr 1fr !important;}}
      `}</style>
    </div>
  );
}

function PhoneBox({ value, onChange }) {
  const [focused, setFocused] = useState(false);

  // Strip any leading +91 or 91 the user might type, keep only digits
  const handleChange = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    onChange(digits ? `+91${digits}` : "");
  };

  // Display value: strip the +91 prefix for the input box
  const display = value.replace(/^\+91/, "");

  return (
    <div>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>
        Phone Number <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span>
      </label>
      <div style={{
        display:"flex", alignItems:"center",
        border:`1.5px solid ${focused?"#2563eb":"#e2e8f0"}`,
        boxShadow: focused?"0 0 0 3px rgba(37,99,235,0.1)":"none",
        borderRadius:11, overflow:"hidden", background:"#fff",
        transition:"all 0.15s",
      }}>
        {/* Country code prefix */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"0 12px", height:52, borderRight:"1.5px solid #e2e8f0",
          background:"#f8fafc", flexShrink:0,
        }}>
          <span style={{fontSize:16}}>🇮🇳</span>
          <span style={{fontSize:14,fontWeight:700,color:"#374151"}}>+91</span>
        </div>
        <input
          type="tel"
          value={display}
          onChange={e=>handleChange(e.target.value)}
          placeholder="Mobile number"
          maxLength={10}
          autoComplete="tel"
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          style={{
            flex:1, height:52, padding:"0 14px",
            border:"none", outline:"none", fontSize:14,
            color:"#0f172a", background:"transparent",
            fontFamily:"inherit",
          }}
        />
      </div>
    </div>
  );
}

function FieldBox({label,Icon,type="text",value,onChange,placeholder,required}) {
  const [focused,setFocused] = useState(false);
  return (
    <div>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>{label}</label>
      <div style={{position:"relative"}}>
        <Icon style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"#94a3b8",pointerEvents:"none"}}/>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required} placeholder={placeholder}
          autoComplete="new-password"
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{width:"100%",height:52,paddingLeft:42,paddingRight:14,border:`1.5px solid ${focused?"#2563eb":"#e2e8f0"}`,
            boxShadow:focused?"0 0 0 3px rgba(37,99,235,0.1)":"none",
            borderRadius:11,fontSize:14,color:"#0f172a",background:"#fff",outline:"none",
            transition:"all 0.15s",boxSizing:"border-box"}}/>
      </div>
    </div>
  );
}
