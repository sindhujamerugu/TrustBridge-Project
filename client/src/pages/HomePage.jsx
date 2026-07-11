import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Shield, Star, AlertCircle, ArrowRight,
  CheckCircle, Zap, Lock, TrendingUp, ChevronRight,
  Clock, Users, FileCheck, ChevronLeft, Sparkles
} from "lucide-react";
import { serviceAPI, userAPI, statsAPI } from "../services/api";
import { ServiceCard, LoadingSpinner } from "../components/ui/Cards";

/* ─── static data ─── */
const LOCS = ["Bachupally", "Miyapur", "Secunderabad"];

const CATS = [
  { label: "Medical",     icon: "🏥", q: "Medical"       },
  { label: "Grocery",     icon: "🛒", q: "Grocery Stores" },
  { label: "Restaurants", icon: "🍽️", q: "Restaurants"   },
  { label: "Hostels",     icon: "🏠", q: "Hostels"        },
  { label: "Education",   icon: "📚", q: "Education"      },
  { label: "Transport",   icon: "🚌", q: "Transportation" },
  { label: "Pharmacies",  icon: "💊", q: "Pharmacies"     },
  { label: "Clinics",     icon: "🩺", q: "Clinics"        },
];

const TESTIMONIALS = [
  {
    text: "Within 3 days of arriving in Bachupally I had a hostel, a clinic, and a guide who knew every street. TrustBridge felt like having a friend already there.",
    name: "Priya Sharma", role: "Student · Bihar to Hyderabad", avatar: "P", color: "#2563EB",
    rating: 5,
  },
  {
    text: "The verified resident I connected with saved me weeks of confusion. He knew every shortcut, shop, and service in Miyapur.",
    name: "Arjun Reddy", role: "IT Professional · Chennai to Hyderabad", avatar: "A", color: "#059669",
    rating: 5,
  },
  {
    text: "Moving with two kids was overwhelming. TrustBridge helped us find a school, a doctor, and a trustworthy grocery store before we even arrived.",
    name: "Fatima Khan", role: "Family · Mumbai to Hyderabad", avatar: "F", color: "#7C3AED",
    rating: 5,
  },
];

const GUIDES = [
  { name: "Rajesh Kumar", area: "Miyapur",      years: 8,  helped: 142, lang: "Telugu, Hindi, English", initial: "R", color: "#059669", response: "~2 hrs" },
  { name: "Sneha Reddy",  area: "Bachupally",   years: 5,  helped: 97,  lang: "Telugu, English",       initial: "S", color: "#2563eb", response: "~1 hr"  },
  { name: "Anil Sharma",  area: "Secunderabad", years: 12, helped: 203, lang: "Hindi, Telugu, English", initial: "A", color: "#7c3aed", response: "~3 hrs" },
];

const FEATURES = [
  { icon: <Shield size={22} />,    color: "#2563eb", bg: "#eff6ff", title: "Verified Services",         desc: "Every provider passes identity & document verification before listing." },
  { icon: <FileCheck size={22} />, color: "#059669", bg: "#f0fdf4", title: "AI Document Check",         desc: "Aadhaar & GST verification powered by AI OCR — no manual delays." },
  { icon: <Sparkles size={22} />,  color: "#d97706", bg: "#fffbeb", title: "Fake Review Detection",     desc: "Machine learning flags suspicious reviews so you always see the truth." },
  { icon: <Users size={22} />,     color: "#7c3aed", bg: "#faf5ff", title: "Community Guides",          desc: "Real locals who've lived here for years, ready to share their knowledge." },
  { icon: <Lock size={22} />,      color: "#0891b2", bg: "#ecfeff", title: "Secure Messaging",          desc: "Your contact details stay private. Chat safely inside TrustBridge." },
  { icon: <Star size={22} />,      color: "#dc2626", bg: "#fef2f2", title: "Verified Reviews",          desc: "Only users who actually booked a service can leave a review." },
];

const STEPS = [
  { n: "01", icon: "🔍", title: "Search",  desc: "Find services or guides in your area using our smart search." },
  { n: "02", icon: "⚖️", title: "Compare", desc: "Read verified reviews, check trust scores, compare prices."  },
  { n: "03", icon: "💬", title: "Connect", desc: "Message providers or community guides directly and safely."    },
  { n: "04", icon: "✅", title: "Book",    desc: "Confirm your booking and settle in with confidence."           },
];

function fmtStat(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
  if (n >= 100)  return `${n}+`;
  return String(n);
}

/* ──────────────────────────────────────────
   JOURNEY CAROUSEL
────────────────────────────────────────── */
const JOURNEY_SLIDES = [
  {
    step: "01", emoji: "🔍",
    title: "Search Trusted Services",
    desc: "Browse verified clinics, hostels, restaurants, and more — all checked and rated by your community.",
    color: "#2563eb",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=340&fit=crop&auto=format",
  },
  {
    step: "02", emoji: "🤝",
    title: "Connect with Verified Guides",
    desc: "Meet Aadhaar-verified locals who know the city inside out. Ask questions, get directions, feel at home.",
    color: "#059669",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop&auto=format",
  },
  {
    step: "03", emoji: "📅",
    title: "Book Trusted Local Services",
    desc: "Confirm appointments instantly. Secure booking, verified providers, and real reviews from real users.",
    color: "#d97706",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop&auto=format",
  },
  {
    step: "04", emoji: "🏡",
    title: "Settle with Confidence",
    desc: "From day one to feeling at home — TrustBridge stays with you every step of your new city journey.",
    color: "#7c3aed",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=340&fit=crop&auto=format",
  },
];

function JourneyCarousel() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  const goTo = (idx) => { clearTimeout(timer.current); setActive(idx); };

  useEffect(() => {
    timer.current = setTimeout(
      () => setActive(i => (i + 1) % JOURNEY_SLIDES.length),
      4500
    );
    return () => clearTimeout(timer.current);
  }, [active]);

  const slide = JOURNEY_SLIDES[active];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0",
      boxShadow: "0 8px 32px rgba(0,0,0,0.09)", background: "#fff" }}>

      {/* image */}
      <div style={{ position: "relative", height: 190, overflow: "hidden", background: "#f1f5f9" }}>
        <AnimatePresence mode="wait">
          <motion.img key={slide.step} src={slide.image} alt={slide.title}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }} />
        </AnimatePresence>
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex",
          alignItems: "center", gap: 6, background: "rgba(255,255,255,0.93)",
          borderRadius: 999, padding: "3px 10px", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: 15 }}>{slide.emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: slide.color,
            letterSpacing: "0.07em", textTransform: "uppercase" }}>Step {slide.step}</span>
        </div>
      </div>

      {/* text */}
      <div style={{ padding: "16px 20px 12px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={slide.step}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.3 }}>
              {slide.title}
            </h3>
            <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>{slide.desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px 14px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {JOURNEY_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 999, padding: 0,
                border: "none", cursor: "pointer",
                background: i === active ? slide.color : "#e2e8f0",
                transition: "all 0.25s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            () => goTo((active - 1 + JOURNEY_SLIDES.length) % JOURNEY_SLIDES.length),
            () => goTo((active + 1) % JOURNEY_SLIDES.length),
          ].map((fn, i) => (
            <button key={i} onClick={fn}
              style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              {i === 0 ? <ChevronLeft size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fafafa" }}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{active + 1} / {JOURNEY_SLIDES.length}</span>
        <Link to="/register"
          style={{ display: "inline-flex", alignItems: "center", gap: 5,
            background: slide.color, color: "#fff", textDecoration: "none",
            borderRadius: 7, padding: "5px 13px", fontSize: 12, fontWeight: 700,
            transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Get started <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
/* ──────────────────────────────────────────────────────────────
   HERO IMAGE CAROUSEL
────────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    step:"01", tag:"Verified Providers",
    title:"Verified Service Providers",
    desc:"Find identity-verified professionals trusted by the local community. Every listing is document-checked.",
    color:"#2563eb", tagBg:"#dbeafe", tagColor:"#1d4ed8",
    img:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=720&h=440&fit=crop&auto=format",
  },
  {
    step:"02", tag:"Community Guides",
    title:"Trusted Community Guides",
    desc:"Connect with experienced local residents who know every street, service, and shortcut in your new city.",
    color:"#059669", tagBg:"#dcfce7", tagColor:"#166534",
    img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=720&h=440&fit=crop&auto=format",
  },
  {
    step:"03", tag:"AI Reviews",
    title:"AI Verified Reviews",
    desc:"Machine learning detects suspicious reviews and surfaces genuine, trustworthy feedback from real users.",
    color:"#7c3aed", tagBg:"#ede9fe", tagColor:"#5b21b6",
    img:"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=720&h=440&fit=crop&auto=format",
  },
  {
    step:"04", tag:"Emergency Help",
    title:"Emergency Assistance",
    desc:"Quickly access trusted emergency contacts, nearby hospitals, police stations, and essential services.",
    color:"#dc2626", tagBg:"#fee2e2", tagColor:"#991b1b",
    img:"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=720&h=440&fit=crop&auto=format",
  },
  {
    step:"05", tag:"Local Services",
    title:"Discover Local Services",
    desc:"Explore verified restaurants, hostels, clinics, and transport options around your location with confidence.",
    color:"#d97706", tagBg:"#fef3c7", tagColor:"#92400e",
    img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqmmRodEZB2OvkWkk7z390xEN6nC1Cd2t7BRSCkDshXA&s=10",
  },
];

function HeroCarousel() {
  const [active,  setActive]  = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [imgFail, setImgFail] = useState({});
  const timer = useRef(null);

  const go = (i) => { clearTimeout(timer.current); setActive(i); };
  const prev = () => go((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => go((active + 1) % HERO_SLIDES.length);

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => setActive(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearTimeout(timer.current);
  }, [active, paused]);

  const s = HERO_SLIDES[active];
  const fallback = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=720&h=440&fit=crop&auto=format";

  return (
    <div style={{ position:"relative" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Card shell */}
      <div style={{ borderRadius:20, background:"#fff", border:"1px solid #e8ecf0",
        boxShadow:"0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
        overflow:"hidden" }}>

        {/* Image area */}
        <div style={{ position:"relative", height:220, overflow:"hidden", background:"#f1f5f9" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              src={imgFail[active] ? fallback : s.img}
              alt={s.title}
              loading="lazy"
              onError={() => setImgFail(p => ({ ...p, [active]: true }))}
              initial={{ opacity:0, scale:1.04 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0 }}
              transition={{ duration:0.45 }}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", display:"block" }}
            />
          </AnimatePresence>
          {/* Gradient overlay for text legibility */}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }}/>
          {/* Category badge — top left */}
          <div style={{ position:"absolute", top:14, left:14,
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,0.96)", backdropFilter:"blur(6px)",
            borderRadius:999, padding:"5px 12px",
            boxShadow:"0 1px 6px rgba(0,0,0,0.1)" }}>
            <span style={{ fontSize:14, lineHeight:1 }}>{s.icon}</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#374151",
              letterSpacing:"0.01em" }}>{s.tag}</span>
          </div>
        </div>

        {/* Text content */}
        <div style={{ padding:"20px 22px 6px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-6 }} transition={{ duration:0.28 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:"#0f172a",
                margin:"0 0 7px", lineHeight:1.25, letterSpacing:"-0.02em" }}>
                {s.title}
              </h3>
              <p style={{ fontSize:13, color:"#64748b", margin:0, lineHeight:1.65 }}>{s.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 22px 18px" }}>
          <div style={{ display:"flex", gap:5 }}>
            {HERO_SLIDES.map((_,i) => (
              <button key={i} onClick={() => go(i)} style={{
                width: i === active ? 22 : 7, height:7, borderRadius:999, padding:0,
                border:"none", cursor:"pointer", transition:"all 0.25s",
                background: i === active ? s.color : "#e2e8f0",
              }}/>
            ))}
          </div>
          {/* Arrows */}
          <div style={{ display:"flex", gap:6 }}>
            {[{ fn:prev, Icon:ChevronLeft }, { fn:next, Icon:ChevronRight }].map(({ fn, Icon }, i) => (
              <button key={i} onClick={fn}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0",
                  background:"#f8fafc", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = s.tagBg; e.currentTarget.style.borderColor = s.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                <Icon size={14} color="#64748b"/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── tiny reusable pill ─── */
function Pill({ children, color = "#2563eb", bg = "#eff6ff" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999, background: bg, color }}>
      {children}
    </span>
  );
}

/* ─── section label ─── */
function SectionLabel({ children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb",
      background: "#eff6ff", padding: "4px 12px", borderRadius: 999, marginBottom: 16 }}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [q,      setQ]      = useState("");
  const [loc,    setLoc]    = useState("");
  const [svcs,   setSvcs]   = useState([]);
  const [loading, setLd]    = useState(true);
  const [err,    setErr]    = useState(false);
  const [stats,  setStats]  = useState(null);

  useEffect(() => {
    Promise.all([serviceAPI.getAll({ sort: "featured" }), userAPI.getResidents({ minTrustScore: 70 })])
      .then(([s]) => { setSvcs(s.data.data.slice(0, 6)); })
      .catch(() => setErr(true))
      .finally(() => setLd(false));
    statsAPI.get()
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats({}));
  }, []);

  const go = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q)   p.set("search",   q);
    if (loc) p.set("location", loc);
    window.location.href = `/services?${p}`;
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F8FAFC", color: "#0f172a" }}>

      {/* ── offline notice ── */}
      {err && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "8px 0" }}>
          <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#92400e" }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            Backend offline — run <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>npm run dev:server</code>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ HERO */}
      <section style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", overflow:"hidden", position:"relative" }}>

        {/* Background — very soft radial blue glow only, no purple */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse 70% 55% at 12% 45%, rgba(37,99,235,0.055) 0%, transparent 65%), radial-gradient(ellipse 50% 45% at 80% 15%, rgba(59,130,246,0.04) 0%, transparent 60%)" }}/>
        {/* Dot-grid — even lighter */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.22,
          backgroundImage:"radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize:"32px 32px" }}/>

        <div className="wrap" style={{ paddingTop:48, paddingBottom:72, position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }} className="hero-grid">

            {/* ── LEFT copy ── */}
            <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}>

              {/* Trust badge — pure blue palette, no purple */}
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.08, duration:0.4 }}
                style={{ marginBottom:28 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:7, fontSize:11.5, fontWeight:600,
                  padding:"6px 16px", borderRadius:999, letterSpacing:"0.01em",
                  background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e",
                    boxShadow:"0 0 0 3px rgba(34,197,94,0.18)", display:"inline-block" }} className="pulse-dot"/>
                  Trusted Local Assistance · Hyderabad
                </span>
              </motion.div>

              {/* Headline — keep text, polish only typography */}
              <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.13, duration:0.5, ease:[0.16,1,0.3,1] }}
                style={{ fontSize:"clamp(2.5rem,4.2vw,3.6rem)", fontWeight:800, color:"#0f172a",
                  lineHeight:1.08, letterSpacing:"-0.035em", margin:"0 0 26px" }}>
                Move Anywhere.{" "}
                <span style={{ background:"linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#3b82f6 100%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundClip:"text" }}>
                  Trust Everywhere.
                </span>
              </motion.h1>

              {/* Subheading — better line-height, slightly narrower, easier to scan */}
              <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.2, duration:0.45 }}
                style={{ fontSize:"clamp(15px,1.5vw,16.5px)", color:"#64748b", lineHeight:1.8,
                  maxWidth:440, margin:"0 0 40px", fontWeight:400, letterSpacing:"0.005em" }}>
                Discover verified local services, trusted community guides, and authentic community reviews—everything you need to settle into a new place with confidence.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.26, duration:0.4 }}
                style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:52 }}>
                <Link to="/services"
                  style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#2563eb", color:"#fff",
                    textDecoration:"none", borderRadius:10, padding:"13px 26px", fontSize:14.5, fontWeight:700,
                    boxShadow:"0 1px 6px rgba(37,99,235,0.25), 0 1px 2px rgba(0,0,0,0.06)",
                    transition:"background 0.18s, transform 0.18s, box-shadow 0.18s", letterSpacing:"-0.01em" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="#1d4ed8"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(37,99,235,0.3), 0 1px 4px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="#2563eb"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 6px rgba(37,99,235,0.25), 0 1px 2px rgba(0,0,0,0.06)"; }}>
                  Explore Trusted Services <ArrowRight size={15}/>
                </Link>
                <Link to="/residents"
                  style={{ display:"inline-flex", alignItems:"center", gap:7, color:"#374151",
                    textDecoration:"none", fontSize:14.5, fontWeight:500, border:"1px solid #e2e8f0",
                    borderRadius:10, padding:"12px 22px", background:"#fff",
                    transition:"border-color 0.18s, background 0.18s, transform 0.18s, box-shadow 0.18s",
                    letterSpacing:"-0.01em", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#93c5fd"; e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 3px 10px rgba(0,0,0,0.07)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#fff"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)"; }}>
                  Meet Local Guides <ChevronRight size={14}/>
                </Link>
              </motion.div>

              {/* Stats strip */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.35, duration:0.4 }}
                style={{ display:"flex", gap:36, paddingTop:24, borderTop:"1px solid #f1f5f9" }}>
                {[
                  { v: stats ? fmtStat(stats.totalNewcomers)    : "—", l:"Newcomers helped"  },
                  { v: stats ? fmtStat(stats.verifiedResidents) : "—", l:"Verified guides"   },
                  { v: stats ? fmtStat(stats.activeServices)    : "—", l:"Active services"   },
                ].map((s,i)=>(
                  <motion.div key={s.l} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.38+i*0.07 }}>
                    <div style={{ fontSize:"1.35rem", fontWeight:800, color:"#0f172a",
                      lineHeight:1, letterSpacing:"-0.03em" }}>{s.v}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:5, fontWeight:500,
                      letterSpacing:"0.01em" }}>{s.l}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── RIGHT — hero carousel ── */}
            <motion.div initial={{ opacity:0, x:28 }} animate={{ opacity:1, x:0 }}
              transition={{ duration:0.55, delay:0.1, ease:[0.16,1,0.3,1] }}
              className="hero-right" style={{ position:"relative" }}>
              <HeroCarousel/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ SEARCH CARD */}
      <section style={{ background: "#F8FAFC", padding: "32px 0 0" }}>
        <div className="wrap">
          <motion.form onSubmit={go}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "6px", display: "flex",
              flexWrap: "wrap", alignItems: "stretch", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", flex: 1, minWidth: 180 }}>
              <Search size={15} style={{ color: "#94a3b8", flexShrink: 0 }} />
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search services, clinics, hostels…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0f172a", background: "transparent" }} />
            </div>
            <div style={{ width: 1, background: "#f1f5f9", margin: "8px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
              <MapPin size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
              <select value={loc} onChange={e => setLoc(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 13, color: "#475569",
                  background: "transparent", cursor: "pointer" }}>
                <option value="">All Areas</option>
                {LOCS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ padding: 6 }}>
              <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none",
                borderRadius: 9, padding: "10px 28px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
                Search
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* ════════════════════════════════════════ STATS STRIP */}
      <section style={{ background: "#F8FAFC", padding: "48px 0 0" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1,
            background: "#e2e8f0", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}
            className="stats-strip">
            {[
              { v: stats ? fmtStat(stats.totalNewcomers)    : "—", l: "Newcomers helped",          sub: "across Hyderabad" },
              { v: stats ? fmtStat(stats.verifiedResidents) : "—", l: "Verified community members", sub: "Aadhaar-verified"  },
              { v: stats ? fmtStat(stats.activeServices)    : "—", l: "Active services",            sub: "across 3 areas"   },
              { v: stats ? fmtStat(stats.totalReviews)      : "—", l: "Verified reviews",           sub: "AI-moderated"     },
            ].map((s, i) => (
              <motion.div key={s.l}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{ padding: "28px 24px", textAlign: "center", background: "#fff" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 6 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ CATEGORIES */}
      <section style={{ padding: "80px 0", background: "#F8FAFC" }}>
        <div className="wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <SectionLabel>Browse by category</SectionLabel>
              <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#0f172a",
                letterSpacing: "-0.025em", margin: 0 }}>
                Everything you need, nearby
              </h2>
            </div>
            <Link to="/services" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13,
              fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
              Browse all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 12 }} className="cats-grid">
            {CATS.map((cat, i) => (
              <motion.div key={cat.label}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Link to={`/services?category=${encodeURIComponent(cat.q)}`}
                  style={{ textDecoration: "none", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 9, padding: "4px 0" }} className="cat-link">
                  <div style={{ width: 58, height: 58, borderRadius: 14, background: "#fff",
                    border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1.5rem" }} className="cat-icon">
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textAlign: "center" }}>
                    {cat.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ FEATURES */}
      <section style={{ padding: "80px 0", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>Platform features</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 auto 16px", maxWidth: 560 }}>
              Built for trust, designed for newcomers
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
              Every feature exists to help you settle faster, smarter, and safer.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="feat-grid">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ background: "#f8fafc", border: "1.5px solid #f1f5f9", borderRadius: 14,
                  padding: "24px", transition: "all 0.18s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: f.color, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ HOW IT WORKS */}
      <section style={{ padding: "80px 0", background: "#F8FAFC", borderTop: "1px solid #f1f5f9" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.025em", margin: 0 }}>
              From arrival to settled — four steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative" }} className="journey-grid">
            {/* connector line */}
            <div className="journey-line" style={{ position: "absolute", top: 36, left: "12.5%", right: "12.5%",
              height: 1, background: "linear-gradient(90deg, transparent, #dbeafe 20%, #dbeafe 80%, transparent)" }} />
            {STEPS.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  textAlign: "center", padding: "0 16px" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff",
                  border: "2px solid #dbeafe", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1.75rem", marginBottom: 16,
                  position: "relative", zIndex: 1,
                  boxShadow: "0 4px 16px rgba(37,99,235,0.08)" }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd",
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                  Step {s.n}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, maxWidth: 180 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 52 }}>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: "#0f172a", color: "#fff", textDecoration: "none",
              borderRadius: 8, padding: "13px 28px", fontSize: 14, fontWeight: 700 }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
              onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
              Start your journey <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ COMMUNITY GUIDES */}
      <section style={{ padding: "80px 0", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
        <div className="wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <SectionLabel>Community guides</SectionLabel>
              <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#0f172a",
                letterSpacing: "-0.025em", margin: 0 }}>
                Locals who know the city inside out
              </h2>
            </div>
            <Link to="/residents" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13,
              fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
              Meet all guides <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="testi-grid">
            {GUIDES.map((g, i) => (
              <motion.div key={g.name}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "#f8fafc", border: "1.5px solid #f1f5f9", borderRadius: 14,
                  padding: "24px", transition: "all 0.18s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}>
                {/* header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: g.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0, position: "relative" }}>
                    {g.initial}
                    <span style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14,
                      borderRadius: "50%", background: "#22c55e", border: "2.5px solid #f8fafc" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{g.name}</span>
                      <Shield size={12} style={{ color: "#2563eb" }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{g.area}</span>
                  </div>
                </div>

                {/* stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "Years here", value: `${g.years} yrs` },
                    { label: "Newcomers helped", value: g.helped },
                    { label: "Languages", value: g.lang },
                    { label: "Response time", value: g.response },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "#fff", border: "1px solid #f1f5f9",
                      borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{stat.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* community badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Pill color="#059669" bg="#f0fdf4">
                    ✓ Verified Guide
                  </Pill>
                  <Link to="/residents"
                    style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textDecoration: "none",
                      display: "flex", alignItems: "center", gap: 4 }}>
                    View Profile <ChevronRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ FEATURED SERVICES */}
      {!loading && svcs.length > 0 && (
        <section style={{ padding: "80px 0", background: "#F8FAFC", borderTop: "1px solid #f1f5f9" }}>
          <div className="wrap">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
              <div>
                <SectionLabel>Featured services</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#0f172a",
                  letterSpacing: "-0.025em", margin: 0 }}>
                  Top-rated, verified providers near you
                </h2>
              </div>
              <Link to="/services" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13,
                fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {svcs.map((s, i) => <ServiceCard key={s._id} service={s} index={i} />)}
            </div>
          </div>
        </section>
      )}
      {loading && (
        <section style={{ padding: "80px 0", background: "#F8FAFC" }}>
          <div className="wrap"><LoadingSpinner /></div>
        </section>
      )}

      {/* ════════════════════════════════════════ TRUST / WHY */}
      <section style={{ padding: "80px 0", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="trust-grid">
            {/* left */}
            <div>
              <SectionLabel>Why TrustBridge</SectionLabel>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2.25rem)", fontWeight: 800, color: "#0f172a",
                lineHeight: 1.2, letterSpacing: "-0.025em", margin: "0 0 16px" }}>
                Built on real trust, not just good&nbsp;intentions
              </h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, marginBottom: 40, maxWidth: 420 }}>
                Every person is verified. Every review is moderated. Every trust score is public —
                because settling into a new city is hard enough without worrying about scams.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {[
                  { Icon: Shield,     title: "Aadhaar-Verified Identities",  desc: "Every provider passes a government ID check before they can help newcomers." },
                  { Icon: Zap,        title: "AI-Powered Review Guard",      desc: "ML removes fake reviews before they reach you — ratings are always real." },
                  { Icon: TrendingUp, title: "Live Trust Scores",            desc: "Transparent ratings show exactly how reliable each guide or provider is." },
                  { Icon: Lock,       title: "Private, Secure Messaging",    desc: "All chats stay inside TrustBridge. Your contact details are never shared." },
                ].map((f, i) => (
                  <motion.div key={f.title}
                    initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#eff6ff",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                      <f.Icon size={17} style={{ color: "#2563eb" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{f.title}</h3>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* right — stat card + checklist */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ background: "#0f172a", borderRadius: 16, padding: "36px 32px",
                  textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>98%</div>
                <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 10, lineHeight: 1.55 }}>
                  of newcomers say they felt safe<br />within their first week
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 3, margin: "16px 0 8px" }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} style={{ color: "#f59e0b", fill: "#f59e0b" }} />)}
                </div>
                <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                  Based on {stats ? fmtStat(stats.totalReviews) : "—"} verified reviews
                </p>
              </motion.div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {[
                  "Every provider is Aadhaar-verified",
                  "AI removes fake reviews automatically",
                  "Your data stays private and secure",
                  "Free to join — no credit card needed",
                  "Available in Bachupally, Miyapur & Secunderabad",
                ].map(pt => (
                  <div key={pt} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle size={15} style={{ color: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{pt}</span>
                  </div>
                ))}
              </div>

              <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: "#2563eb", color: "#fff", textDecoration: "none",
                borderRadius: 8, padding: "12px 22px", fontSize: 14, fontWeight: 700,
                boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
                Get Started Free <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ TESTIMONIALS */}
      <section style={{ padding: "80px 0", background: "#0f172a" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", color: "#60a5fa",
              background: "rgba(96,165,250,0.12)", padding: "4px 12px", borderRadius: 999, marginBottom: 16 }}>
              Real stories
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#fff",
              letterSpacing: "-0.025em", margin: 0 }}>
              Newcomers who found their footing
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "28px 24px" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} />)}
                </div>
                <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.75, marginBottom: 24 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12,
                  paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ FINAL CTA */}
      <section style={{ padding: "96px 0", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
        <div className="wrap" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Shield size={28} style={{ color: "#2563eb" }} />
            </div>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#0f172a",
              lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Your new city is waiting.
              <br />
              <span style={{ color: "#2563eb" }}>Start with people you can trust.</span>
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, maxWidth: 440, margin: "0 auto 36px" }}>
              Thousands of newcomers arrived alone and found a community here.
              Join them — free, verified, and starting right now.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: "#2563eb", color: "#fff", textDecoration: "none",
                borderRadius: 8, padding: "13px 28px", fontSize: 15, fontWeight: 700,
                boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/services" style={{ display: "inline-flex", alignItems: "center", gap: 7,
                color: "#0f172a", textDecoration: "none", fontSize: 15, fontWeight: 600,
                border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 24px",
                background: "#fff" }}>
                Browse Services <ChevronRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}