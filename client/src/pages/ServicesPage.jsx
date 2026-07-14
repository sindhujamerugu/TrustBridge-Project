import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, MapPin, Star, Shield, Phone, Navigation,
  Clock, ChevronRight, SlidersHorizontal, Sparkles,
  TrendingUp, Plus, CheckCircle, ArrowRight, Zap
} from "lucide-react";
import { serviceAPI, getImageUrl } from "../services/api";
import { LoadingSpinner } from "../components/ui/Cards";

// ─── category config ──────────────────────────────────────────────────────────
const CAT_CONFIG = {
  "Restaurants":     { emoji:"🍽️", color:"#ef4444", bg:"#fef2f2", border:"#fecaca", priceLabel:"Average Cost",      sortColor:"#ef4444" },
 "Hostels":         { emoji:"🏠", color:"#7c3aed", bg:"#faf5ff", border:"#ddd6fe", priceLabel:"Starting From",      sortColor:"#7c3aed" },
  "Grocery Stores":  { emoji:"🛒", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", priceLabel:"Delivery Available", sortColor:"#16a34a" },
  "Education":       { emoji:"📚", color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc", priceLabel:"Course Fee",         sortColor:"#0891b2" },
  "Transportation":  { emoji:"🚗", color:"#d97706", bg:"#fffbeb", border:"#fde68a", priceLabel:"Per Ride",           sortColor:"#d97706" },
  "Salons":          { emoji:"✂️", color:"#db2777", bg:"#fdf2f8", border:"#fbcfe8", priceLabel:"Starting From",      sortColor:"#db2777" },
  "Laundry":         { emoji:"👕", color:"#0d9488", bg:"#f0fdfa", border:"#99f6e4", priceLabel:"Per KG",             sortColor:"#0d9488" },
  "Banks":           { emoji:"🏦", color:"#1e40af", bg:"#eff6ff", border:"#bfdbfe", priceLabel:"Free Service",       sortColor:"#1e40af" },
  "Pharmacies":      { emoji:"💊", color:"#dc2626", bg:"#fef2f2", border:"#fecaca", priceLabel:"Delivery Available", sortColor:"#dc2626" },
  "Hospitals":       { emoji:"🏥", color:"#0369a1", bg:"#f0f9ff", border:"#bae6fd", priceLabel:"Consultation Fee",  sortColor:"#0369a1" },
  "Medical":         { emoji:"⚕️", color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc", priceLabel:"Consultation Fee",  sortColor:"#0891b2" },
};
const DEFAULT_CAT = { emoji:"🏢", color:"#64748b", bg:"#f8fafc", border:"#e2e8f0", priceLabel:"Price", sortColor:"#64748b" };
const getCat = (c) => CAT_CONFIG[c] || DEFAULT_CAT;

// ─── sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value:"top_rated", label:"Top Rated",      icon:"⭐", serverSort:true  },
  { value:"trusted",   label:"Most Trusted",   icon:"🛡️", serverSort:false },
  { value:"nearest",   label:"Nearest",        icon:"📍", serverSort:false },
  { value:"newest",    label:"Recently Added", icon:"✨", serverSort:true  },
];

// ─── fallback images per category ────────────────────────────────────────────
const CAT_IMGS = {
  "Restaurants":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
 "Hostels":        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop",
  "Grocery Stores": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&h=400&fit=crop",
  "Pharmacies":     "https://images.unsplash.com/photo-1583912086096-8c60d75a537f?w=600&h=400&fit=crop",
  "Education":      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
  "Transportation": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop",
  "Salons":         "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
  "Laundry":        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=400&fit=crop",
  "Banks":          "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&h=400&fit=crop",
  "Hospitals":      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop",
  "Medical":        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",
};
// Generic business fallback — not a house/property
const FALLBACK_IMG = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop";
const getImg = (svc) => getImageUrl(svc.images?.[0]) || CAT_IMGS[svc.category] || FALLBACK_IMG;

// ─── trust score helper ───────────────────────────────────────────────────────
function trustScore(svc) {
  let score = 50;
  if (svc.isVerified)        score += 20;
  if (svc.isFeatured)        score += 10;
  if (svc.averageRating >= 4.5) score += 10;
  if (svc.totalReviews >= 10)   score += 10;
  return Math.min(score, 100);
}

// ─── open/closed mock (hours not in model, use name hash for demo) ────────────
function isOpenNow(svc) {
  const h = new Date().getHours();
  const seed = (svc._id?.charCodeAt(0) || 0) % 3;
  if (seed === 0) return h >= 9 && h < 21;
  if (seed === 1) return h >= 8 && h < 22;
  return h >= 7 && h < 23;
}

// ─── price label ──────────────────────────────────────────────────────────────
function PriceDisplay({ svc }) {
  const cat = getCat(svc.category);
  if (svc.category === "Grocery Stores") {
    return <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>🛵 Delivery Available</span>;
  }
  if (svc.category === "Banks") {
    return <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>Free Service</span>;
  }
  if (!svc.price || svc.price === 0) {
    return <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>Free</span>;
  }
  return (
    <span style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>
      ₹{svc.price.toLocaleString()}
      <span style={{ fontSize:11, fontWeight:500, color:"#94a3b8" }}> · {cat.priceLabel}</span>
    </span>
  );
}

// ─── trust badge ──────────────────────────────────────────────────────────────
function TrustBadge({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#64748b";
  const bg    = score >= 80 ? "#f0fdf4" : score >= 60 ? "#fffbeb" : "#f8fafc";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:4,
      padding:"3px 8px", borderRadius:99,
      background:bg, border:`1px solid ${color}22`,
    }}>
      <Shield style={{ width:10, height:10, color }} />
      <span style={{ fontSize:10, fontWeight:800, color }}>{score}</span>
    </div>
  );
}

// ─── service card ─────────────────────────────────────────────────────────────
function ServiceCard({ svc, index = 0 }) {
  const cat    = getCat(svc.category);
  const open   = isOpenNow(svc);
  const score  = trustScore(svc);
  const rating = svc.averageRating?.toFixed(1) || null;
  const img    = getImg(svc);

  return (
    <motion.div
      initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ duration:0.3, delay:index*0.05 }}
      style={{
        background:"#fff", borderRadius:18, overflow:"hidden",
        border:"1.5px solid #e2e8f0",
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
        transition:"box-shadow 0.2s, transform 0.2s",
        display:"flex", flexDirection:"column",
      }}
      whileHover={{ y:-3, boxShadow:"0 12px 32px rgba(0,0,0,0.10)" }}
    >
      {/* image */}
      <div style={{ position:"relative", height:180, overflow:"hidden", background:"#e2e8f0" }}>
        <img src={img} alt={svc.title} loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.4s" }}
          onError={e => { e.target.src = FALLBACK_IMG; }}
        />
        {/* gradient overlay */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />

        {/* top-left: open/closed */}
        <div style={{
          position:"absolute", top:10, left:10,
          display:"flex", alignItems:"center", gap:5,
          padding:"4px 9px", borderRadius:99,
          background: open ? "rgba(22,163,74,0.9)" : "rgba(100,116,139,0.85)",
          backdropFilter:"blur(4px)",
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:open?"#86efac":"#cbd5e1" }} />
          <span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>{open ? "Open Now" : "Closed"}</span>
        </div>

        {/* top-right: category pill */}
        <div style={{
          position:"absolute", top:10, right:10,
          padding:"4px 10px", borderRadius:99,
          background:cat.bg, border:`1px solid ${cat.border}`,
          fontSize:11, fontWeight:700, color:cat.color,
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span>{cat.emoji}</span> {svc.category}
        </div>

        {/* bottom-left: rating */}
        {rating && (
          <div style={{
            position:"absolute", bottom:10, left:10,
            display:"flex", alignItems:"center", gap:4,
            padding:"4px 9px", borderRadius:99,
            background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
          }}>
            <Star style={{ width:11, height:11, color:"#fbbf24", fill:"#fbbf24" }} />
            <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>{rating}</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>({svc.totalReviews||0})</span>
          </div>
        )}

        {/* bottom-right: verified badge */}
        {svc.isVerified && (
          <div style={{
            position:"absolute", bottom:10, right:10,
            display:"flex", alignItems:"center", gap:4,
            padding:"4px 9px", borderRadius:99,
            background:"rgba(37,99,235,0.85)", backdropFilter:"blur(4px)",
          }}>
            <CheckCircle style={{ width:10, height:10, color:"#fff" }} />
            <span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>Verified</span>
          </div>
        )}
        {svc.isFeatured && !svc.isVerified && (
          <div style={{
            position:"absolute", bottom:10, right:10,
            padding:"4px 9px", borderRadius:99,
            background:"rgba(217,119,6,0.85)", backdropFilter:"blur(4px)",
            fontSize:10, fontWeight:700, color:"#fff",
          }}>⭐ Featured</div>
        )}
      </div>

      {/* body */}
      <div style={{ padding:"14px 16px 12px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {/* title + trust */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
          <h3 style={{
            fontSize:14, fontWeight:800, color:"#0f172a", lineHeight:1.3,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            flex:1,
          }}>{svc.title}</h3>
          <TrustBadge score={score} />
        </div>

        {/* location */}
        <p style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:4, margin:0 }}>
          <MapPin style={{ width:12, height:12, flexShrink:0 }} />
          {svc.address || svc.location}
        </p>

        {/* price */}
        <div style={{ marginTop:2 }}>
          <PriceDisplay svc={svc} />
        </div>
      </div>

      {/* quick actions */}
      <div style={{
        display:"grid",
        gridTemplateColumns: svc.contactNumber ? "1fr 1fr 1fr" : "1fr 1fr",
        borderTop:"1px solid #f1f5f9",
      }}>
        {[
          { icon:<Navigation style={{ width:13,height:13 }}/>, label:"Directions",
            href:`https://maps.google.com/?q=${encodeURIComponent((svc.address||svc.title)+' '+svc.location)}`, ext:true },
          ...(svc.contactNumber ? [{
            icon:<Phone style={{ width:13,height:13 }}/>, label:"Call",
            href:`tel:${svc.contactNumber}`, ext:false,
          }] : []),
          { icon:<ArrowRight style={{ width:13,height:13 }}/>, label:"Details",
            href:`/services/${svc._id}`, ext:false },
        ].map(({ icon, label, href, ext }) => {
          const btnStyle = {
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:3, padding:"10px 4px", fontSize:10, fontWeight:700,
            color:"#475569", background:"none", border:"none",
            cursor:"pointer", transition:"background 0.15s, color 0.15s",
            textDecoration:"none",
          };
          const content = <>{icon}{label}</>;
          if (ext) return (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={btnStyle}
              onMouseEnter={e=>{e.currentTarget.style.background="#f0f9ff";e.currentTarget.style.color="#2563eb";}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="#475569";}}>
              {content}
            </a>
          );
          return (
            <Link key={label} to={href} style={btnStyle}
              onMouseEnter={e=>{e.currentTarget.style.background="#f0f9ff";e.currentTarget.style.color="#2563eb";}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="#475569";}}>
              {content}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── horizontal scroll row ────────────────────────────────────────────────────
function ServiceRow({ services, label, icon, desc }) {
  if (!services.length) return null;
  return (
    <section style={{ marginBottom:36 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:0 }}>{label}</h2>
          </div>
          <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>{desc}</p>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }} className="svc-grid">
        {services.slice(0,6).map((s,i) => <ServiceCard key={s._id} svc={s} index={i} />)}
      </div>
    </section>
  );
}

// ─── category chip ────────────────────────────────────────────────────────────
function CatChip({ cat, active, onClick }) {
  const cfg = cat ? getCat(cat) : { emoji:"✨", color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" };
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"7px 14px", borderRadius:99, fontSize:13, fontWeight:700,
      border:"1.5px solid",
      borderColor: active ? cfg.color : "#e2e8f0",
      background: active ? cfg.bg : "#fff",
      color: active ? cfg.color : "#475569",
      cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
      boxShadow: active ? `0 2px 8px ${cfg.color}22` : "none",
    }}>
      <span>{cfg.emoji}</span>
      {cat || "All"}
    </button>
  );
}

// ─── sort chip ────────────────────────────────────────────────────────────────
function SortChip({ opt, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:5,
      padding:"6px 13px", borderRadius:99, fontSize:12, fontWeight:700,
      border:"1.5px solid",
      borderColor: active ? "#2563eb" : "#e2e8f0",
      background: active ? "#2563eb" : "#fff",
      color: active ? "#fff" : "#475569",
      cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
    }}>
      <span>{opt.icon}</span> {opt.label}
    </button>
  );
}

// ─── Haversine distance (km) ─────────────────────────────────────────────────
const AREA_COORDS = {
  bachupally:   { lat:17.5610, lng:78.3680 },
  miyapur:      { lat:17.4966, lng:78.3568 },
  secunderabad: { lat:17.4399, lng:78.4983 },
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function serviceCoords(svc) {
  if (svc.coordinates?.lat && svc.coordinates?.lng)
    return { lat: svc.coordinates.lat, lng: svc.coordinates.lng };
  const key = (svc.location || '').toLowerCase().trim();
  return AREA_COORDS[key] || AREA_COORDS['bachupally'];
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [sp, setSp] = useSearchParams();
  const [allServices, setAll] = useState([]);
  const [categories, setCats] = useState([]);
  const [locations, setLocs]  = useState([]);
  const [loading, setLd]      = useState(true);
  const [drawerOpen, setDrw]  = useState(false);
  const [searchFocused, setSF] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus]   = useState('idle'); // idle | requesting | granted | denied

  const [f, setF] = useState({
    search:   sp.get("search")   || "",
    category: sp.get("category") || "",
    location: sp.get("location") || "",
    sort:     sp.get("sort")     || "featured",
  });

  // live search input (debounced)
  const [searchInput, setSearchInput] = useState(f.search);
  const debounceRef  = useRef(null);
  const searchRef    = useRef(null);
  const dropRef      = useRef(null);

  // Search dropdown state
  const [showDrop,  setShowDrop]  = useState(false);
  const [recentSearches, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tb_recent_searches') || '[]'); } catch { return []; }
  });

  // Popular searches — static but contextual to TrustBridge
  const POPULAR = [
    { icon:"🏠", label:"PG near VNR VJIET"      },
    { icon:"🏥", label:"Dental Clinics"          },
    { icon:"🍽️", label:"Restaurants"             },
    { icon:"💊", label:"Pharmacies"              },
    { icon:"🛒", label:"Grocery Stores"          },
    { icon:"🏨", label:"Hostels"                 },
    { icon:"🚌", label:"Transport Services"      },
    { icon:"📚", label:"Libraries"               },
  ];

  // Smart autocomplete from service titles + categories + locations
  const suggestions = searchInput.trim().length >= 2
    ? (() => {
        const q = searchInput.toLowerCase();
        const seen = new Set();
        const results = [];
        // Service names
        allServices.forEach(s => {
          const name = s.title || '';
          if (name.toLowerCase().includes(q) && !seen.has(name)) {
            seen.add(name); results.push({ icon:"🔍", label: name });
          }
        });
        // Categories
        categories.forEach(c => {
          if (c.toLowerCase().includes(q) && !seen.has(c)) {
            seen.add(c); results.push({ icon: getCat(c).emoji || "🏢", label: c });
          }
          // "X in Y" combos
          ['Bachupally','Miyapur','Secunderabad'].forEach(loc => {
            const combo = `${c} in ${loc}`;
            if ((c.toLowerCase().includes(q) || loc.toLowerCase().includes(q)) && !seen.has(combo)) {
              seen.add(combo); results.push({ icon: getCat(c).emoji || "📍", label: combo });
            }
          });
        });
        // Locations
        ['Bachupally','Miyapur','Secunderabad'].forEach(loc => {
          if (loc.toLowerCase().includes(q) && !seen.has(loc)) {
            seen.add(loc); results.push({ icon:"📍", label: loc });
          }
        });
        return results.slice(0, 7);
      })()
    : [];

  const saveRecent = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(r => r !== trimmed)].slice(0, 5);
    setRecent(updated);
    try { localStorage.setItem('tb_recent_searches', JSON.stringify(updated)); } catch {}
  };

  const pickSuggestion = (label) => {
    setSearchInput(label);
    setShowDrop(false);
    saveRecent(label);
    upd("search", label);
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem('tb_recent_searches'); } catch {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    serviceAPI.getCategories().then(({ data }) => setCats(data.data || [])).catch(()=>{});
    serviceAPI.getLocations().then(({ data }) => setLocs(data.data || [])).catch(()=>{});
  }, []);

  useEffect(() => {
    setLd(true);
    const p = {};
    if (f.search)   p.search   = f.search;
    if (f.category) p.category = f.category;
    if (f.location) p.location = f.location;
    // Only pass server-sortable values — trusted/nearest are handled client-side
    const serverOpt = SORT_OPTIONS.find(o => o.value === f.sort);
    if (serverOpt?.serverSort) p.sort = f.sort;
    else p.sort = 'featured'; // fetch full list for client-side sort
    serviceAPI.getAll(p)
      .then(({ data }) => setAll(data.data || []))
      .catch(() => setAll([]))
      .finally(() => setLd(false));
  }, [f]);

  const upd = (k, v) => {
    // When selecting Nearest, request geolocation first
    if (k === 'sort' && v === 'nearest' && !userCoords) {
      setGeoStatus('requesting');
      navigator.geolocation?.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('granted');
        },
        () => setGeoStatus('denied'),
        { timeout: 8000 }
      );
    }
    const n = { ...f, [k]: v };
    setF(n);
    const p = new URLSearchParams();
    Object.entries(n).forEach(([k, v]) => { if (v) p.set(k, v); });
    setSp(p);
  };

  const handleSearchInput = (val) => {
    setSearchInput(val);
    setShowDrop(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upd("search", val), 400);
  };

  const clear = () => {
    setF({ search:"", category:"", location:"", sort:"featured" });
    setSearchInput("");
    setSp({});
  };

  const hasF    = f.search || f.category || f.location || f.sort !== "featured";
  const isSearch = !!(f.search || f.category || f.location);

  // ── apply client-side sort for trusted / nearest ───────────────────────────
  const sorted = (() => {
    const base = [...allServices];
    if (f.sort === 'trusted') {
      return base.sort((a, b) => trustScore(b) - trustScore(a));
    }
    if (f.sort === 'nearest') {
      const origin = userCoords || AREA_COORDS['bachupally'];
      return base.sort((a, b) => {
        const ca = serviceCoords(a), cb = serviceCoords(b);
        return haversine(origin.lat, origin.lng, ca.lat, ca.lng)
             - haversine(origin.lat, origin.lng, cb.lat, cb.lng);
      });
    }
    return base; // server already sorted for top_rated / newest
  })();

  // ── derived discovery sections (default view, no active search/filter) ──────
  const recommended = [...allServices].sort((a,b) => (b.averageRating||0)-(a.averageRating||0));
  const topRated    = [...allServices]
    .filter(s => (s.averageRating||0) >= 4 || s.isVerified)
    .sort((a,b) => trustScore(b) - trustScore(a));
  const recent      = [...allServices]
    .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

  return (
    <div style={{ background:"#f0f4f8", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* ── hero header ── */}
      <div style={{
        background:"linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        padding:"40px 0 32px",
      }}>
        <div className="wrap">
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
              <Zap style={{ width:18, height:18, color:"#93c5fd" }} />
              <span style={{ fontSize:12, fontWeight:700, color:"#93c5fd", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                Trusted by 1,200+ Newcomers
              </span>
            </div>
            <h1 style={{ fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 8px", lineHeight:1.2 }}>
              Discover Trusted Services
            </h1>
            <p style={{ fontSize:14, color:"#bfdbfe", margin:"0 0 24px" }}>
              Verified, reviewed, and recommended by locals in Hyderabad
            </p>

            {/* search bar */}
            <div ref={dropRef} style={{ position:"relative", maxWidth:580, margin:"0 auto" }}>
              {/* Input row */}
              <div style={{ position:"relative" }}>
                <Search style={{
                  position:"absolute", left:16, top:"50%", transform:"translateY(-50%)",
                  width:17, height:17, pointerEvents:"none",
                  color: searchFocused ? "#2563eb" : "#94a3b8",
                  transition:"color 0.2s",
                }} />
                <input
                  ref={searchRef}
                  value={searchInput}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => { setSF(true); setShowDrop(true); }}
                  onBlur={() => setSF(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { saveRecent(searchInput); setShowDrop(false); }
                    if (e.key === 'Escape') { setShowDrop(false); searchRef.current?.blur(); }
                  }}
                  placeholder='Try "PG near VNR", "Dentist", or "Restaurants in Miyapur"'
                  style={{
                    width:"100%", padding:"14px 48px",
                    border:"2px solid",
                    borderColor: searchFocused ? "#fff" : "rgba(255,255,255,0.25)",
                    borderRadius:14, fontSize:14, fontFamily:"inherit",
                    color:"#0f172a", background:"rgba(255,255,255,0.97)",
                    outline:"none", boxSizing:"border-box",
                    boxShadow: searchFocused ? "0 0 0 4px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.18)" : "0 4px 16px rgba(0,0,0,0.15)",
                    transition:"all 0.2s",
                  }}
                  autoComplete="off"
                />
                {searchInput && (
                  <button onClick={() => { handleSearchInput(""); setShowDrop(true); }} style={{
                    position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    background:"rgba(241,245,249,0.9)", border:"none", cursor:"pointer",
                    padding:5, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <X style={{ width:12, height:12, color:"#64748b" }} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showDrop && (
                  <motion.div
                    initial={{ opacity:0, y:-6, scale:0.98 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:-6, scale:0.98 }}
                    transition={{ duration:0.14 }}
                    style={{
                      position:"absolute", top:"calc(100% + 8px)", left:0, right:0, zIndex:200,
                      background:"#fff", borderRadius:14, overflow:"hidden",
                      boxShadow:"0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                      border:"1px solid #e2e8f0",
                    }}>

                    {/* Live autocomplete while typing */}
                    {suggestions.length > 0 ? (
                      <div style={{ padding:"8px 0" }}>
                        {suggestions.map((s, i) => (
                          <button key={i} onMouseDown={() => pickSuggestion(s.label)} style={{
                            width:"100%", display:"flex", alignItems:"center", gap:10,
                            padding:"9px 16px", background:"none", border:"none",
                            cursor:"pointer", textAlign:"left", transition:"background 0.1s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background="none"}>
                            <span style={{ fontSize:14, width:22, textAlign:"center", flexShrink:0 }}>{s.icon}</span>
                            <span style={{ fontSize:13, color:"#0f172a", fontWeight:500, flex:1 }}>
                              {(() => {
                                const idx = s.label.toLowerCase().indexOf(searchInput.toLowerCase());
                                if (idx < 0) return s.label;
                                return <>
                                  {s.label.slice(0, idx)}
                                  <strong style={{ color:"#2563eb" }}>{s.label.slice(idx, idx + searchInput.length)}</strong>
                                  {s.label.slice(idx + searchInput.length)}
                                </>;
                              })()}
                            </span>
                            <ChevronRight style={{ width:12, height:12, color:"#cbd5e1" }} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        {/* Recent searches */}
                        {recentSearches.length > 0 && (
                          <div style={{ padding:"12px 16px 4px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>Recent</span>
                              <button onMouseDown={clearRecent} style={{ background:"none", border:"none", fontSize:11, color:"#94a3b8", cursor:"pointer", fontWeight:600 }}>Clear</button>
                            </div>
                            {recentSearches.map((r, i) => (
                              <button key={i} onMouseDown={() => pickSuggestion(r)} style={{
                                width:"100%", display:"flex", alignItems:"center", gap:10,
                                padding:"8px 0", background:"none", border:"none", cursor:"pointer", textAlign:"left",
                              }}>
                                <Clock style={{ width:12, height:12, color:"#94a3b8", flexShrink:0 }} />
                                <span style={{ fontSize:13, color:"#374151", flex:1 }}>{r}</span>
                                <ChevronRight style={{ width:11, height:11, color:"#cbd5e1" }} />
                              </button>
                            ))}
                            <div style={{ height:1, background:"#f1f5f9", margin:"8px 0 0" }}/>
                          </div>
                        )}
                        {/* Popular searches */}
                        <div style={{ padding:"10px 16px 14px" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>🔥 Popular</span>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2, marginTop:8 }}>
                            {POPULAR.map((p, i) => (
                              <button key={i} onMouseDown={() => pickSuggestion(p.label)} style={{
                                display:"flex", alignItems:"center", gap:8,
                                padding:"7px 10px", borderRadius:9, background:"none", border:"none",
                                cursor:"pointer", textAlign:"left", transition:"background 0.12s",
                              }}
                                onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                                onMouseLeave={e => e.currentTarget.style.background="none"}>
                                <span style={{ fontSize:14 }}>{p.icon}</span>
                                <span style={{ fontSize:12, color:"#374151", fontWeight:500 }}>{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* trust stats bar */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:24, flexWrap:"wrap",
          }}>
            {(() => {
              const verifiedCount = allServices.filter(s => s.isVerified).length;
              const topRatedCount = allServices.filter(s => (s.averageRating||0) >= 4).length;
              const areasCount    = [...new Set(allServices.map(s => s.location).filter(Boolean))].length;
              const stats = [
                verifiedCount > 0 ? { icon:"🛡️", label:`${verifiedCount} Verified Businesses` } : null,
                topRatedCount > 0 ? { icon:"⭐", label:`${topRatedCount} Top Rated` }             : null,
                areasCount    > 0 ? { icon:"📍", label:`${areasCount} Areas Covered` }            : null,
              ].filter(Boolean);
              return stats.map(({ icon, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:14 }}>{icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{label}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── main content ── */}
      <div className="wrap" style={{ paddingTop:28, paddingBottom:56 }}>

        {/* category chips */}
        <div style={{ overflowX:"auto", marginBottom:20, paddingBottom:4 }}>
          <div style={{ display:"flex", gap:8, minWidth:"max-content" }}>
            <CatChip cat="" active={!f.category} onClick={() => upd("category", "")} />
            {categories.map(c => (
              <CatChip key={c} cat={c} active={f.category === c} onClick={() => upd("category", c)} />
            ))}
          </div>
        </div>

        {/* sort + filter bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, gap:12, flexWrap:"wrap" }}>
          {/* sort chips */}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {SORT_OPTIONS.map(opt => (
              <SortChip key={opt.value} opt={opt} active={f.sort === opt.value} onClick={() => upd("sort", opt.value)} />
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {hasF && (
              <button onClick={clear} style={{
                fontSize:12, color:"#ef4444", fontWeight:700,
                background:"none", border:"none", cursor:"pointer", padding:"4px 8px",
              }}>
                ✕ Clear
              </button>
            )}
            <button onClick={() => setDrw(true)} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"7px 14px", border:"1.5px solid #e2e8f0",
              borderRadius:99, background:"#fff", fontSize:13, fontWeight:700,
              color:"#475569", cursor:"pointer", transition:"all 0.15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.color="#2563eb";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#475569";}}>
              <SlidersHorizontal style={{ width:13, height:13 }} />
              Filters
              {(f.location) && <span style={{ width:7, height:7, background:"#2563eb", borderRadius:"50%", display:"inline-block" }} />}
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : sorted.length === 0 ? (
          /* empty state */
          <div style={{
            textAlign:"center", padding:"64px 24px",
            background:"#fff", borderRadius:20,
            border:"1.5px dashed #e2e8f0",
          }}>
            <p style={{ fontSize:40, margin:"0 0 14px" }}>🔍</p>
            <p style={{ fontSize:16, fontWeight:800, color:"#0f172a", margin:"0 0 6px" }}>No services found</p>
            <p style={{ fontSize:13, color:"#64748b", margin:"0 0 20px" }}>Try adjusting your filters or search in a different area.</p>
            {hasF && (
              <button onClick={clear} style={{
                padding:"10px 24px", borderRadius:99, background:"#2563eb",
                color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer",
              }}>Clear Filters</button>
            )}
          </div>
        ) : isSearch || f.sort !== "featured" ? (
          /* search/sort results — flat grid */
          <>
            {/* Nearest geo status banner */}
            {f.sort === 'nearest' && (
              <div style={{
                display:"flex", alignItems:"center", gap:8, marginBottom:16,
                padding:"10px 14px", borderRadius:10,
                background: geoStatus === 'denied' ? "#fef2f2" : "#f0fdf4",
                border:`1px solid ${geoStatus === 'denied' ? "#fecaca" : "#bbf7d0"}`,
                fontSize:13, fontWeight:600,
                color: geoStatus === 'denied' ? "#dc2626" : "#15803d",
              }}>
                <span style={{ fontSize:16 }}>{geoStatus === 'denied' ? "⚠️" : "📍"}</span>
                {geoStatus === 'requesting' && "Requesting your location…"}
                {geoStatus === 'granted'    && "Sorted by distance from your location"}
                {geoStatus === 'denied'     && "Location access denied — showing approximate distance from Bachupally"}
                {geoStatus === 'idle'       && "Sorted by approximate distance from Bachupally"}
              </div>
            )}
            <p style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
              <span style={{ fontWeight:800, color:"#0f172a" }}>{sorted.length}</span> services found
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }} className="svc-grid">
              {sorted.map((s, i) => <ServiceCard key={s._id} svc={s} index={i} />)}
            </div>
          </>
        ) : (
          /* discovery sections */
          <>
            <ServiceRow
              services={recommended}
              label="Recommended For You"
              icon="✨"
              desc="Highly rated services trusted by the TrustBridge community"
            />
            <ServiceRow
              services={topRated}
              label="Top Rated Near You"
              icon="⭐"
              desc="Verified businesses with outstanding reviews"
            />
            <ServiceRow
              services={recent}
              label="Recently Added"
              icon="🆕"
              desc="Fresh listings added to TrustBridge this week"
            />
            {allServices.length > 9 && (
              <div style={{ textAlign:"center", marginTop:8 }}>
                <p style={{ fontSize:13, color:"#94a3b8", marginBottom:14 }}>
                  Showing {Math.min(allServices.length, 18)} of {allServices.length} services
                </p>
                <button onClick={() => upd("sort", "top_rated")} style={{
                  padding:"11px 28px", borderRadius:99,
                  border:"1.5px solid #2563eb", background:"#fff",
                  color:"#2563eb", fontSize:13, fontWeight:700, cursor:"pointer",
                  transition:"all 0.15s",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#2563eb";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#2563eb";}}>
                  View All {allServices.length} Services →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── filter drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => { if (e.target === e.currentTarget) setDrw(false); }}
            style={{
              position:"fixed", inset:0,
              background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)",
              zIndex:200, display:"flex", justifyContent:"flex-end",
            }}
          >
            <motion.div
              initial={{ x:340 }} animate={{ x:0 }} exit={{ x:340 }}
              transition={{ type:"spring", stiffness:320, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{
                width:320, background:"#fff", height:"100%",
                overflowY:"auto", boxShadow:"-8px 0 40px rgba(0,0,0,0.14)",
                padding:"24px 20px",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <span style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>Refine Results</span>
                <button onClick={() => setDrw(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <X style={{ width:18, height:18, color:"#64748b" }} />
                </button>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {/* category */}
                <div>
                  <label style={{ fontSize:11, fontWeight:800, color:"#374151", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Category</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {["", ...categories].map(c => (
                      <button key={c||"all"} onClick={() => upd("category", c)} style={{
                        padding:"5px 12px", borderRadius:99, fontSize:12, fontWeight:700,
                        border:"1.5px solid",
                        borderColor: f.category===c ? (c ? getCat(c).color : "#2563eb") : "#e2e8f0",
                        background: f.category===c ? (c ? getCat(c).bg : "#eff6ff") : "#fff",
                        color: f.category===c ? (c ? getCat(c).color : "#2563eb") : "#475569",
                        cursor:"pointer", display:"flex", alignItems:"center", gap:5,
                      }}>
                        {c ? <span>{getCat(c).emoji}</span> : "✨"} {c || "All"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* location */}
                <div>
                  <label style={{ fontSize:11, fontWeight:800, color:"#374151", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Location</label>
                  <select value={f.location} onChange={e => upd("location", e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#0f172a", background:"#fff", outline:"none", cursor:"pointer" }}>
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* sort */}
                <div>
                  <label style={{ fontSize:11, fontWeight:800, color:"#374151", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sort By</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => upd("sort", opt.value)} style={{
                        display:"flex", alignItems:"center", gap:10,
                        padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
                        border:"1.5px solid",
                        borderColor: f.sort===opt.value ? "#2563eb" : "#e2e8f0",
                        background: f.sort===opt.value ? "#eff6ff" : "#fff",
                        color: f.sort===opt.value ? "#2563eb" : "#475569",
                        cursor:"pointer", textAlign:"left",
                      }}>
                        <span style={{ fontSize:16 }}>{opt.icon}</span> {opt.label}
                        {f.sort===opt.value && <CheckCircle style={{ width:14,height:14,color:"#2563eb",marginLeft:"auto" }}/>}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                  {hasF && (
                    <button onClick={() => { clear(); setDrw(false); }} style={{
                      padding:"10px", border:"1.5px dashed #e2e8f0", borderRadius:10,
                      background:"none", fontSize:13, fontWeight:700,
                      color:"#64748b", cursor:"pointer",
                    }}>Clear All</button>
                  )}
                  <button onClick={() => setDrw(false)} style={{
                    padding:"12px", borderRadius:10, background:"#2563eb",
                    border:"none", color:"#fff", fontSize:14, fontWeight:700,
                    cursor:"pointer", boxShadow:"0 4px 14px rgba(37,99,235,0.3)",
                  }}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width:1024px) { .svc-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width:600px)  { .svc-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
