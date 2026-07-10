import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    icon:"🎓", title:"College Admissions",
    color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe",
    tips:[
      "Carry original documents + 5 attested photocopies to every admission visit.",
      "Open a bank account (SBI/Canara) near campus — required for scholarship disbursement.",
      "Register on your state government's scholarship portal (TS ePass / AP Scholarship).",
      "Get your Aadhaar linked to your student ID within the first week.",
      "Keep a digital copy of all certificates on Google Drive/email.",
    ]
  },
  {
    icon:"🏠", title:"Finding Accommodation",
    color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe",
    tips:[
      "Prefer hostels within 2–3 km of your college to save on transport.",
      "Verified PGs on TrustBridge show real reviews from other students.",
      "Always get a written rental agreement — even for short stays.",
      "Check if electricity and water are included in the rent.",
      "Ask about Wi-Fi speed — crucial for online classes and assignments.",
    ]
  },
  {
    icon:"💰", title:"Budget Living",
    color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0",
    tips:[
      "Monthly budget breakdown: Rent 40%, Food 25%, Transport 15%, Misc 20%.",
      "Eat at college canteens and local dhabas — ₹40–80 per meal.",
      "Buy second-hand textbooks from seniors or Facebook college groups.",
      "Use UPI (PhonePe / Google Pay) — faster and avoids ATM queues.",
      "Avoid spending on delivery apps daily — cook simple meals on weekends.",
    ]
  },
  {
    icon:"🚌", title:"Getting Around Hyderabad",
    color:"#d97706", bg:"#fffbeb", border:"#fde68a",
    tips:[
      "TSRTC city buses — cheapest option, ₹5–30 per trip.",
      "Metro Rail covers Ameerpet, Hitech City, Secunderabad, LB Nagar corridors.",
      "Auto-rickshaws: always ask for meter fare or agree on price before boarding.",
      "Use Ola/Uber for night travel — safer and fare-transparent.",
      "Get a monthly TSRTC pass if your college is on a bus route — saves ₹500+/month.",
    ]
  },
  {
    icon:"🍱", title:"Food Tips",
    color:"#dc2626", bg:"#fef2f2", border:"#fecaca",
    tips:[
      "Ulavacharu biryani, Pesarattu, and Mirchi bajji are local must-tries.",
      "Ratnadeep, More, and DMart for affordable grocery shopping.",
      "Weekly veg markets (Rythu Bazaars) are 30–40% cheaper than supermarkets.",
      "Mess subscriptions near colleges offer 2 meals/day for ₹1500–2000/month.",
      "Carry a water bottle — safe drinking water is available in most colleges.",
    ]
  },
  {
    icon:"🛡️", title:"Safety Tips",
    color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc",
    tips:[
      "Share your live location with a friend when travelling to new areas.",
      "Save 112 (emergency), 1091 (women helpline), and a local guide's number.",
      "Avoid displaying expensive gadgets in crowded buses or markets.",
      "Trust only verified providers on TrustBridge for services.",
      "Report suspicious activity to local police or Cyberabad Control Room (040-2785 2222).",
    ]
  },
  {
    icon:"📱", title:"Must-Have Apps",
    color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe",
    tips:[
      "TrustBridge — Find verified local guides, hostels, and services.",
      "Google Maps — Offline maps work even without data.",
      "TSRTC Bus — Real-time bus tracking in Hyderabad.",
      "DigiLocker — Store Aadhaar, marksheets, and certificates digitally.",
      "NPCI BHIM / PhonePe — UPI payments everywhere.",
    ]
  },
];

export default function StudentTipsPage() {
  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#7c3aed 100%)",padding:"28px 0"}}>
        <div className="wrap">
          <Link to="/community" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,
            color:"rgba(255,255,255,0.8)",fontWeight:600,textDecoration:"none",marginBottom:16}}>
            <ArrowLeft size={14}/> Back to Community
          </Link>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.15)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🎓</div>
            <div>
              <h1 style={{fontSize:26,fontWeight:800,color:"white",margin:"0 0 4px"}}>Student Tips for Newcomers</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",margin:0}}>
                Practical advice to help you settle into student life in Hyderabad
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{paddingTop:24,paddingBottom:56}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {SECTIONS.map((s,i)=>(
            <motion.div key={s.title} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
              <div style={{background:"white",border:`1.5px solid ${s.border}`,borderRadius:16,padding:"20px 22px",
                boxShadow:"0 1px 4px rgba(0,0,0,0.04)",height:"100%"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <span style={{width:40,height:40,borderRadius:10,background:s.bg,
                    display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                    {s.icon}
                  </span>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0}}>{s.title}</h3>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {s.tips.map(t=>(
                    <div key={t} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                      <CheckCircle size={13} color={s.color} style={{flexShrink:0,marginTop:2}}/>
                      <span style={{fontSize:13,color:"#475569",lineHeight:1.55}}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div style={{marginTop:28,background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:14,
          padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:"#1e40af",margin:"0 0 2px"}}>Connect with a Local Guide</p>
            <p style={{fontSize:12,color:"#3b82f6",margin:0}}>Get personalised help from verified residents who know Hyderabad</p>
          </div>
          <Link to="/residents"
            style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:10,
              background:"#2563eb",color:"white",fontWeight:700,fontSize:13,textDecoration:"none"}}>
            Find a Guide <ChevronRight size={14}/>
          </Link>
        </div>
      </div>
    </div>
  );
}
