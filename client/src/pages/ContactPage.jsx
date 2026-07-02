import { useState } from "react";
import { Mail, Clock, MapPin, Send, AlertTriangle, Shield, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";

const SUPPORT_EMAIL = "trustbridge.platform@gmail.com";

const SUPPORT_CATEGORIES = [
  "Account Issues",
  "Booking Issues",
  "Provider Verification",
  "Service Management",
  "Review & Rating Concerns",
  "Fake Review Reporting",
  "Community Forum Issues",
  "General Support",
];

const REPORT_OPTIONS = [
  { icon:"🚨", label:"Report Fake Review",          subject:"Fake Review Report" },
  { icon:"⚠️", label:"Report Inappropriate Content", subject:"Inappropriate Content Report" },
  { icon:"🚫", label:"Report Fraudulent Provider",   subject:"Fraudulent Provider Report" },
  { icon:"🔑", label:"Account Recovery",              subject:"Account Recovery Request" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name:"", email:"", category:"General Support", subject:"", message:"" });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/contact', form);
      toast.success(data.message || "Message sent! We'll respond within 24–48 business hours.");
      setForm({ name:"", email:"", category:"General Support", subject:"", message:"" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const fld = {
    width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:9,
    fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  };
  const lbl = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 };

  return (
    <div style={{ background:"#f8fafc", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"32px 0" }}>
        <div className="wrap">
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0f172a", margin:"0 0 6px" }}>Contact Us</h1>
          <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
            Reach our support team at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color:"#2563eb", fontWeight:700, textDecoration:"none" }}>
              {SUPPORT_EMAIL}
            </a>
            {" "}· Monday – Saturday · 9:00 AM – 6:00 PM IST
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:36, paddingBottom:64 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:28, alignItems:"start" }} className="contact-grid">

          {/* Form */}
          <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:18, padding:"32px",
            boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:"0 0 6px" }}>Send Us a Message</h2>
            <p style={{ fontSize:13, color:"#64748b", margin:"0 0 24px" }}>
              We respond to all enquiries within 24–48 business hours.
            </p>
            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }} autoComplete="off">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="form-2col">
                <div>
                  <label style={lbl}>Full Name</label>
                  <input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                    placeholder="Your full name" style={fld}
                    onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                <div>
                  <label style={lbl}>Email Address</label>
                  <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                    placeholder="you@example.com" style={fld}
                    onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Support Category</label>
                <select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                  style={{...fld, background:"white", cursor:"pointer"}}>
                  {SUPPORT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Subject</label>
                <input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}
                  placeholder="Briefly describe your issue" style={fld}
                  onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
              <div>
                <label style={lbl}>Message</label>
                <textarea required rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                  placeholder="Provide as much detail as possible so we can help you faster…"
                  style={{...fld, resize:"vertical"}}
                  onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
              <button type="submit" disabled={sending}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px",
                  borderRadius:10, background:sending?"#93c5fd":"#2563eb", color:"white", border:"none",
                  fontSize:14, fontWeight:700, cursor:sending?"not-allowed":"pointer",
                  boxShadow:"0 4px 12px rgba(37,99,235,0.25)" }}>
                <Send style={{ width:15, height:15 }}/> {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>

          {/* Info sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Contact cards */}
            {[
              { icon:Mail,    title:"Email Support",   value:SUPPORT_EMAIL,              sub:"Response within 24–48 business hours", href:`mailto:${SUPPORT_EMAIL}` },
              { icon:Clock,   title:"Support Hours",   value:"9:00 AM – 6:00 PM IST",    sub:"Monday to Saturday" },
              { icon:MapPin,  title:"Business Location", value:"Hyderabad, Telangana, India", sub:"Owned & Operated by Nasani Ragamala and M. Sindhuja" },
              { icon:Shield,  title:"Verified Platform",value:"AI-powered trust system", sub:"Aadhaar verification · Fake review detection · Secure payments" },
            ].map(c => (
              <motion.div key={c.title} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"16px 18px",
                  display:"flex", alignItems:"flex-start", gap:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"#eff6ff",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <c.icon style={{ width:18, height:18, color:"#2563eb" }}/>
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>{c.title}</p>
                  {c.href
                    ? <a href={c.href} style={{ fontSize:13, fontWeight:700, color:"#2563eb", textDecoration:"none", wordBreak:"break-all" }}>{c.value}</a>
                    : <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", margin:"0 0 2px" }}>{c.value}</p>
                  }
                  <p style={{ fontSize:11, color:"#64748b", margin:0, lineHeight:1.5 }}>{c.sub}</p>
                </div>
              </motion.div>
            ))}

            {/* Report options */}
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:14, padding:"18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                <AlertTriangle style={{ width:16, height:16, color:"#dc2626" }}/>
                <h4 style={{ fontSize:13, fontWeight:800, color:"#b91c1c", margin:0 }}>Report an Issue</h4>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {REPORT_OPTIONS.map(r => (
                  <a key={r.label}
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(r.subject)}`}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:9,
                      background:"white", border:"1px solid #fecaca", textDecoration:"none",
                      fontSize:12, fontWeight:600, color:"#dc2626", transition:"background 0.12s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#fff0f0"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <span style={{ fontSize:16 }}>{r.icon}</span> {r.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.contact-grid{grid-template-columns:1fr !important;}}
        @media(max-width:600px){.form-2col{grid-template-columns:1fr !important;}}
      `}</style>
    </div>
  );
}
