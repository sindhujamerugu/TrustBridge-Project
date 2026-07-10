import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Calendar, Shield, MessageCircle, ArrowLeft, X, ChevronRight, CheckCircle, Phone, Globe, Clock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { serviceAPI, bookingAPI, reviewAPI, getImageUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/ui/Cards";

// Category-appropriate fallback images for the detail page hero
const DETAIL_CAT_IMGS = {
  "Restaurants":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop",
 "Hostels":        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&h=600&fit=crop",
  "Grocery Stores": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1200&h=600&fit=crop",
  "Pharmacies":     "https://images.unsplash.com/photo-1583912086096-8c60d75a537f?w=1200&h=600&fit=crop",
  "Education":      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=600&fit=crop",
  "Transportation": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=600&fit=crop",
  "Salons":         "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
  "Laundry":        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1200&h=600&fit=crop",
  "Banks":          "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=1200&h=600&fit=crop",
  "Hospitals":      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop",
  "Medical":        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=600&fit=crop",
};
const IMG = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop";

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <div style={{ display:"flex",gap:4 }}>
        {[1,2,3,4,5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
            style={{ background:"none",border:"none",cursor:"pointer",padding:2,transition:"transform 0.1s" }}
            onMouseDown={e => e.currentTarget.style.transform="scale(0.9)"}
            onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          >
            <Star style={{
              width:28, height:28,
              color:  i <= (hover || value) ? "#f59e0b" : "#e2e8f0",
              fill:   i <= (hover || value) ? "#f59e0b" : "none",
              transition:"color 0.1s,fill 0.1s",
            }} />
          </button>
        ))}
      </div>
      {value === 0 && hover === 0 && (
        <p style={{ fontSize:11, color:"#94a3b8", margin:"4px 0 0" }}>Tap a star to rate</p>
      )}
    </div>
  );
}

function Modal({ show, onClose, title, children }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div initial={{ opacity:0,scale:0.96,y:16 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.96,y:16 }}
            style={{ background:"white",borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #e2e8f0" }}>
              <h3 style={{ fontSize:15,fontWeight:700,color:"#0f172a" }}>{title}</h3>
              <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}>
                <X style={{ width:16,height:16,color:"#64748b" }} />
              </button>
            </div>
            <div style={{ padding:"24px" }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function BookingModal({ show, onClose, svc, onBook }) {
  const [step, setStep]         = useState(0);
  const [booking, setB]         = useState({ date:"", time:"", notes:"" });
  const [submitting, setSubmit] = useState(false);
  const [bookErr, setBookErr]   = useState("");
  const steps = ["Date", "Time", "Notes", "Confirm"];

  // Reset every time the modal opens
  useEffect(() => {
    if (show) { setStep(0); setB({ date:"", time:"", notes:"" }); setSubmit(false); setBookErr(""); }
  }, [show]);

  const next = () => { setBookErr(""); setStep(s => Math.min(s+1, steps.length-1)); };
  const prev = () => { setBookErr(""); setStep(s => Math.max(s-1, 0)); };

  const confirm = async () => {
    setSubmit(true);
    setBookErr("");
    try {
      await onBook(booking);   // onBook handles toast + closing modal
    } catch (err) {
      // onBook re-throws on error so we can stay on the confirmation page
      setBookErr(err?.response?.data?.message || err?.message || "Booking failed. Please try again.");
    } finally {
      setSubmit(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={`Book ${svc?.title || ""}`}>
      {/* Progress dots */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:24 }}>
        {steps.map((s,i) => (
          <div key={s} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{
              width: i === step ? 28 : 8, height:8, borderRadius:999,
              background: i < step ? "#16a34a" : i === step ? "#2563eb" : "#e2e8f0",
              transition:"all 0.3s",
            }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize:12,fontWeight:700,color:"#64748b",textAlign:"center",marginBottom:16,textTransform:"uppercase",letterSpacing:"0.5px" }}>
        Step {step+1}: {steps[step]}
      </p>

      {/* Steps 0-2 use a form for keyboard submit; step 3 is review-only */}
      {step < 3 ? (
        <form onSubmit={e => { e.preventDefault(); next(); }} style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {step === 0 && (
            <div>
              <label className="lbl">Pick a Date</label>
              <input type="date" required value={booking.date} onChange={e => setB({...booking,date:e.target.value})}
                min={new Date().toISOString().split("T")[0]} className="field" />
            </div>
          )}
          {step === 1 && (
            <div>
              <label className="lbl">Pick a Time</label>
              <input type="time" required value={booking.time} onChange={e => setB({...booking,time:e.target.value})} className="field" />
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="lbl">Notes <span style={{ color:"#94a3b8",fontWeight:400 }}>(optional)</span></label>
              <textarea value={booking.notes} onChange={e => setB({...booking,notes:e.target.value})}
                className="field" style={{ resize:"none" }} rows={3} placeholder="Any special requests or instructions…" />
            </div>
          )}
          <div style={{ display:"flex",gap:10,paddingTop:4 }}>
            {step > 0 && (
              <button type="button" onClick={prev} className="btn btn-ghost" style={{ flex:1 }}>Back</button>
            )}
            <button type="submit" disabled={
              (step===0 && !booking.date)||(step===1 && !booking.time)
            } className="btn btn-primary" style={{ flex:1,justifyContent:"center" }}>
              Next <ChevronRight style={{ width:14,height:14 }} />
            </button>
          </div>
        </form>
      ) : (
        /* ── Step 3: Confirmation — no form, explicit button click only ── */
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ background:"#f8fafc",borderRadius:12,padding:"16px",border:"1.5px solid #e2e8f0" }}>
            <p style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12 }}>Booking Summary</p>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {[["Service",svc?.title],["Date",booking.date],["Time",booking.time],["Notes",booking.notes||"—"]].map(([l,v]) => (
                <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:13,gap:16 }}>
                  <span style={{ color:"#64748b",flexShrink:0 }}>{l}</span>
                  <span style={{ fontWeight:600,color:"#0f172a",textAlign:"right" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {bookErr && (
            <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,
              padding:"10px 14px",fontSize:12,color:"#dc2626",lineHeight:1.5 }}>
              {bookErr}
            </div>
          )}

          <div style={{ display:"flex",gap:10,paddingTop:4 }}>
            <button type="button" onClick={prev} disabled={submitting}
              className="btn btn-ghost" style={{ flex:1 }}>
              Back
            </button>
            <button type="button" onClick={confirm} disabled={submitting}
              className="btn btn-primary" style={{ flex:2,justifyContent:"center",gap:8 }}>
              {submitting ? (
                <>
                  <span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",
                    borderTopColor:"white",borderRadius:"50%",display:"inline-block",
                    animation:"spin 0.7s linear infinite",flexShrink:0 }}/>
                  Booking…
                </>
              ) : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Photo Upload component (optional, max 5) ────────────────────────────────
const ACCEPTED = ["image/jpeg","image/jpg","image/png","image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB per image

function PhotoUpload({ photos, setPhotos }) {
  const inp = useRef(null);

  const handleFiles = (files) => {
    if (!files?.length) return;
    const remaining = 5 - photos.length;
    if (remaining <= 0) { toast.error("Maximum 5 photos allowed"); return; }
    const toAdd = Array.from(files).slice(0, remaining);
    const valid = [];
    for (const file of toAdd) {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`${file.name}: Only JPG, PNG and WEBP allowed`); continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: File must be under 5 MB`); continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    if (valid.length) setPhotos(prev => [...prev, ...valid]);
  };

  const remove = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>
          Add Photos <span style={{ color:"#94a3b8", fontWeight:400 }}>(optional · max 5)</span>
        </label>
        {photos.length < 5 && (
          <button type="button" onClick={() => inp.current?.click()}
            style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700,
              color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe",
              borderRadius:7, padding:"4px 10px", cursor:"pointer" }}>
            + Add Photos
          </button>
        )}
        <input ref={inp} type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display:"none" }}
          onChange={e => handleFiles(e.target.files)}/>
      </div>

      {photos.length === 0 ? (
        <div
          onClick={() => inp.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{ border:"1.5px dashed #e2e8f0", borderRadius:10, padding:"18px",
            textAlign:"center", cursor:"pointer", background:"#f8fafc",
            transition:"border-color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor="#2563eb"}
          onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}>
          <p style={{ fontSize:20, margin:"0 0 4px" }}>📷</p>
          <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>
            Click or drag photos here · JPG, PNG, WEBP · Max 5 MB each
          </p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:9,
              overflow:"hidden", background:"#f1f5f9" }}>
              <img src={p.preview} alt={`preview ${i+1}`}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <button type="button" onClick={() => remove(i)}
                style={{ position:"absolute", top:3, right:3, width:18, height:18,
                  borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"none",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontSize:10, fontWeight:800, lineHeight:1 }}>
                ×
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <div onClick={() => inp.current?.click()}
              style={{ aspectRatio:"1", borderRadius:9, border:"1.5px dashed #e2e8f0",
                background:"#f8fafc", cursor:"pointer", display:"flex",
                alignItems:"center", justifyContent:"center", color:"#94a3b8",
                fontSize:20, transition:"border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#2563eb"}
              onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}>
              +
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Image Gallery with carousel ─────────────────────────────────────────────
function ImageGallery({ images, category, title }) {
  const validImgs = (images || [])
    .filter(u => u && !u.includes('placehold.co'))
    .map(getImageUrl);
  const fallback  = DETAIL_CAT_IMGS[category] || IMG;
  const allImgs   = validImgs.length > 0 ? validImgs : [fallback];

  const [active, setActive] = useState(0);
  const total = allImgs.length;

  const prev = () => setActive(i => (i - 1 + total) % total);
  const next = () => setActive(i => (i + 1) % total);

  // Keyboard navigation
  useEffect(() => {
    if (total <= 1) return;
    const handler = e => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total]);

  return (
    <div style={{ marginBottom:24 }}>
      {/* Main image */}
      <div style={{ position:'relative', borderRadius:20, overflow:'hidden',
        height:320, background:'#e2e8f0' }}>
        <img
          src={allImgs[active]}
          alt={`${title} — photo ${active+1} of ${total}`}
          style={{ width:'100%', height:'100%', objectFit:'cover',
            transition:'opacity 0.25s' }}
          onError={e => { e.target.src = fallback; }}
        />

        {/* Image counter badge */}
        <div style={{ position:'absolute', top:14, right:14,
          padding:'4px 12px', borderRadius:99,
          background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
          fontSize:12, fontWeight:700, color:'#fff' }}>
          {active+1} / {total}
        </div>

        {/* Prev / Next arrows — only when multiple images */}
        {total > 1 && (
          <>
            <button onClick={prev}
              style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
                background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:18, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.7)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.45)'}>
              ‹
            </button>
            <button onClick={next}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
                background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:18, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.7)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.45)'}>
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip — only when 2+ images */}
      {total > 1 && (
        <div style={{ display:'flex', gap:8, marginTop:10, overflowX:'auto',
          paddingBottom:4, scrollbarWidth:'none' }}>
          {allImgs.map((url, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{ flexShrink:0, width:72, height:54, borderRadius:10, overflow:'hidden',
                border:`2.5px solid ${i === active ? '#2563eb' : 'transparent'}`,
                padding:0, cursor:'pointer', transition:'border-color 0.15s',
                background:'#e2e8f0' }}>
              <img src={url} alt={`Thumbnail ${i+1}`}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { e.target.src = fallback; }}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Working Hours component ─────────────────────────────────────────────────
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function WorkingHours({ availability }) {
  if (!availability) return null;
  const hasAny = DAYS.some(d => availability[d]?.open || availability[d]?.closed);
  if (!hasAny) return null;

  const todayIdx = new Date().getDay(); // 0=Sun
  const today = DAYS[todayIdx === 0 ? 6 : todayIdx - 1];

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:9, background:"#fffbeb",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Clock style={{ width:15, height:15, color:"#d97706" }} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", margin:"0 0 8px",
          textTransform:"uppercase", letterSpacing:"0.04em" }}>Working Hours</p>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {DAYS.map(day => {
            const h = availability[day];
            if (!h) return null;
            const isToday = day === today;
            const label = day.charAt(0).toUpperCase() + day.slice(1);
            return (
              <div key={day} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"5px 10px", borderRadius:7,
                background: isToday ? "#fffbeb" : "transparent",
                border: isToday ? "1px solid #fde68a" : "1px solid transparent",
              }}>
                <span style={{ fontSize:12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? "#b45309" : "#64748b", width:110 }}>
                  {label}{isToday ? " (Today)" : ""}
                </span>
                <span style={{ fontSize:12, fontWeight:600,
                  color: h.closed ? "#94a3b8" : isToday ? "#b45309" : "#0f172a" }}>
                  {h.closed ? "Closed" : h.open && h.close ? `${h.open} – ${h.close}` : "Open"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Simple rejection screen ─────────────────────────────────────────────────
function RejectedState({ onEdit, onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 16px" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#fef2f2",
        border:"2px solid #fecaca", display:"flex", alignItems:"center",
        justifyContent:"center", margin:"0 auto 18px" }}>
        <X style={{ width:30, height:30, color:"#dc2626" }} />
      </div>
      <p style={{ fontSize:17, fontWeight:800, color:"#dc2626", margin:"0 0 8px" }}>
        Review Not Accepted
      </p>
      <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
        Your review could not be published.<br />
        Please review your content and try again.
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onEdit} style={{
          flex:1, padding:"12px", borderRadius:10,
          border:"1.5px solid #2563eb", background:"#fff",
          color:"#2563eb", fontSize:14, fontWeight:700, cursor:"pointer",
        }}>
          Edit Review
        </button>
        <button onClick={onClose} style={{
          flex:1, padding:"12px", borderRadius:10,
          border:"none", background:"#f1f5f9",
          color:"#475569", fontSize:14, fontWeight:700, cursor:"pointer",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const nav           = useNavigate();
  const [svc, setSvc]       = useState(null);
  const [reviews, setRevs]  = useState([]);
  const [loading, setLd]    = useState(true);
  const [revForm, setRevF]  = useState({ rating:0, content:"" });
  const [revPhotos, setRevPhotos] = useState([]); // { file, preview }[]
  const [showB, setShowB]   = useState(false);
  const [showR, setShowR]   = useState(false);
  const [sub, setSub]       = useState(false);
  // inline review feedback state
  const [revState, setRevState] = useState(null);
  // null | 'analyzing' | { type:'verified'|'suspicious'|'rejected', reason:string }

  useEffect(() => {
    Promise.all([serviceAPI.getById(id), reviewAPI.getByService(id)])
      .then(([s, r]) => { setSvc(s.data.data); setRevs(r.data.data); })
      .catch(() => toast.error("Service not found"))
      .finally(() => setLd(false));
  }, [id]);

  const openReviewModal = () => {
    setRevState(null);
    setRevF({ rating:0, content:"" });
    setRevPhotos([]);
    setShowR(true);
  };

  const closeReviewModal = () => {
    setShowR(false);
    setRevState(null);
    setRevF({ rating:0, content:"" });
    setRevPhotos([]);
  };

  const handleBook = async (booking) => {
    if (!user) { nav("/login"); return; }
    try {
      await bookingAPI.create({ serviceId:id, ...booking, recommendedBy:svc.recommendedBy?._id });
      toast.success("Booking created! Track it in My Bookings.");
      setShowB(false);
    } catch (err) {
      if (err.response?.status === 409) {
        const msg = "You already have a booking for this service at this date and time.";
        toast.error(msg);
        throw new Error(msg);
      } else {
        const msg = err.response?.data?.message || "Booking failed";
        toast.error(msg);
        throw err;
      }
    }
  };

  const handleRev = async (e) => {
    e.preventDefault();
    if (!user) { nav("/login"); return; }
    setSub(true);
    setRevState("analyzing");
    try {
      const { data } = await reviewAPI.create({
        serviceId: id,
        ...revForm,
        images: revPhotos.map(p => p.file),
      });
      // Always verified now (binary flow — no suspicious state)
      setRevState({ type:"verified" });
      const r = await reviewAPI.getByService(id);
      setRevs(r.data.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setRevState({ type:"already_reviewed" });
      } else if (err.response?.status === 400) {
        const reason = err.response?.data?.reason;
        setRevState({ type: reason === 'unrelated_to_service' ? 'unrelated' : 'rejected' });
      } else {
        setRevState({ type:"error" });
      }
    } finally { setSub(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!svc) return null;

  return (
    <div className="wrap" style={{ paddingTop:28,paddingBottom:48,fontFamily:"Inter,system-ui,sans-serif" }}>
      <Link to="/services" style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"#64748b",fontWeight:600,textDecoration:"none",marginBottom:20,transition:"color 0.15s" }}
        onMouseEnter={e=>e.currentTarget.style.color="#2563eb"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>
        <ArrowLeft style={{ width:14,height:14 }} /> Back to Services
      </Link>

      {/* Image Gallery */}
      <ImageGallery images={svc.images} category={svc.category} title={svc.title} />

      {/* 2-col layout */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 360px",gap:24,alignItems:"start" }} className="detail-grid">

        {/* Left col */}
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
          {/* Title + meta */}
          <div style={{ background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ background:"#dbeafe",color:"#1d4ed8",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,display:"inline-block",marginBottom:10 }}>
              {svc.category}
            </span>
            <h1 style={{ fontSize:22,fontWeight:800,color:"#0f172a",marginBottom:10,lineHeight:1.2 }}>{svc.title}</h1>
            <div style={{ display:"flex",flexWrap:"wrap",gap:16,fontSize:13,color:"#64748b",marginBottom:16 }}>
              <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                <MapPin style={{ width:14,height:14 }} />{svc.location}
              </span>
              <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                <Star style={{ width:14,height:14,color:"#f59e0b",fill:"#f59e0b" }} />
                <strong style={{ color:"#0f172a" }}>{svc.averageRating?.toFixed(1) || "New"}</strong>
                <span style={{ color:"#94a3b8" }}>({svc.totalReviews || 0} reviews)</span>
              </span>
            </div>
            <p style={{ fontSize:14,color:"#64748b",lineHeight:1.7 }}>{svc.description}</p>
          </div>

          {/* Contact Information */}
          {(svc.contactNumber || svc.address || svc.businessEmail || svc.website || svc.availability) && (
            <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 18px" }}>Contact Information</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                {/* Phone */}
                {svc.contactNumber && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Phone style={{ width:15, height:15, color:"#16a34a" }} />
                      </div>
                      <div>
                        <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Phone</p>
                        <p style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>{svc.contactNumber}</p>
                      </div>
                    </div>
                    <a href={`tel:${svc.contactNumber}`} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                      borderRadius:99, background:"#16a34a", color:"#fff",
                      fontSize:12, fontWeight:700, textDecoration:"none",
                      transition:"background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background="#15803d"}
                      onMouseLeave={e => e.currentTarget.style.background="#16a34a"}>
                      <Phone style={{ width:12, height:12 }} /> Call Now
                    </a>
                  </div>
                )}

                {/* Address */}
                {(svc.address || svc.location) && (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MapPin style={{ width:15, height:15, color:"#2563eb" }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Address</p>
                      <p style={{ fontSize:14, color:"#0f172a", margin:"0 0 4px", lineHeight:1.5 }}>{svc.address || svc.location}</p>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent((svc.address || svc.title) + ' ' + svc.location)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:12, fontWeight:600, color:"#2563eb", textDecoration:"none" }}>
                        Get Directions →
                      </a>
                    </div>
                  </div>
                )}

                {/* Working Hours */}
                <WorkingHours availability={svc.availability} />

                {/* Email */}
                {svc.businessEmail && (
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"#faf5ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Mail style={{ width:15, height:15, color:"#7c3aed" }} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Email</p>
                      <a href={`mailto:${svc.businessEmail}`} style={{ fontSize:14, fontWeight:600, color:"#2563eb", textDecoration:"none" }}>
                        {svc.businessEmail}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {svc.website && (
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"#f0f9ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Globe style={{ width:15, height:15, color:"#0891b2" }} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Website</p>
                      <a href={svc.website.startsWith('http') ? svc.website : `https://${svc.website}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:14, fontWeight:600, color:"#2563eb", textDecoration:"none" }}>
                        {svc.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Recommended by */}
          {svc.recommendedBy && (
            <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:14 }}>
              <div style={{ width:36,height:36,borderRadius:10,background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Shield style={{ width:16,height:16,color:"#16a34a" }} />
              </div>
              <div>
                <p style={{ fontSize:13,fontWeight:700,color:"#14532d" }}>Recommended by a Verified Local Guide</p>
                <p style={{ fontSize:12,color:"#16a34a",marginTop:2 }}>{svc.recommendedBy.name}</p>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div style={{ background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:"#0f172a" }}>Reviews ({reviews.length})</h2>
              {user && (() => {
                const userReviewed = reviews.some(r => r.user?._id === user._id || r.user === user._id);
                return userReviewed ? (
                  <span style={{ fontSize:12, fontWeight:600, color:"#16a34a",
                    display:"flex", alignItems:"center", gap:4 }}>
                    <CheckCircle style={{ width:13, height:13 }} /> Review Submitted
                  </span>
                ) : (
                  <button onClick={openReviewModal} className="btn btn-secondary btn-sm">Write a Review</button>
                );
              })()}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {reviews.map((rv) => (
                <div key={rv._id} style={{ padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:"#dbeafe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#2563eb",flexShrink:0 }}>
                      {rv.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <p style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>{rv.user?.name}</p>
                        {/* Verified review badge — shown for all public reviews (already filtered to verified only) */}
                        <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"1px 7px",borderRadius:99 }}>
                          <CheckCircle style={{ width:9,height:9 }}/> Verified Review
                        </span>
                      </div>
                      <div style={{ display:"flex",gap:2,marginTop:2 }}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} style={{ width:11,height:11,color: i<=rv.rating?"#f59e0b":"#e2e8f0",fill: i<=rv.rating?"#f59e0b":"none" }} />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize:11,color:"#94a3b8",marginLeft:"auto" }}>
                      {new Date(rv.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                    </span>
                  </div>
                  <p style={{ fontSize:13,color:"#64748b",lineHeight:1.6 }}>{rv.content}</p>
                  {/* Review photos */}
                  {rv.images?.length > 0 && (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>
                      {rv.images.map((url, imgIdx) => (
                        <a key={imgIdx} href={getImageUrl(url)} target="_blank" rel="noopener noreferrer"
                          style={{ display:"block", width:80, height:80, borderRadius:8,
                            overflow:"hidden", background:"#f1f5f9", flexShrink:0 }}>
                          <img src={getImageUrl(url)} alt={`Review photo ${imgIdx+1}`}
                            style={{ width:"100%", height:"100%", objectFit:"cover",
                              transition:"transform 0.2s" }}
                            onMouseEnter={e => e.target.style.transform="scale(1.05)"}
                            onMouseLeave={e => e.target.style.transform="scale(1)"}/>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p style={{ textAlign:"center",fontSize:13,color:"#94a3b8",padding:"24px 0" }}>No reviews yet — be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky booking card */}
        <div style={{ position:"sticky",top:80 }}>
          <div style={{ background:"white",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"22px 24px",boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
            {svc.price > 0 ? (
              <>
                <div style={{ fontSize:26,fontWeight:800,color:"#0f172a",lineHeight:1 }}>₹{svc.price.toLocaleString()}</div>
                <p style={{ fontSize:12,color:"#94a3b8",marginBottom:18,marginTop:2 }}>{svc.priceUnit || "per service"}</p>
              </>
            ) : (
              <div style={{ fontSize:18,fontWeight:800,color:"#16a34a",marginBottom:18 }}>Free Service</div>
            )}
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
              <button onClick={() => user ? setShowB(true) : nav("/login")} className="btn btn-primary" style={{ justifyContent:"center",padding:"12px" }}>
                <Calendar style={{ width:15,height:15 }} /> Book Now
              </button>
              {svc.contactNumber && (
                <a href={`tel:${svc.contactNumber}`} className="btn btn-secondary" style={{ justifyContent:"center",padding:"11px",textDecoration:"none" }}>
                  <Phone style={{ width:15,height:15 }} /> Call {svc.contactNumber}
                </a>
              )}
              {svc.recommendedBy && user?.role === "newcomer" && (
                <Link to={`/chat?resident=${svc.recommendedBy._id}`} className="btn btn-secondary" style={{ justifyContent:"center",padding:"11px",textDecoration:"none" }}>
                  <MessageCircle style={{ width:15,height:15 }} /> Chat with Guide
                </Link>
              )}
            </div>
            <div style={{ borderTop:"1px solid #e2e8f0",paddingTop:16,display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#64748b" }}>
                <MapPin style={{ width:13,height:13,color:"#94a3b8" }} />{svc.address || svc.location}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#64748b" }}>
                <Calendar style={{ width:13,height:13,color:"#94a3b8" }} />{svc.totalBookings || 0} bookings completed
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#64748b" }}>
                <Star style={{ width:13,height:13,color:"#f59e0b",fill:"#f59e0b" }} />
                {svc.averageRating?.toFixed(1) || "New"} average rating
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal show={showB} onClose={() => setShowB(false)} svc={svc} onBook={handleBook} />

      {/* Review Modal — with inline AI feedback */}
      <Modal show={showR} onClose={closeReviewModal} title="Write a Review">

        {/* ── ANALYZING STATE ── */}
        {revState === "analyzing" && (
          <div style={{ textAlign:"center", padding:"32px 16px" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"#eff6ff",
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px",
              animation:"spin 1.2s linear infinite" }}>
              <Shield style={{ width:24, height:24, color:"#2563eb" }} />
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>
              Submitting your review…
            </p>
            <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
              Please wait a moment.
            </p>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* ── VERIFIED STATE ── */}
        {revState?.type === "verified" && (
          <div style={{ textAlign:"center", padding:"32px 16px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4",
              border:"2px solid #bbf7d0", display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 18px" }}>
              <CheckCircle style={{ width:30, height:30, color:"#16a34a" }} />
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:"#15803d", margin:"0 0 8px" }}>
              Review Submitted Successfully
            </p>
            <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
              Thank you for sharing your experience.
            </p>
            <button onClick={closeReviewModal} style={{
              width:"100%", padding:"12px", borderRadius:10, border:"none",
              background:"#16a34a", color:"#fff", fontSize:14, fontWeight:700,
              cursor:"pointer",
            }}>
              Done
            </button>
          </div>
        )}

        {/* ── SUSPICIOUS STATE ── */}
        {revState?.type === "suspicious" && (
          <div style={{ textAlign:"center", padding:"28px 16px" }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"#fffbeb",
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px",
              border:"2px solid #fde68a" }}>
              <span style={{ fontSize:26 }}>🔍</span>
            </div>
            <p style={{ fontSize:16, fontWeight:800, color:"#b45309", margin:"0 0 8px" }}>
              Sent for Verification
            </p>
            <p style={{ fontSize:13, color:"#64748b", margin:"0 0 20px", lineHeight:1.6 }}>
              Your review has been submitted and is being reviewed by our moderation team. It will appear once verified.
            </p>
            <button onClick={closeReviewModal} className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }}>
              OK, Got it
            </button>
          </div>
        )}

        {/* ── ALREADY REVIEWED STATE ── */}
        {revState?.type === "already_reviewed" && (
          <div style={{ textAlign:"center", padding:"32px 16px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#eff6ff",
              border:"2px solid #bfdbfe", display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 18px", fontSize:30 }}>
              📋
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:"#1d4ed8", margin:"0 0 8px" }}>
              Review Already Submitted
            </p>
            <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.7 }}>
              You have already submitted a review for this service.<br />
              Each service accepts only one review per customer.
            </p>
            <button onClick={closeReviewModal} style={{
              width:"100%", padding:"12px", borderRadius:10, border:"none",
              background:"#2563eb", color:"#fff", fontSize:14, fontWeight:700,
              cursor:"pointer",
            }}>
              Close
            </button>
          </div>
        )}

        {/* ── UNRELATED REVIEW STATE ── */}
        {revState?.type === "unrelated" && (
          <div style={{ textAlign:"center", padding:"32px 16px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#fffbeb",
              border:"2px solid #fde68a", display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 18px", fontSize:30 }}>
              🔗
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:"#b45309", margin:"0 0 8px" }}>
              Review Not Accepted
            </p>
            <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.7 }}>
              Please ensure your review is related to the service you are reviewing.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setRevState(null)} style={{
                flex:1, padding:"12px", borderRadius:10,
                border:"1.5px solid #d97706", background:"#fff",
                color:"#b45309", fontSize:14, fontWeight:700, cursor:"pointer",
              }}>
                Edit Review
              </button>
              <button onClick={closeReviewModal} style={{
                flex:1, padding:"12px", borderRadius:10,
                border:"none", background:"#f1f5f9",
                color:"#475569", fontSize:14, fontWeight:700, cursor:"pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── REJECTED STATE ── */}
        {(revState?.type === "rejected" || revState?.type === "duplicate") && (
          <RejectedState
            onEdit={() => setRevState(null)}
            onClose={closeReviewModal}
          />
        )}

        {/* ── BACKEND ERROR STATE ── */}
        {revState?.type === "error" && (
          <div style={{ textAlign:"center", padding:"32px 16px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#fef2f2",
              border:"2px solid #fecaca", display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 18px" }}>
              <span style={{ fontSize:28 }}>⚠️</span>
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:"#dc2626", margin:"0 0 8px" }}>
              Something Went Wrong
            </p>
            <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
              We couldn't submit your review right now.<br/>Please try again in a moment.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setRevState(null)} style={{
                flex:1, padding:"12px", borderRadius:10,
                border:"1.5px solid #2563eb", background:"#fff",
                color:"#2563eb", fontSize:14, fontWeight:700, cursor:"pointer",
              }}>Try Again</button>
              <button onClick={closeReviewModal} style={{
                flex:1, padding:"12px", borderRadius:10,
                border:"none", background:"#f1f5f9",
                color:"#475569", fontSize:14, fontWeight:700, cursor:"pointer",
              }}>Close</button>
            </div>
          </div>
        )}

        {/* ── FORM STATE (default) ── */}
        {!revState && (
          <form onSubmit={handleRev} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label className="lbl">Your Rating</label>
              <StarInput value={revForm.rating} onChange={v => setRevF({...revForm,rating:v})} />
              {revForm.rating === 0 && (
                <p style={{ fontSize:11, color:"#ef4444", margin:"4px 0 0" }}>Please select a star rating</p>
              )}
            </div>
            <div>
              <label className="lbl">Your Review</label>
              <textarea required value={revForm.content} onChange={e => setRevF({...revForm,content:e.target.value})}
                className="field" style={{ resize:"none" }} rows={4} placeholder="Share your experience…" />
            </div>
            {/* ── Optional photo upload ── */}
            <PhotoUpload photos={revPhotos} setPhotos={setRevPhotos} />
            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={closeReviewModal} className="btn btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button type="submit" disabled={sub || revForm.rating === 0} className="btn btn-primary" style={{ flex:1, justifyContent:"center" }}>
                {sub ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <style>{`
        @media (max-width:900px) { .detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
