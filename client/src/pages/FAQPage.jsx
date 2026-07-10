import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronRight, Search } from "lucide-react";

const FAQS = [
  {
    category: "Accommodation",
    icon: "🏠",
    color: "#7c3aed",
    bg: "#faf5ff",
    items: [
      {
        q: "How do I find a hostel or PG in Hyderabad?",
        a: "Use TrustBridge's Services section and filter by Hostels. All listed providers are verified. You can also ask in the Community Forum — local guides share real recommendations. Focus on areas like Bachupally, Miyapur, and Secunderabad which have many student-friendly PGs.",
      },
      {
        q: "What is the average rent for a PG in Hyderabad?",
        a: "Shared room: ₹4,000–7,000/month. Single room: ₹7,000–12,000/month. Near tech hubs (Hitech City, Gachibowli): ₹8,000–15,000. Most include basic utilities; always confirm what's covered before agreeing.",
      },
      {
        q: "Is it safe to book accommodation online?",
        a: "Always use verified platforms like TrustBridge. Look for providers with the Verified badge. Read reviews from other residents. Never pay full rent in advance without a signed agreement.",
      },
    ]
  },
  {
    category: "Healthcare",
    icon: "🏥",
    color: "#dc2626",
    bg: "#fef2f2",
    items: [
      {
        q: "Which hospitals are nearby in Hyderabad?",
        a: "Apollo Hospitals (Jubilee Hills), Yashoda Hospital (Secunderabad), KIMS Hospital (Kondapur), and Care Hospital (Banjara Hills) are major hospitals. For Bachupally area: the government hospital is at Bachupally Main Road. Visit our Emergency Contacts page for phone numbers.",
      },
      {
        q: "What should I do in a medical emergency?",
        a: "Call 108 for ambulance services (free in Telangana). You can also call 112 (all-in-one emergency number). Keep your blood group, any known allergies, and emergency contact saved on your phone's lock screen.",
      },
    ]
  },
  {
    category: "Transportation",
    icon: "🚗",
    color: "#d97706",
    bg: "#fffbeb",
    items: [
      {
        q: "How can I travel locally in Hyderabad?",
        a: "TSRTC city buses are the cheapest (₹5–30). Hyderabad Metro covers key areas. Ola and Uber are available 24/7. For short distances, auto-rickshaws are convenient — always agree on fare before boarding or ask for meter.",
      },
      {
        q: "Is there a way to get a monthly bus pass?",
        a: "Yes. TSRTC offers monthly passes at major bus depots and online. Show a valid ID and your regular route. It can save ₹400–600/month for daily commuters.",
      },
      {
        q: "How do I get from the airport to my destination?",
        a: "Hyderabad Airport (Shamshabad) is about 30–40 km from the city. Use Pushpak airport buses (cheapest, ₹200), Ola/Uber (₹700–1200), or pre-paid taxis from the arrival area. Avoid negotiating with random taxi drivers outside.",
      },
    ]
  },
  {
    category: "Grocery & Food",
    icon: "🛒",
    color: "#16a34a",
    bg: "#f0fdf4",
    items: [
      {
        q: "What are the best grocery stores near me?",
        a: "Ratnadeep, More, and DMart are affordable supermarkets. Rythu Bazaar (government farmer markets) are open on weekends and sell fresh vegetables at wholesale prices — 30–40% cheaper. Search on TrustBridge for verified grocery stores near your area.",
      },
      {
        q: "Where can I find affordable food near my hostel?",
        a: "College canteens, local dhabas, and nearby mess subscriptions offer ₹40–80 meals. Look for South Indian tiffin centers — Idli/Dosa meals are healthy and cheap. TrustBridge has a Restaurants category with reviewed options near Bachupally, Miyapur, and Secunderabad.",
      },
    ]
  },
  {
    category: "TrustBridge Platform",
    icon: "🛡️",
    color: "#2563eb",
    bg: "#eff6ff",
    items: [
      {
        q: "How do I contact verified local guides?",
        a: "Go to Local Guides from the main menu. Browse verified residents in your area and click Message to send a direct message. Local guides are real community members who have been active on the platform. They can answer questions, recommend services, and help you settle in.",
      },
      {
        q: "How does TrustBridge document verification work?",
        a: "Service providers upload their Aadhaar or PAN card. Our AI OCR system reads and verifies the document, then cross-references with the provider's registered name. Verified providers receive a Verified badge on their profile. This ensures all listed services are from real, identifiable people.",
      },
      {
        q: "Is TrustBridge free to use?",
        a: "Yes, TrustBridge is completely free for newcomers and community members. Service providers pay a small subscription to list their services. Residents can join and guide newcomers at no cost.",
      },
      {
        q: "How do I report a bad service or fake listing?",
        a: "On every service page, you can leave a review. Our AI system automatically flags suspicious reviews. You can also use the Contact page to report serious issues directly to our team.",
      },
    ]
  },
];

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:"1.5px solid #f1f5f9",borderRadius:12,background:"white",
      overflow:"hidden",transition:"border-color 0.15s",
      borderColor:open?"#bfdbfe":"#f1f5f9"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:12}}>
        <span style={{fontSize:14,fontWeight:600,color:"#0f172a",lineHeight:1.4}}>{item.q}</span>
        <ChevronDown size={16} color="#64748b"
          style={{flexShrink:0,transition:"transform 0.2s",transform:open?"rotate(180deg)":"none"}}/>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.2}}>
            <div style={{padding:"0 16px 16px",fontSize:13,color:"#475569",lineHeight:1.65,
              borderTop:"1px solid #f1f5f9"}}>
              <div style={{paddingTop:12}}>{item.a}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? FAQS.map(c=>({...c,items:c.items.filter(i=>i.q.toLowerCase().includes(search.toLowerCase())||i.a.toLowerCase().includes(search.toLowerCase()))})).filter(c=>c.items.length>0)
    : FAQS;

  return (
    <div style={{background:"#f0f4f8",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",padding:"28px 0"}}>
        <div className="wrap">
          <Link to="/community" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,
            color:"rgba(255,255,255,0.8)",fontWeight:600,textDecoration:"none",marginBottom:16}}>
            <ArrowLeft size={14}/> Back to Community
          </Link>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.15)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>❓</div>
            <div>
              <h1 style={{fontSize:26,fontWeight:800,color:"white",margin:"0 0 4px"}}>Frequently Asked Questions</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",margin:0}}>
                Common questions from newcomers settling in Hyderabad
              </p>
            </div>
          </div>
          {/* Search */}
          <div style={{position:"relative",maxWidth:480}}>
            <Search style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
              width:15,height:15,color:"#64748b"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search questions..."
              style={{width:"100%",height:46,paddingLeft:42,paddingRight:14,borderRadius:10,
                border:"none",fontSize:14,background:"white",outline:"none",boxSizing:"border-box",
                boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}/>
          </div>
        </div>
      </div>

      <div className="wrap" style={{paddingTop:24,paddingBottom:56}}>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 24px",background:"white",borderRadius:16,
            border:"1.5px solid #f1f5f9"}}>
            <div style={{fontSize:36,marginBottom:10}}>🔍</div>
            <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>No results found</p>
            <p style={{fontSize:13,color:"#64748b",margin:0}}>Try a different search term or ask in the Community Forum.</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:28}}>
            {filtered.map(cat=>(
              <motion.div key={cat.category} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <span style={{width:32,height:32,borderRadius:8,background:cat.bg,
                    display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                    {cat.icon}
                  </span>
                  <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0}}>{cat.category}</h2>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {cat.items.map((item,i)=><FAQItem key={i} item={item} index={i}/>)}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Still have questions */}
        <div style={{marginTop:28,background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:14,
          padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:"#1e40af",margin:"0 0 2px"}}>Still have questions?</p>
            <p style={{fontSize:12,color:"#3b82f6",margin:0}}>Ask the TrustBridge community — local residents will answer</p>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <Link to="/community"
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
                background:"#2563eb",color:"white",fontWeight:600,fontSize:13,textDecoration:"none"}}>
              Ask Community <ChevronRight size={13}/>
            </Link>
            <Link to="/contact"
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,
                background:"white",color:"#2563eb",border:"1.5px solid #bfdbfe",fontWeight:600,fontSize:13,textDecoration:"none"}}>
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
