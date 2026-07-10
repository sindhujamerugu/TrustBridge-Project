import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, AlertCircle, Shield, Heart, Building2 } from "lucide-react";

const EMERGENCY = [
  { icon:"🚔", label:"Police Emergency",     number:"100 / 112",  color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", desc:"For immediate police assistance" },
  { icon:"🚑", label:"Ambulance / Medical",   number:"108",        color:"#dc2626", bg:"#fef2f2", border:"#fecaca", desc:"Emergency medical services" },
  { icon:"🚒", label:"Fire Brigade",          number:"101",        color:"#d97706", bg:"#fffbeb", border:"#fde68a", desc:"Fire and rescue services" },
  { icon:"👩", label:"Women Helpline",        number:"1091",       color:"#db2777", bg:"#fdf2f8", border:"#fbcfe8", desc:"24×7 women safety helpline" },
  { icon:"💻", label:"Cyber Crime Helpline",  number:"1930",       color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe", desc:"Online fraud & cyber crimes" },
  { icon:"🏥", label:"Disaster Management",   number:"1077",       color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc", desc:"National disaster helpline" },
  { icon:"🛣️", label:"Road Accident / NHPC",  number:"1033",       color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", desc:"National highway patrol" },
  { icon:"👮", label:"Child Helpline",         number:"1098",       color:"#d97706", bg:"#fffbeb", border:"#fde68a", desc:"Child abuse and missing child" },
];

const HOSPITALS = [
  { name:"Apollo Hospitals Jubilee Hills",    area:"Jubilee Hills",   phone:"040-2360 7777" },
  { name:"Yashoda Hospital, Secunderabad",    area:"Secunderabad",    phone:"040-4567 4567" },
  { name:"KIMS Hospital, Kondapur",           area:"Kondapur",        phone:"040-4488 5000" },
  { name:"Care Hospital, Banjara Hills",      area:"Banjara Hills",   phone:"040-3041 8888" },
  { name:"Medicover Hospital, Hitec City",    area:"Hitec City",      phone:"040-6800 6800" },
  { name:"Bachupally Govt Hospital",          area:"Bachupally",      phone:"040-2304 0000" },
];

const POLICE = [
  { name:"Bachupally Police Station",  area:"Bachupally",    phone:"040-2786 4343" },
  { name:"Miyapur Police Station",     area:"Miyapur",       phone:"040-2304 5601" },
  { name:"Secunderabad Police Station",area:"Secunderabad",  phone:"040-2780 6611" },
  { name:"Cyberabad Control Room",     area:"Cyberabad",     phone:"040-2785 2222" },
];

function Card({ children, style={} }) {
  return (
    <div style={{background:"white",border:"1.5px solid #f1f5f9",borderRadius:16,padding:"20px 22px",
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...style}}>
      {children}
    </div>
  );
}

export default function EmergencyContactsPage() {
  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)",padding:"28px 0"}}>
        <div className="wrap">
          <Link to="/community" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,
            color:"rgba(255,255,255,0.8)",fontWeight:600,textDecoration:"none",marginBottom:16}}>
            <ArrowLeft size={14}/> Back to Community
          </Link>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.15)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🆘</div>
            <div>
              <h1 style={{fontSize:26,fontWeight:800,color:"white",margin:"0 0 4px"}}>Emergency Contacts</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",margin:0}}>
                Important numbers for newcomers in Hyderabad · Save these to your phone
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{paddingTop:24,paddingBottom:56}}>

        {/* National emergency numbers */}
        <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:"0 0 14px"}}>📞 National Emergency Numbers</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:32}}>
          {EMERGENCY.map((e,i)=>(
            <motion.div key={e.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
              <div style={{background:"white",border:`1.5px solid ${e.border}`,borderRadius:14,padding:"16px 18px",
                boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:22}}>{e.icon}</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:0}}>{e.label}</p>
                    <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>{e.desc}</p>
                  </div>
                </div>
                <a href={`tel:${e.number.split(" / ")[0]}`}
                  style={{display:"inline-flex",alignItems:"center",gap:6,background:e.bg,
                    color:e.color,padding:"6px 14px",borderRadius:999,fontSize:15,fontWeight:800,
                    textDecoration:"none",border:`1px solid ${e.border}`}}>
                  <Phone size={13}/>{e.number}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="ec-grid">
          {/* Nearby Hospitals */}
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <Heart size={16} color="#dc2626"/>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:0}}>Nearby Hospitals</h3>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {HOSPITALS.map(h=>(
                <div key={h.name} style={{padding:"10px 12px",background:"#fef2f2",borderRadius:10,border:"1px solid #fecaca"}}>
                  <p style={{fontSize:13,fontWeight:600,color:"#0f172a",margin:"0 0 2px"}}>{h.name}</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>📍 {h.area}</span>
                    <a href={`tel:${h.phone}`}
                      style={{fontSize:12,fontWeight:700,color:"#dc2626",textDecoration:"none",
                        display:"flex",alignItems:"center",gap:4}}>
                      <Phone size={11}/>{h.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Police Stations */}
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <Shield size={16} color="#2563eb"/>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:0}}>Nearby Police Stations</h3>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {POLICE.map(p=>(
                <div key={p.name} style={{padding:"10px 12px",background:"#eff6ff",borderRadius:10,border:"1px solid #bfdbfe"}}>
                  <p style={{fontSize:13,fontWeight:600,color:"#0f172a",margin:"0 0 2px"}}>{p.name}</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                    <span style={{fontSize:11,color:"#64748b"}}>📍 {p.area}</span>
                    <a href={`tel:${p.phone}`}
                      style={{fontSize:12,fontWeight:700,color:"#2563eb",textDecoration:"none",
                        display:"flex",alignItems:"center",gap:4}}>
                      <Phone size={11}/>{p.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Safety tip */}
        <div style={{marginTop:24,background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,
          padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <AlertCircle size={18} color="#b45309" style={{flexShrink:0,marginTop:1}}/>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:"#b45309",margin:"0 0 4px"}}>Stay Safe in Hyderabad</p>
            <p style={{fontSize:12,color:"#92400e",margin:0,lineHeight:1.6}}>
              Save these numbers on your phone before you need them. In any emergency, first call <strong>112</strong> (All-in-one national emergency). 
              Share your live location with a trusted contact when travelling alone. TrustBridge local guides can also help — 
              <Link to="/residents" style={{color:"#b45309",fontWeight:600}}> find a guide near you</Link>.
            </p>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){.ec-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}
