import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, Mail, Clock, Shield, AlertTriangle, BookOpen } from "lucide-react";

const SUPPORT_EMAIL = "trustbridge.platform@gmail.com";

const CATEGORIES = [
  {
    icon: "👤", title: "Account & Registration",
    faqs: [
      {
        q: "How do I create a TrustBridge account?",
        a: "Click 'Get Started' on the homepage and select your role: Newcomer, Community Member, or Service Provider. Fill in your name, email, and password, then choose your area. Your account is created instantly.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the login page, click 'Forgot Password?' and enter your registered email. You'll receive a password reset link within a few minutes. Check your spam folder if you don't see it. For further help, email trustbridge.platform@gmail.com.",
      },
      {
        q: "Can I change my role after registration?",
        a: "Yes. If you registered as a Newcomer or Community Member and want to become a Service Provider, contact us at trustbridge.platform@gmail.com with your account email. Role upgrades are processed within 1–2 business days.",
      },
      {
        q: "How do I update my profile information?",
        a: "Go to Profile from the navigation menu. You can update your name, profile photo, location, and bio at any time. Changes are saved immediately.",
      },
    ],
  },
  {
    icon: "🔍", title: "Booking Services",
    faqs: [
      {
        q: "How do I book a service on TrustBridge?",
        a: "Browse services on the Services page. Open the service detail page and click 'Book Now'. Select your preferred date and time, add any notes, and confirm. The provider will receive your booking request and confirm it shortly.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Currently, booking cancellations are handled directly with the provider via the Chat feature. Go to your Newcomer Dashboard → Bookings to view your active bookings and use the Chat option to coordinate with the provider.",
      },
      {
        q: "What if a provider doesn't show up or respond?",
        a: "If a provider fails to respond or honour a confirmed booking, report it immediately via the service page or email trustbridge.platform@gmail.com. Our team reviews all complaints within 24–48 business hours.",
      },
      {
        q: "Is payment done through TrustBridge?",
        a: "Payments for individual services are handled directly between you and the provider unless a provider has integrated payment options. TrustBridge subscription fees for providers are processed securely via Razorpay.",
      },
    ],
  },
  {
    icon: "🏢", title: "Becoming a Service Provider",
    faqs: [
      {
        q: "How do I register as a Service Provider?",
        a: "Select 'Service Provider' when registering. Once logged in, go to your Provider Dashboard and click 'Add Service'. You'll be guided through a 7-step process: Basic Info → Photos → Verification Documents → AI Verification → Subscription Plan → Payment → Publish.",
      },
      {
        q: "What documents are required for provider verification?",
        a: "You need at least one identity document — Aadhaar card or PAN card. For business-level verification, you can also submit GST certificate, business licence, or registration certificate. Documents are processed by our AI verification system within minutes.",
      },
      {
        q: "How much does a provider subscription cost?",
        a: "TrustBridge offers three plans: Basic (₹8/month), Growth (₹10/month), and Premium (₹15/month). Growth and Premium plans receive priority listing and featured badges. Plans are billed monthly.",
      },
      {
        q: "How long does verification take?",
        a: "AI document verification typically completes within 5–10 minutes. If your documents require manual review, it may take up to 24–48 business hours. You'll receive a notification once verification is complete.",
      },
    ],
  },
  {
    icon: "⭐", title: "Reviews & Fake Review Detection",
    faqs: [
      {
        q: "How does TrustBridge detect fake reviews?",
        a: "TrustBridge uses an AI-powered fake review detection system combining a trained ML model (built on Yelp review data) and rule-based checks. Every review is automatically analysed for spam patterns, promotional language, duplicate content, and exaggerated claims before being published.",
      },
      {
        q: "Why was my review rejected?",
        a: "Reviews can be rejected for several reasons: promotional or exaggerated language, excessive punctuation, repeated words, emoji spam, duplicate content, or if the review is clearly unrelated to the service being reviewed. The system will show you the reason on screen. Please rewrite your review with your genuine experience.",
      },
      {
        q: "Can I submit only one review per service?",
        a: "Yes. Each user can submit one verified review per service. This prevents review manipulation and ensures authentic feedback for every listing.",
      },
      {
        q: "How do I report a fake review?",
        a: "Email trustbridge.platform@gmail.com with the subject 'Fake Review Report' and include the service name, the review text, and your reason for reporting. Our moderation team reviews all reports within 24–48 business hours.",
      },
      {
        q: "What is a Verified Review badge?",
        a: "All publicly visible reviews on TrustBridge have passed our AI verification pipeline. A '✓ Verified Review' badge means the review has been analysed and confirmed as authentic before being published.",
      },
    ],
  },
  {
    icon: "🛡️", title: "Trust Score & Verification",
    faqs: [
      {
        q: "What is a Trust Score?",
        a: "A Trust Score (0–100) measures how reliable and trustworthy a Community Member (local guide) is. It is calculated based on their verification level, Aadhaar authentication, helpfulness votes received, questions answered, and recommendations shared.",
      },
      {
        q: "How do I increase my Trust Score?",
        a: "Complete your profile, verify your identity with Aadhaar, answer questions in the Community Forum, share service recommendations, and earn helpful votes from newcomers you assist. Each action contributes to your score.",
      },
      {
        q: "What does the Verified Badge mean?",
        a: "A green verified badge on a Community Member's profile means they have successfully completed Aadhaar-based identity verification. On a Service Provider's listing, it means their business documents have been verified by our AI system.",
      },
    ],
  },
  {
    icon: "💬", title: "Community Forum",
    faqs: [
      {
        q: "How do I post a question in the Community Forum?",
        a: "Go to the Community page and click 'Ask Question'. Add a title, description, category, and your area. Community Members and verified residents will answer your question. You can mark a question as resolved once you get a helpful answer.",
      },
      {
        q: "Can I recommend a service in the Community Forum?",
        a: "Yes. In the Community Forum, post a question with the category 'Services' and share your experience. Alternatively, go to your Resident Dashboard → Start Contributing → Recommend a Service.",
      },
      {
        q: "How do I report inappropriate content in the forum?",
        a: "Email trustbridge.platform@gmail.com with the subject 'Community Report' and include the post title and reason for reporting. Inappropriate content is removed within 24 hours.",
      },
    ],
  },
  {
    icon: "🔔", title: "Notifications",
    faqs: [
      {
        q: "Where do I see my notifications?",
        a: "Click the bell icon in the top navigation bar. Your notifications page shows all updates including booking confirmations, review status, verification updates, and community activity. Clicking any notification takes you to the relevant page.",
      },
      {
        q: "Why am I not receiving notifications?",
        a: "Make sure you are logged in to your account. Notifications are delivered in real-time when you are active on the platform. For email notification issues, check your spam folder or contact trustbridge.platform@gmail.com.",
      },
    ],
  },
];

const REPORT_OPTIONS = [
  { icon:"🚨", title:"Report Fake Review",          desc:"Report a review you believe is fake, promotional, or misleading.", subject:"Fake Review Report" },
  { icon:"⚠️", title:"Report Inappropriate Content", desc:"Report offensive, abusive, or inappropriate posts in the forum.",   subject:"Inappropriate Content Report" },
  { icon:"🚫", title:"Report Fraudulent Provider",   desc:"Report a service provider you believe is fraudulent or deceptive.", subject:"Fraudulent Provider Report" },
  { icon:"🔑", title:"Account Recovery",              desc:"Recover a locked or compromised account.",                          subject:"Account Recovery Request" },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:"1.5px solid #e2e8f0", borderRadius:12, overflow:"hidden", marginBottom:8 }}>
      <button onClick={() => setOpen(!open)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"15px 18px", background:"white", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#0f172a", paddingRight:16 }}>{q}</span>
        {open
          ? <ChevronDown style={{ width:15, height:15, color:"#64748b", flexShrink:0 }}/>
          : <ChevronRight style={{ width:15, height:15, color:"#64748b", flexShrink:0 }}/>}
      </button>
      {open && (
        <div style={{ padding:"0 18px 16px", background:"#fafafa" }}>
          <p style={{ fontSize:13, color:"#64748b", lineHeight:1.75, margin:0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch]       = useState("");
  const [activeCategory, setActive] = useState(null);

  const allFaqs = CATEGORIES.flatMap(c => c.faqs.map(f => ({ ...f, category: c.title })));
  const filtered = search.trim()
    ? allFaqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div style={{ background:"#f8fafc", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"52px 0 44px" }}>
        <div className="wrap" style={{ textAlign:"center" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12 }}>
            <Shield style={{ width:20,height:20,color:"#93c5fd" }}/>
            <span style={{ fontSize:12,fontWeight:700,color:"#93c5fd",letterSpacing:"0.08em",textTransform:"uppercase" }}>
              TrustBridge Help Center
            </span>
          </div>
          <h1 style={{ fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, color:"#fff", margin:"0 0 8px", letterSpacing:"-0.02em" }}>
            How can we help you?
          </h1>
          <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 24px" }}>
            Find answers about accounts, bookings, verification, reviews, and more.
          </p>
          <div style={{ position:"relative", maxWidth:540, margin:"0 auto" }}>
            <Search style={{ position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",width:17,height:17,color:"#64748b",pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search help articles…"
              style={{ width:"100%", padding:"14px 20px 14px 50px", borderRadius:999,
                border:"2px solid transparent", background:"white",
                fontSize:14, fontFamily:"inherit", color:"#0f172a",
                boxShadow:"0 4px 20px rgba(0,0,0,0.18)",
                outline:"none", boxSizing:"border-box", transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e=>{ e.target.style.borderColor="#2563eb"; e.target.style.boxShadow="0 4px 24px rgba(37,99,235,0.25)"; }}
              onBlur={e=>{  e.target.style.borderColor="transparent";   e.target.style.boxShadow="0 4px 20px rgba(0,0,0,0.18)"; }}/>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:36, paddingBottom:64 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:28, alignItems:"start" }} className="help-grid">

          {/* Main content */}
          <div>
            {/* Search results */}
            {filtered && (
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:16 }}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
                </h2>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px", background:"white", borderRadius:14, border:"1.5px solid #e2e8f0" }}>
                    <p style={{ fontSize:28, margin:"0 0 8px" }}>🔍</p>
                    <p style={{ fontSize:13, color:"#64748b", margin:"0 0 12px" }}>No results found for "{search}".</p>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Help Request`}
                      style={{ fontSize:13, fontWeight:700, color:"#2563eb", textDecoration:"none" }}>
                      Email our support team →
                    </a>
                  </div>
                ) : filtered.map((f, i) => (
                  <div key={i}>
                    <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>
                      {f.category}
                    </p>
                    <FAQItem q={f.q} a={f.a} />
                  </div>
                ))}
              </div>
            )}

            {/* Category list */}
            {!filtered && (
              <div>
                {/* Category chips */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
                  <button onClick={()=>setActive(null)}
                    style={{ padding:"6px 14px", borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer",
                      border:"1.5px solid", borderColor:!activeCategory?"#2563eb":"#e2e8f0",
                      background:!activeCategory?"#2563eb":"#fff", color:!activeCategory?"#fff":"#475569" }}>
                    All Topics
                  </button>
                  {CATEGORIES.map(c => (
                    <button key={c.title} onClick={()=>setActive(activeCategory===c.title?null:c.title)}
                      style={{ padding:"6px 14px", borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer",
                        border:"1.5px solid", borderColor:activeCategory===c.title?"#2563eb":"#e2e8f0",
                        background:activeCategory===c.title?"#2563eb":"#fff",
                        color:activeCategory===c.title?"#fff":"#475569" }}>
                      {c.icon} {c.title}
                    </button>
                  ))}
                </div>

                {CATEGORIES.filter(c => !activeCategory || c.title === activeCategory).map(cat => (
                  <div key={cat.title} style={{ marginBottom:32 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <h2 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>{cat.title}</h2>
                    </div>
                    {cat.faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
                  </div>
                ))}

                {/* Report section */}
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                    <AlertTriangle style={{ width:18, height:18, color:"#dc2626" }}/>
                    <h2 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>Report an Issue</h2>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="report-grid">
                    {REPORT_OPTIONS.map(r => (
                      <a key={r.title}
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(r.subject)}`}
                        style={{ padding:"16px 18px", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14,
                          textDecoration:"none", display:"flex", flexDirection:"column", gap:6,
                          transition:"box-shadow 0.15s, border-color 0.15s" }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.boxShadow="0 4px 14px rgba(37,99,235,0.1)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="none";}}>
                        <span style={{ fontSize:22 }}>{r.icon}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{r.title}</span>
                        <span style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{r.desc}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#2563eb" }}>Email Support →</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:84 }}>
            {/* Contact */}
            <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"20px",
              boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize:13, fontWeight:800, color:"#0f172a", margin:"0 0 14px" }}>Contact Support</h3>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                <Mail style={{ width:15, height:15, color:"#2563eb", flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Email Support</p>
                  <a href={`mailto:${SUPPORT_EMAIL}`}
                    style={{ fontSize:12, fontWeight:700, color:"#2563eb", textDecoration:"none" }}>
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                <Clock style={{ width:15, height:15, color:"#2563eb", flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Support Hours</p>
                  <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0 }}>Mon–Sat · 9 AM–6 PM IST</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0" }}>
                <BookOpen style={{ width:15, height:15, color:"#2563eb", flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>Response Time</p>
                  <p style={{ fontSize:12, fontWeight:700, color:"#0f172a", margin:0 }}>Within 24–48 business hours</p>
                </div>
              </div>
            </div>

            {/* Support categories */}
            <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:14, padding:"18px" }}>
              <h4 style={{ fontSize:12, fontWeight:800, color:"#1d4ed8", margin:"0 0 12px" }}>Support Categories</h4>
              <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:7 }}>
                {["Account Issues","Booking Issues","Provider Verification","Service Management",
                  "Review & Rating Concerns","Fake Review Reporting","Community Forum Issues","General Support"
                ].map(cat => (
                  <li key={cat}>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(cat)}`}
                      style={{ fontSize:12, color:"#2563eb", textDecoration:"none", fontWeight:500 }}>
                      → {cat}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <Link to="/contact"
              style={{ display:"block", padding:"12px", borderRadius:10, background:"#2563eb", color:"#fff",
                textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none",
                boxShadow:"0 4px 12px rgba(37,99,235,0.25)" }}>
              Contact Us →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.help-grid{grid-template-columns:1fr !important;}}
        @media(max-width:600px){.report-grid{grid-template-columns:1fr !important;}}
      `}</style>
    </div>
  );
}
