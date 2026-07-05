import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Calendar, TrendingUp, CreditCard, Plus, X,
  Eye, EyeOff, CheckCircle, Clock, AlertCircle, Upload,
  FileText, ChevronRight, ChevronLeft, Loader2, Star, ArrowRight,
  Shield, Zap, Award, Trash2, Edit, Camera, Image, MapPin, Phone, Mail, Globe,
  ZoomIn, ZoomOut, Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { providerAPI, serviceAPI, bookingAPI, paymentAPI, authAPI, getImageUrl } from "../../services/api";
import api from "../../services/api";
import { LoadingSpinner, EmptyState } from "../../components/ui/Cards";
import { useAuth } from "../../context/AuthContext";

// Returns true for real images (data: URLs, CDN URLs, or local /uploads/ paths), false for placeholders
function isRealImage(url) {
  if (!url) return false;
  if (url.startsWith('data:')) return true;
  if (url.startsWith('/uploads/')) return true;
  if (url.includes('placehold.co')) return false;
  return url.startsWith('http');
}


/* ── constants ── */
const CATS = ["Medical","Clinics","Grocery Stores","Restaurants","Hostels","Pharmacies","Education","Transportation"];
const LOCS = ["Bachupally","Miyapur","Secunderabad"];
const TABS = ["Services","Bookings","Analytics"];

const WORKFLOW_LABELS = {
  draft:          { label:"Draft",             color:"#94a3b8", bg:"#f1f5f9" },
  docs_pending:   { label:"Docs Needed",       color:"#d97706", bg:"#fffbeb" },
  docs_uploaded:  { label:"Docs Uploaded",     color:"#2563eb", bg:"#eff6ff" },
  verifying:      { label:"Verifying…",        color:"#7c3aed", bg:"#faf5ff" },
  verified:       { label:"Docs Verified",     color:"#16a34a", bg:"#f0fdf4" },
  payment_pending:{ label:"Payment Needed",    color:"#d97706", bg:"#fffbeb" },
  admin_review:   { label:"Under Review",      color:"#2563eb", bg:"#eff6ff" },
  published:      { label:"Published",         color:"#16a34a", bg:"#f0fdf4" },
  rejected:       { label:"Rejected",          color:"#dc2626", bg:"#fef2f2" },
  paused:         { label:"Paused",            color:"#64748b", bg:"#f8fafc" },
};

// Plans are loaded from backend — these are fallback dev prices only
// Real prices come from GET /payments/plans which uses NODE_ENV to pick correct prices
const PLANS_STATIC_DEFAULT = [
  {
    key: "basic",   name: "Basic",   priceNum: 8,    price: "₹8",    period: "/month",
    highlight: false, badge: null,
    features: ["Service listing","Standard visibility","Email support","Up to 5 bookings/month"],
  },
  {
    key: "growth",  name: "Growth",  priceNum: 10,   price: "₹10",   period: "/month",
    highlight: true,  badge: "Popular",
    features: ["Priority listing","Analytics dashboard","Featured badge","Unlimited bookings","Phone support"],
  },
  {
    key: "premium", name: "Premium", priceNum: 15,   price: "₹15",   period: "/month",
    highlight: false, badge: "Best Value",
    features: ["Top placement","Unlimited bookings","Premium support","Featured badge","Advanced analytics","Custom profile page"],
  },
];

// Hook to load live plans from backend
function usePlans() {
  const [plans, setPlans] = useState(PLANS_STATIC_DEFAULT);
  useEffect(() => {
    paymentAPI.getPlans().then(({ data }) => {
      if (data.data) {
        const mapped = Object.entries(data.data).map(([key, p], i) => ({
          key,
          name:     p.name,
          priceNum: p.price,
          price:    `₹${p.price}`,
          period:   "/month",
          highlight: key === "growth",
          badge:    key === "growth" ? "Popular" : key === "premium" ? "Best Value" : null,
          features: p.features || [],
        }));
        setPlans(mapped);
      }
    }).catch(() => {/* use defaults */});
  }, []);
  return plans;
}

const PLANS_STATIC = PLANS_STATIC_DEFAULT; // kept for components that can't use hooks

/* ─── Step 1: Basic Info ─── */
function StepBasicInfo({ data, onChange, onNext }) {
  const [f, setF] = useState(data);
  const upd = (k, v) => { const n = {...f,[k]:v}; setF(n); onChange(n); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Service Name *</label>
        <input required value={f.title} onChange={e=>upd("title",e.target.value)}
          placeholder="e.g. Apollo Clinic Bachupally, Sri Sai PG Hostel"
          className="field text-sm"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Category *</label>
          <select value={f.category} onChange={e=>upd("category",e.target.value)} className="field text-sm">
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Location *</label>
          <select value={f.location} onChange={e=>upd("location",e.target.value)} className="field text-sm">
            {LOCS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Full Address</label>
        <input value={f.address||""} onChange={e=>upd("address",e.target.value)}
          placeholder="e.g. Plot 42, Kondapur Road, Bachupally" className="field text-sm"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Contact Number *</label>
          <input value={f.contactNumber||""} onChange={e=>upd("contactNumber",e.target.value)}
            placeholder="+91 XXXXX XXXXX" className="field text-sm"/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Business Email</label>
          <input type="email" value={f.businessEmail||""} onChange={e=>upd("businessEmail",e.target.value)}
            placeholder="business@example.com" className="field text-sm"/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Price (₹)</label>
          <input type="number" min={0} value={f.price||0} onChange={e=>upd("price",Number(e.target.value))}
            className="field text-sm"/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Website (optional)</label>
          <input value={f.website||""} onChange={e=>upd("website",e.target.value)}
            placeholder="https://www.example.com" className="field text-sm"/>
        </div>
      </div>
      <div>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Description *</label>
        <textarea required rows={3} value={f.description||""} onChange={e=>upd("description",e.target.value)}
          placeholder="Describe your service clearly — what you offer, who it's for, and what makes it trustworthy."
          className="field resize-none text-sm"/>
      </div>
      <button onClick={onNext} disabled={!f.title||!f.description||!f.contactNumber}
        style={{width:"100%",padding:"12px",borderRadius:10,background:(!f.title||!f.description||!f.contactNumber)?"#e2e8f0":"#2563eb",
          color:(!f.title||!f.description||!f.contactNumber)?"#94a3b8":"white",border:"none",fontSize:14,fontWeight:700,cursor:(!f.title||!f.description||!f.contactNumber)?"not-allowed":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        Next: Upload Documents <ChevronRight style={{width:16,height:16}}/>
      </button>
    </div>
  );
}


/* ─── Step 1.5: Service Photos ─── */
function StepPhotos({ serviceId, images, setImages, onNext, onSkip }) {
  const [uploading, setUploading] = useState(false);
  const inp = useRef(null);

  const addFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 10 - images.length).forEach(f => fd.append("images", f));
      const { data } = await serviceAPI.uploadImages(serviceId, fd);
      setImages(data.data.images || []);
      toast.success("Photos uploaded!");
    } catch(e) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const removeImage = async (url) => {
    try {
      const { data } = await serviceAPI.deleteImage(serviceId, url);
      setImages(data.data.images || []);
    } catch(e) { toast.error("Could not remove image"); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#0369a1",lineHeight:1.65}}>
        Photos help newcomers trust your service. Add up to 10 clear photos — this step is optional but recommended.
      </div>

      {/* Upload area */}
      <div style={{border:"2px dashed #cbd5e1",borderRadius:12,padding:"24px",textAlign:"center",cursor:"pointer",background:"#fafafa"}}
        onClick={()=>inp.current?.click()}
        onDragOver={e=>{e.preventDefault();}}
        onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);}}>
        <input ref={inp} type="file" multiple accept="image/jpeg,image/png,image/webp" style={{display:"none"}}
          onChange={e=>addFiles(e.target.files)}/>
        <Camera style={{width:32,height:32,color:"#94a3b8",margin:"0 auto 10px"}}/>
        <p style={{fontSize:13,fontWeight:600,color:"#374151",margin:"0 0 4px"}}>
          {uploading ? "Uploading…" : "Click or drag photos here"}
        </p>
        <p style={{fontSize:11,color:"#94a3b8",margin:0}}>JPEG, PNG, WebP · Max 5 MB each · Up to 10 photos</p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {images.map((url, i) => (
            <div key={url} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"4/3",background:"#f1f5f9"}}>
              <img src={url} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}
                onError={e=>{
                  console.warn('[TrustBridge] Upload preview failed to load:', e.target.src);
                  e.target.style.display='none';
                }}
              />
              {i === 0 && <span style={{position:"absolute",top:6,left:6,fontSize:10,fontWeight:700,background:"#2563eb",color:"white",padding:"2px 7px",borderRadius:999}}>Cover</span>}
              <button onClick={()=>removeImage(url)}
                style={{position:"absolute",top:5,right:5,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X style={{width:12,height:12,color:"white"}}/>
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:10}}>
        <button onClick={onSkip} style={{flex:1,padding:"11px",borderRadius:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          Skip for now
        </button>
        <button onClick={onNext} style={{flex:2,padding:"12px",borderRadius:10,background:"#2563eb",color:"white",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          {images.length > 0 ? `Continue with ${images.length} photo${images.length>1?"s":""}` : "Continue"} <ChevronRight style={{width:16,height:16}}/>
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Document Upload ─── */
function DocUploadField({ label, name, required, optional, file, onFile, hint }) {
  const inp = useRef(null);
  return (
    <div style={{border:"1.5px dashed "+(file?"#16a34a":optional?"#c7d2fe":"#cbd5e1"),borderRadius:10,
      padding:"12px 14px",background:file?"#f0fdf4":optional?"#f5f7ff":"#fafafa",
      transition:"all 0.2s",cursor:"pointer"}}
      onClick={()=>inp.current?.click()}>
      <input ref={inp} type="file" accept="image/*,.pdf" style={{display:"none"}}
        onChange={e=>onFile(name, e.target.files[0])}/>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:8,
          background:file?"#dcfce7":optional?"#e0e7ff":"#e2e8f0",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {file ? <CheckCircle style={{width:17,height:17,color:"#16a34a"}}/> : <Upload style={{width:17,height:17,color:optional?"#6366f1":"#94a3b8"}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:13,fontWeight:600,color:"#0f172a",margin:"0 0 1px"}}>
            {label}
            {required && <span style={{color:"#dc2626",fontSize:11,marginLeft:4}}>Required</span>}
            {optional && <span style={{color:"#6366f1",fontSize:11,marginLeft:4,fontWeight:500}}>Optional</span>}
          </p>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
            {file ? file.name : hint || "Click to upload — JPEG, PNG or PDF"}
          </p>
        </div>
        {file && <button onClick={e=>{e.stopPropagation();onFile(name,null);}}
          style={{background:"none",border:"none",cursor:"pointer",padding:2,flexShrink:0}}>
          <X style={{width:14,height:14,color:"#94a3b8"}}/>
        </button>}
      </div>
    </div>
  );
}

function StepDocuments({ category, serviceId, onNext }) {
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);

  const setFile = (name, f) => setFiles(prev => ({...prev,[name]:f}));

  // Identity: must upload at least one (aadhaar OR pan)
  const hasIdentity = files.aadhaar || files.pan;

  const submit = async () => {
    if (!hasIdentity) {
      toast.error("Please upload at least one identity document — Aadhaar or PAN card");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(files).forEach(([k,v]) => { if(v) fd.append(k, v); });
      await serviceAPI.uploadDocuments(serviceId, fd);
      toast.success("Documents uploaded! AI verification in progress…");
      onNext();
    } catch(e) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const runOcrDebug = async () => {
    const identityFile = files.aadhaar || files.pan;
    if (!identityFile) { toast.error("Upload an identity document first"); return; }
    const fieldName = files.aadhaar ? "aadhaar" : "pan";
    toast("Running OCR debug scan…", { icon: "🔍" });
    try {
      const fd = new FormData();
      fd.append(fieldName, identityFile);
      const resp = await fetch("/api/services/ocr-debug", { method: "POST", body: fd });
      const data = await resp.json();
      const d = data.data ?? data;
      console.group("🔍 OCR Debug Result");
      console.log("Confidence:", d.ocr?.confidence?.toFixed(1) + "%");
      console.log("Text length:", d.ocr?.textLength, "chars");
      console.log("Raw OCR text:\n", d.ocr?.rawText);
      console.log("Pattern matches:", d.patterns);
      console.log("Content score:", d.contentScore);
      console.log("Diagnosis:", d.diagnosis);
      console.groupEnd();
      toast.success(
        `OCR ${d.ocr?.confidence?.toFixed(1)}% | ` +
        `${d.ocr?.textLength} chars | ` +
        `Num: ${d.patterns?.aadhaarNumber ? "✔" : "✘"} ` +
        `KW: ${d.patterns?.aadhaarKeyword ? "✔" : "✘"} ` +
        `Score: ${d.contentScore}`,
        { duration: 8000 }
      );
    } catch(e) {
      console.error("OCR debug failed:", e);
      toast.error("OCR debug failed — check console");
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Info banner */}
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,
        padding:"12px 14px",fontSize:12,color:"#1e40af",lineHeight:1.65}}>
        <strong>Identity verification is required</strong> to publish your service.
        Business documents are optional — uploading them earns a
        <strong> Business Verified</strong> badge that increases trust with newcomers.
      </div>

      {/* ── Required: Identity ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Shield style={{width:14,height:14,color:"#dc2626"}}/>
          <span style={{fontSize:12,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:"0.06em"}}>
            Identity Verification (Required — upload at least one)
          </span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <DocUploadField name="aadhaar" label="Aadhaar Card" required
            hint="Upload front side — used for identity & name verification"
            file={files.aadhaar} onFile={setFile}/>
          <DocUploadField name="pan" label="PAN Card" required
            hint="PAN format: ABCDE1234F — used for identity verification"
            file={files.pan} onFile={setFile}/>
        </div>
        {!hasIdentity && (
          <p style={{fontSize:11,color:"#dc2626",margin:"6px 0 0",paddingLeft:2}}>
            ↑ Upload Aadhaar OR PAN (or both) to continue
          </p>
        )}
        {hasIdentity && (
          <p style={{fontSize:11,color:"#16a34a",margin:"6px 0 0",paddingLeft:2}}>
            ✔ Identity document selected
          </p>
        )}
      </div>

      {/* ── Optional: Business ── */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Award style={{width:14,height:14,color:"#6366f1"}}/>
          <span style={{fontSize:12,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:"0.06em"}}>
            Business Verification (Optional — earns Business Verified badge)
          </span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <DocUploadField name="gst" label="GST Certificate" optional
            hint="GSTIN format required — for businesses registered under GST"
            file={files.gst} onFile={setFile}/>
          <DocUploadField name="businessLicense" label="Business License" optional
            hint="Municipal / trade license issued by local authority"
            file={files.businessLicense} onFile={setFile}/>
          <DocUploadField name="registrationCert" label="Registration Certificate" optional
            hint="Company / LLP / Shop registration certificate"
            file={files.registrationCert} onFile={setFile}/>
        </div>
      </div>

      {/* Debug button — shows OCR output in browser console + toast */}
      {hasIdentity && (
        <button onClick={runOcrDebug}
          style={{width:"100%",padding:"9px",borderRadius:10,background:"#f8fafc",
            border:"1.5px solid #e2e8f0",color:"#64748b",fontSize:12,fontWeight:600,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          🔍 Test OCR (debug — check browser console)
        </button>
      )}

      <button onClick={submit} disabled={uploading || !hasIdentity}
        style={{width:"100%",padding:"12px",borderRadius:10,
          background:(uploading||!hasIdentity)?"#e2e8f0":"#2563eb",
          color:(uploading||!hasIdentity)?"#94a3b8":"white",
          border:"none",fontSize:14,fontWeight:700,
          cursor:(uploading||!hasIdentity)?"not-allowed":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        {uploading
          ? <><Loader2 style={{width:16,height:16,animation:"spin 1s linear infinite"}}/> Uploading…</>
          : "Upload & Verify Documents"}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>
    </div>
  );
}

/* ─── Step 3: AI Verification Result ─── */
const DOC_LABELS_MAP = {
  aadhaar: "Aadhaar Card", pan: "PAN Card", gst: "GST Certificate",
  businessLicense: "Business License", registrationCert: "Registration Certificate",
};
const IDENTITY_TYPES = new Set(["aadhaar","pan"]);

function DocResultRow({ docType, r }) {
  const label    = DOC_LABELS_MAP[docType] || docType;
  const isOpt    = !IDENTITY_TYPES.has(docType);
  const isHard   = r.hardFailed;
  const passed   = r.passed;
  const bg       = isHard ? "#fef2f2" : passed ? "#f0fdf4" : isOpt ? "#fafafa" : "#fffbeb";
  const border   = isHard ? "#fecaca" : passed ? "#bbf7d0" : isOpt ? "#e2e8f0" : "#fde68a";
  const dotColor = isHard ? "#dc2626" : passed ? "#16a34a" : isOpt ? "#94a3b8" : "#d97706";

  return (
    <div style={{border:`1.5px solid ${border}`,borderRadius:10,background:bg,
      padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
        <span style={{fontWeight:700,fontSize:13,color:"#0f172a",flex:1}}>{label}</span>
        {isOpt && <span style={{fontSize:10,color:"#6366f1",fontWeight:600,
          background:"#e0e7ff",padding:"1px 7px",borderRadius:999}}>Optional</span>}
        {r.detectedType && r.detectedType !== "unknown" && (
          <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
            background: r.typeMatch ? "#dcfce7" : "#fee2e2",
            color:      r.typeMatch ? "#15803d" : "#b91c1c"}}>
            {r.typeMatch ? `✔ ${r.detectedType}` : `✘ detected: ${r.detectedType}`}
          </span>
        )}
        <span style={{fontSize:12,fontWeight:800,color:dotColor}}>{r.compositeScore}/100</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontWeight:600}}>
          OCR {r.ocrConfidence}% · {r.ocrProvider}
        </span>
        <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"2px 8px",borderRadius:6,fontWeight:600}}>
          Format {r.validationScore}/100
        </span>
        {r.matchScore > 0 && (
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,fontWeight:600,
            background: r.matchScore >= 60 ? "#dcfce7" : "#fee2e2",
            color:      r.matchScore >= 60 ? "#15803d" : "#b91c1c"}}>
            Name match {r.matchScore}%
          </span>
        )}
      </div>
      {r.extractedFields && Object.keys(r.extractedFields).length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {r.extractedFields.name && (
            <span style={{fontSize:11,color:"#334155",background:"#e2e8f0",padding:"2px 8px",borderRadius:6}}>
              👤 {r.extractedFields.name}
            </span>
          )}
          {r.extractedFields.documentNumber && (
            <span style={{fontSize:11,color:"#334155",background:"#e2e8f0",padding:"2px 8px",borderRadius:6}}>
              🔒 {"·".repeat(Math.max(0,r.extractedFields.documentNumber.length-4))}{r.extractedFields.documentNumber.slice(-4)}
            </span>
          )}
          {r.extractedFields.dob && (
            <span style={{fontSize:11,color:"#334155",background:"#e2e8f0",padding:"2px 8px",borderRadius:6}}>
              📅 {r.extractedFields.dob}
            </span>
          )}
        </div>
      )}
      {r.failures?.length > 0 && (
        <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:3}}>
          {r.failures.map((f, i) => (
            <li key={i} style={{fontSize:11,color:isHard ? "#b91c1c" : isOpt ? "#64748b" : "#92400e"}}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VerificationLevelBadge({ level, identityPassed, businessPassed }) {
  if (!identityPassed) return null;
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"0 0 4px"}}>
      <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,
        background:"#dcfce7",color:"#15803d",padding:"4px 12px",borderRadius:999,border:"1px solid #bbf7d0"}}>
        <Shield style={{width:12,height:12}}/> Identity Verified
      </span>
      {businessPassed && (
        <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,
          background:"#e0e7ff",color:"#4338ca",padding:"4px 12px",borderRadius:999,border:"1px solid #c7d2fe"}}>
          <Award style={{width:12,height:12}}/> Business Verified
        </span>
      )}
    </div>
  );
}

function StepVerification({ serviceId, onNext, onRetry }) {
  const [status, setStatus] = useState("verifying");
  const [vData,  setVData]  = useState(null);
  const [stage,  setStage]  = useState("Preparing documents for analysis…");
  const [errCount, setErrCount] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);

  useEffect(() => {
    let interval;
    let errors = 0;
    let ticks  = 0;
    const MAX_ERRORS = 5;
    const MAX_SECS   = 180;

    const poll = async () => {
      ticks++;
      setElapsed(ticks * 3);
      if (ticks * 3 >= MAX_SECS) {
        clearInterval(interval);
        setStatus("timeout");
        return;
      }
      try {
        const { data } = await serviceAPI.getVerificationStatus(serviceId);
        errors = 0; setErrCount(0);
        const ws = data.data.workflowStatus;
        const dv = data.data.docVerification;
        setVData(dv);
        if (dv?.currentStage) setStage(dv.currentStage);
        if (ws === "payment_pending" || ws === "published") {
          setStatus("verified"); clearInterval(interval);
        } else if (ws === "rejected") {
          setStatus("failed"); clearInterval(interval);
        }
      } catch {
        errors++;
        setErrCount(errors);
        if (errors >= MAX_ERRORS) {
          clearInterval(interval);
          setStatus("server_error");
        }
      }
    };
    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [serviceId]);

  /* ── Server Error / Timeout ── */
  if (status === "server_error" || status === "timeout") return (
    <div style={{ border: "1.5px solid #fecaca", borderRadius: 14, background: "#fef2f2", overflow: "hidden", padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <AlertCircle style={{ width: 24, height: 24, color: "#dc2626", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#b91c1c", margin: "0 0 2px" }}>
            {status === "timeout" ? "Verification Timed Out" : "Server Unavailable"}
          </p>
          <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>
            {status === "timeout"
              ? "Verification took too long. The server may still be processing — check back in a few minutes."
              : "Could not reach the server. The OCR process may still be running in the background."}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setStatus("verifying"); setErrCount(0); setElapsed(0); }}
          style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#2563eb", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Retry
        </button>
        <button onClick={onRetry}
          style={{ flex: 1, padding: "10px", borderRadius: 10, background: "white", border: "1.5px solid #fecaca", color: "#dc2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Re-upload Docs
        </button>
      </div>
    </div>
  );

  /* ── In Progress ── */
  if (status === "verifying") return (
    <div style={{padding:"24px 4px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <Loader2 style={{width:40,height:40,color:"#7c3aed",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/>
        <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 4px"}}>AI Verification in Progress</p>
        <p style={{fontSize:12,color:"#7c3aed",margin:0,minHeight:18}}>{stage}</p>
      </div>
      {vData?.documentResults && Object.keys(vData.documentResults).length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {Object.entries(vData.documentResults).map(([dt, r]) => (
            <DocResultRow key={dt} docType={dt} r={r}/>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Identity Verified (level 1 or 2) ── */
  if (status === "verified") {
    const docResults      = vData?.documentResults || {};
    const identityPassed  = vData?.identityPassed  ?? true;
    const businessPassed  = vData?.businessPassed  ?? false;
    const level           = vData?.verificationLevel ?? 1;
    const identityDocs    = Object.entries(docResults).filter(([t]) => IDENTITY_TYPES.has(t));
    const businessDocs    = Object.entries(docResults).filter(([t]) => !IDENTITY_TYPES.has(t));

    return (
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
        style={{border:"1.5px solid #bbf7d0",borderRadius:14,background:"#f0fdf4",overflow:"hidden"}}>
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:12}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"#dcfce7",display:"flex",
              alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <CheckCircle style={{width:22,height:22,color:"#16a34a"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:15,fontWeight:800,color:"#14532d",margin:"0 0 6px"}}>
                ✅ Verification Level {level} Passed
              </p>
              <VerificationLevelBadge level={level} identityPassed={identityPassed} businessPassed={businessPassed}/>
              <p style={{fontSize:12,color:"#16a34a",margin:"6px 0 0"}}>
                Score: {vData?.score ?? "—"}/100 · You can now proceed to choose a subscription plan
              </p>
            </div>
          </div>
        </div>

        {/* Identity doc results */}
        {identityDocs.length > 0 && (
          <div style={{padding:"0 20px 8px"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",
              letterSpacing:"0.06em",margin:"0 0 8px"}}>Identity Documents</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {identityDocs.map(([dt, r]) => <DocResultRow key={dt} docType={dt} r={r}/>)}
            </div>
          </div>
        )}

        {/* Business doc results (if any uploaded) */}
        {businessDocs.length > 0 && (
          <div style={{padding:"0 20px 8px"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",
              letterSpacing:"0.06em",margin:"0 0 8px"}}>Business Documents</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {businessDocs.map(([dt, r]) => <DocResultRow key={dt} docType={dt} r={r}/>)}
            </div>
            {!businessPassed && (
              <p style={{fontSize:11,color:"#64748b",margin:"8px 0 0"}}>
                Business documents did not pass verification — you can still publish your service.
                Re-upload better quality documents later to earn the Business Verified badge.
              </p>
            )}
          </div>
        )}

        <div style={{padding:"8px 20px 18px"}}>
          <button onClick={onNext}
            style={{width:"100%",padding:"12px",borderRadius:10,background:"#16a34a",color:"white",
              border:"none",fontSize:14,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            Continue to Subscription Plans <ChevronRight style={{width:16,height:16}}/>
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Identity Failed ── */
  const docResults = vData?.documentResults || {};
  const failures   = vData?.failureReasons?.length
    ? vData.failureReasons
    : ["Identity verification failed. Please upload a clear Aadhaar or PAN card image."];

  const identityDocs = Object.entries(docResults).filter(([t]) => IDENTITY_TYPES.has(t));

  return (
    <div style={{border:"1.5px solid #fecaca",borderRadius:14,background:"#fef2f2",overflow:"hidden"}}>
      <div style={{padding:"18px 20px",display:"flex",alignItems:"center",gap:12}}>
        <AlertCircle style={{width:24,height:24,color:"#dc2626",flexShrink:0}}/>
        <div>
          <p style={{fontSize:14,fontWeight:800,color:"#b91c1c",margin:"0 0 2px"}}>❌ Identity Verification Failed</p>
          <p style={{fontSize:12,color:"#dc2626",margin:0}}>Score: {vData?.score ?? 0}/100</p>
        </div>
      </div>

      {identityDocs.length > 0 && (
        <div style={{padding:"0 20px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {identityDocs.map(([dt, r]) => <DocResultRow key={dt} docType={dt} r={r}/>)}
        </div>
      )}

      <div style={{margin:"0 20px 16px",background:"#fff1f2",border:"1px solid #fecaca",
        borderRadius:10,padding:"12px 14px"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#991b1b",textTransform:"uppercase",
          letterSpacing:"0.06em",margin:"0 0 8px"}}>What went wrong</p>
        <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:4}}>
          {failures.map((f, i) => (
            <li key={i} style={{fontSize:12,color:"#b91c1c"}}>{f}</li>
          ))}
        </ul>
      </div>

      <div style={{padding:"0 20px 18px"}}>
        <button onClick={onRetry}
          style={{width:"100%",padding:"11px",borderRadius:10,background:"white",
            border:"1.5px solid #fecaca",color:"#dc2626",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          Re-upload Identity Documents
        </button>
      </div>
    </div>
  );
}

/* ─── Step 4: Subscription Plans ─── */
function StepSubscription({ onSelect, onSkip, currentPlan }) {
  const [selected, setSelected] = useState(currentPlan || null);
  const plans = usePlans();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <p style={{fontSize:13,color:"#64748b",margin:0}}>
        Choose a plan to make your service visible to newcomers. You can upgrade any time.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}} className="plans-grid">
        {plans.map(p => {
          const active = selected === p.key;
          return (
            <div key={p.key} onClick={() => setSelected(p.key)}
              style={{border:`2px solid ${active?"#2563eb":p.highlight?"#bfdbfe":"#e2e8f0"}`,borderRadius:14,padding:"18px 16px",
                cursor:"pointer",transition:"all 0.15s",position:"relative",
                background:active?"#eff6ff":p.highlight?"#f8faff":"white",
                boxShadow:active?"0 4px 16px rgba(37,99,235,0.15)":"none"}}>
              {p.badge && (
                <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",
                  background:p.highlight?"#2563eb":"#7c3aed",color:"white",fontSize:10,fontWeight:700,
                  padding:"2px 10px",borderRadius:999}}>
                  {p.badge}
                </span>
              )}
              <p style={{fontWeight:700,color:active?"#1d4ed8":"#0f172a",fontSize:14,margin:"0 0 4px"}}>{p.name}</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:2,marginBottom:12}}>
                <span style={{fontSize:22,fontWeight:800,color:active?"#2563eb":"#0f172a"}}>{p.price}</span>
                <span style={{fontSize:11,color:"#94a3b8",paddingBottom:2}}>{p.period}</span>
              </div>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:5}}>
                {p.features.map(f => (
                  <li key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#475569"}}>
                    <CheckCircle style={{width:11,height:11,color:active?"#2563eb":"#16a34a",flexShrink:0}}/>{f}
                  </li>
                ))}
              </ul>
              {active && (
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#2563eb",fontWeight:700}}>
                  <CheckCircle style={{width:12,height:12}}/> Selected
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => selected && onSelect(selected)} disabled={!selected}
        style={{width:"100%",padding:"12px",borderRadius:10,background:!selected?"#e2e8f0":"#2563eb",
          color:!selected?"#94a3b8":"white",border:"none",fontSize:14,fontWeight:700,
          cursor:!selected?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        Continue to Payment <ChevronRight style={{width:16,height:16}}/>
      </button>
    </div>
  );
}

/* --- Step 5: Payment --- */
function StepPayment({ plan, serviceId, onSuccess }) {
  const [stage,  setStage]  = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const plans    = usePlans();
  const planData = plans.find(p => p.key === plan) || plans[0] || PLANS_STATIC[0];

  // Load Cashfree JS SDK dynamically
  const loadCashfreeSDK = () => new Promise(resolve => {
    if (window.Cashfree) { console.log("[Payment] Cashfree SDK already loaded"); resolve(true); return; }
    console.log("[Payment] Loading Cashfree SDK from CDN...");
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload  = () => { console.log("[Payment] Cashfree SDK loaded successfully"); resolve(true); };
    s.onerror = () => { console.error("[Payment] Failed to load Cashfree SDK"); resolve(false); };
    document.body.appendChild(s);
  });

  const pay = async () => {
    setStage("processing");
    setErrMsg("");

    // ── Step 1: Create order on backend ───────────────────────────────────
    console.log(`[Payment] Step 1 — Creating order for plan=${plan} serviceId=${serviceId}`);
    let orderData, transactionId;
    try {
      const { data: r } = await paymentAPI.createOrder(plan, serviceId);
      orderData     = r.data;
      transactionId = orderData.transactionId;
      console.log("[Payment] Step 1 ✓ — Order created:", JSON.stringify(orderData));
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to create payment order.";
      console.error("[Payment] Step 1 ✗ — Order creation failed:", msg);
      setStage("failed");
      setErrMsg(msg);
      return;
    }

    // ── Step 3: Validate session ID returned by backend ───────────────────
    if (!orderData.sessionId) {
      console.error("[Payment] Step 3 ✗ — No payment_session_id in response:", orderData);
      setStage("failed");
      setErrMsg("Server did not return a payment session. Please try again.");
      return;
    }
    console.log(`[Payment] Step 3 ✓ — Session ID: ${orderData.sessionId}`);

    // ── Step 4: Load Cashfree SDK ─────────────────────────────────────────
    const loaded = await loadCashfreeSDK();
    if (!loaded || !window.Cashfree) {
      setStage("failed");
      setErrMsg("Could not load Cashfree payment gateway. Check your internet connection.");
      return;
    }

    // -- Step 5: Launch Cashfree Checkout
    // Use the env reported by the backend -- guarantees SDK mode matches the session ID.
    const cfEnv = orderData.cashfreeEnv || (import.meta.env.VITE_CASHFREE_ENV || "sandbox").toLowerCase();
    console.log("[Payment] Step 4 -- Initialising Cashfree SDK (env=" + cfEnv + ", source=" + (orderData.cashfreeEnv ? 'backend' : 'env-var') + ")");
    let cashfree;
    try {
      cashfree = await window.Cashfree({ mode: cfEnv });
    } catch (e) {
      console.error("[Payment] Cashfree init failed:", e);
      setStage("failed");
      setErrMsg("Failed to initialise payment gateway: " + e.message);
      return;
    }

    console.log(`[Payment] Step 5 — Opening Cashfree checkout (sessionId=${orderData.sessionId})`);
    setStage("idle"); // show nothing while modal is open

    let result;
    try {
      result = await cashfree.checkout({
        paymentSessionId: orderData.sessionId,
        redirectTarget:   "_modal",
      });
      console.log("[Payment] Step 5 — Checkout result:", JSON.stringify(result));
    } catch (e) {
      const msg = e?.message || "Payment was cancelled.";
      console.error("[Payment] Checkout threw:", msg);
      setStage("failed");
      setErrMsg(msg);
      await paymentAPI.recordFailure({ transactionId, reason: msg }).catch(() => {});
      return;
    }

    // ── Step 6: Handle checkout result ────────────────────────────────────
    if (result?.error) {
      const reason = result.error?.message || "Payment failed";
      console.error("[Payment] Step 6 — Checkout error:", reason);
      setStage("failed");
      setErrMsg(reason);
      await paymentAPI.recordFailure({ transactionId, reason }).catch(() => {});
      return;
    }

    if (result?.paymentDetails?.paymentStatus === "FAILED") {
      console.error("[Payment] Step 6 — Payment FAILED");
      setStage("failed");
      setErrMsg("Payment was declined. Please try a different payment method.");
      await paymentAPI.recordFailure({ transactionId, reason: "Declined" }).catch(() => {});
      return;
    }

    // ── Step 7: Verify payment on backend ─────────────────────────────────
    console.log(`[Payment] Step 7 — Verifying payment with backend (orderId=${orderData.orderId})`);
    setStage("verifying");
    try {
      await paymentAPI.verify({ plan, transactionId, orderId: orderData.orderId, mock: false });
      try { await serviceAPI.activateService(serviceId); } catch {}
      console.log("[Payment] Step 7 ✓ — Payment verified and subscription activated");
      setStage("success");
      toast.success("Payment successful! Your service is now live 🎉");
      setTimeout(() => onSuccess(), 1800);
    } catch (e) {
      const msg = e.response?.data?.message || "Payment verification failed. Contact support.";
      console.error("[Payment] Step 7 ✗ — Verify failed:", msg);
      setStage("failed");
      setErrMsg(msg);
    }
  };

  if (stage === "success") return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      style={{ textAlign:"center", padding:"32px 20px" }}>
      <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
      <p style={{ fontSize:16, fontWeight:800, color:"#0f172a", marginBottom:6 }}>Payment Successful!</p>
      <p style={{ fontSize:13, color:"#64748b" }}>Your service is now live on TrustBridge.</p>
    </motion.div>
  );

  if (stage === "processing" || stage === "verifying") return (
    <div style={{ textAlign:"center", padding:"32px 20px" }}>
      <Loader2 style={{ width:44, height:44, color:"#2563eb", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
      <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:4 }}>
        {stage === "processing" ? "Creating Payment Order…" : "Verifying Transaction…"}
      </p>
      <p style={{ fontSize:12, color:"#94a3b8" }}>
        {stage === "processing" ? "Connecting to Cashfree…" : "Please do not close this window"}
      </p>
    </div>
  );

  if (stage === "failed") return (
    <div style={{ border:"1.5px solid #fecaca", borderRadius:14, background:"#fef2f2", padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <AlertCircle style={{ width:22, height:22, color:"#dc2626", flexShrink:0 }}/>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:"#b91c1c", margin:"0 0 2px" }}>Payment Failed</p>
          <p style={{ fontSize:12, color:"#dc2626", margin:0 }}>{errMsg}</p>
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => { setStage("idle"); setErrMsg(""); }}
          style={{ flex:1, padding:"11px", borderRadius:10, background:"#2563eb", color:"white", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          Retry Payment
        </button>
        <button onClick={() => { setStage("idle"); setErrMsg(""); }}
          style={{ flex:1, padding:"11px", borderRadius:10, background:"white", border:"1.5px solid #fecaca", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  const priceNum = planData.priceNum || parseInt((planData.price || "0").replace(/[^0-9]/g, "")) || 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#f8fafc", borderRadius:12, padding:"16px 18px", border:"1.5px solid #e2e8f0" }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Order Summary</p>
        {[
          { label: `TrustBridge ${planData.name} Plan`, value: planData.price },
          { label: "GST (18%)", value: `₹${Math.round(priceNum * 0.18)}` },
        ].map(r => (
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, color:"#475569" }}>{r.label}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{r.value}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, borderTop:"1px solid #e2e8f0", marginTop:6 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Total</span>
          <span style={{ fontSize:16, fontWeight:800, color:"#2563eb" }}>₹{Math.round(priceNum * 1.18)}</span>
        </div>
      </div>

      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#1d4ed8" }}>
        <Shield style={{ width:14, height:14, flexShrink:0 }}/>
        Secured by Cashfree · 256-bit SSL · PCI DSS Level 1
      </div>

      <button onClick={pay}
        style={{ width:"100%", padding:"14px", borderRadius:10, background:"#2563eb", color:"white", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 16px rgba(37,99,235,0.35)" }}>
        <Shield style={{ width:16, height:16 }}/> Proceed to Payment
      </button>
      <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", margin:0 }}>
        You will be redirected to the Cashfree secure payment page
      </p>
    </div>
  );
}

function Lightbox({ images, startIndex, onClose }) {
  const [idx,   setIdx]   = useState(startIndex);
  const [zoom,  setZoom]  = useState(1);
  const [drag,  setDrag]  = useState({ active: false, startX: 0, startY: 0, tx: 0, ty: 0, ox: 0, oy: 0 });
  const total = images.length;

  const prev = useCallback(() => { setIdx(i => (i - 1 + total) % total); setZoom(1); setDrag(d => ({...d, tx:0, ty:0, ox:0, oy:0})); }, [total]);
  const next = useCallback(() => { setIdx(i => (i + 1) % total); setZoom(1); setDrag(d => ({...d, tx:0, ty:0, ox:0, oy:0})); }, [total]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.5, 4));
      if (e.key === "-")          setZoom(z => Math.max(z - 0.5, 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  // Drag to pan when zoomed
  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    setDrag(d => ({ ...d, active: true, startX: e.clientX, startY: e.clientY }));
  };
  const onMouseMove = (e) => {
    if (!drag.active) return;
    setDrag(d => ({ ...d, tx: d.ox + e.clientX - d.startX, ty: d.oy + e.clientY - d.startY }));
  };
  const onMouseUp = () => {
    setDrag(d => ({ ...d, active: false, ox: d.tx, oy: d.ty }));
  };

  const resetZoom = () => { setZoom(1); setDrag(d => ({...d, tx:0, ty:0, ox:0, oy:0})); };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.95)",
        display: "flex", flexDirection: "column",
        userSelect: "none",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", flexShrink: 0,
        background: "linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)",
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 2,
      }}>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>
          {idx + 1} / {total}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Zoom out */}
          <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} disabled={zoom <= 1}
            style={{ width:36, height:36, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", cursor: zoom<=1?"not-allowed":"pointer", display:"flex",alignItems:"center",justifyContent:"center", opacity: zoom<=1?0.4:1 }}>
            <ZoomOut style={{ width:16, height:16, color:"white" }}/>
          </button>
          {/* Zoom level */}
          <button onClick={resetZoom}
            style={{ height:36, padding:"0 12px", borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", cursor:"pointer", color:"white", fontSize:12, fontWeight:700 }}>
            {Math.round(zoom * 100)}%
          </button>
          {/* Zoom in */}
          <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} disabled={zoom >= 4}
            style={{ width:36, height:36, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", cursor: zoom>=4?"not-allowed":"pointer", display:"flex",alignItems:"center",justifyContent:"center", opacity: zoom>=4?0.4:1 }}>
            <ZoomIn style={{ width:16, height:16, color:"white" }}/>
          </button>
          {/* Close */}
          <button onClick={onClose}
            style={{ width:36, height:36, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", cursor:"pointer", display:"flex",alignItems:"center",justifyContent:"center" }}>
            <X style={{ width:16, height:16, color:"white" }}/>
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      >
        {/* Prev */}
        {total > 1 && (
          <button onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position:"absolute", left:12, zIndex:3, width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.14)", border:"1.5px solid rgba(255,255,255,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
            <ChevronLeft style={{ width:22, height:22, color:"white" }}/>
          </button>
        )}

        <motion.img
          key={idx}
          src={getImageUrl(images[idx])}
          alt={`Photo ${idx + 1}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          style={{
            /* Scale to fit viewport but never exceed natural size going up */
            maxWidth:  zoom === 1 ? "92vw"  : `${zoom * 92}vw`,
            maxHeight: zoom === 1 ? "80vh"  : `${zoom * 80}vh`,
            width:  "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: zoom === 1 ? 10 : 0,
            transform: `translate(${drag.tx}px,${drag.ty}px)`,
            cursor: zoom > 1 ? (drag.active ? "grabbing" : "grab") : "default",
            transition: drag.active ? "none" : undefined,
            pointerEvents: "auto",
            imageRendering: "auto",
          }}
          onLoad={e => {
            const img = e.target;
            console.log(
              `[TrustBridge] Lightbox image loaded — src: ${img.src}\n` +
              `  natural: ${img.naturalWidth}x${img.naturalHeight}px\n` +
              `  rendered: ${img.offsetWidth}x${img.offsetHeight}px`
            );
          }}
          onError={e => { e.target.src = ""; e.target.alt = "Image unavailable"; }}
          draggable={false}
        />

        {/* Next */}
        {total > 1 && (
          <button onClick={e => { e.stopPropagation(); next(); }}
            style={{ position:"absolute", right:12, zIndex:3, width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.14)", border:"1.5px solid rgba(255,255,255,0.18)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
            <ChevronRight style={{ width:22, height:22, color:"white" }}/>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div style={{
          display:"flex", gap:8, justifyContent:"center", alignItems:"center",
          padding:"12px 16px 16px", flexShrink:0, overflowX:"auto",
          background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)",
        }}>
          {images.map((url, i) => (
            <button key={url} onClick={() => { setIdx(i); setZoom(1); resetZoom(); }}
              style={{
                flexShrink:0, width:60, height:44, borderRadius:6, overflow:"hidden", padding:0, cursor:"pointer",
                border: i===idx ? "2.5px solid #3b82f6" : "2.5px solid transparent",
                opacity: i===idx ? 1 : 0.55,
                transition: "opacity 0.15s, border-color 0.15s",
                background:"#1e293b",
              }}>
              <img src={getImageUrl(url)} alt={`Thumb ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Inline Image Gallery (inside Service Detail Modal) ─── */
function ImageGallery({ images }) {
  const [active,   setActive]   = useState(0);
  const [lightbox, setLightbox] = useState(null); // null | index

  if (!images?.length) return null;

  return (
    <>
      {/* Lightbox portal */}
      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <p style={{ fontSize:12, fontWeight:700, color:"#374151", margin:0, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Photos
          </p>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{active+1} / {images.length}</span>
        </div>

        {/* Main image — natural size, capped at container */}
        <div
          onClick={() => setLightbox(active)}
          style={{
            position:"relative", width:"100%",
            background:"#0f172a", borderRadius:12, overflow:"hidden",
            cursor:"zoom-in", marginBottom:8,
            /* Let height follow the image's natural aspect ratio,
               but clamp so very tall images don't overflow the modal */
            display:"flex", alignItems:"center", justifyContent:"center",
            minHeight:160, maxHeight:420,
          }}
        >
          <motion.img
            key={active}
            src={getImageUrl(images[active])}
            alt={`Photo ${active + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              /* Never stretch beyond natural size — only scale DOWN to fit */
              maxWidth: "100%",
              maxHeight: 420,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              /* Crisp pixel rendering — prevents browser smoothing from blurring */
              imageRendering: "auto",
            }}
            onLoad={e => {
              const img = e.target;
              console.log(
                `[TrustBridge] Gallery image loaded — src: ${img.src}\n` +
                `  natural: ${img.naturalWidth}x${img.naturalHeight}px\n` +
                `  rendered: ${img.offsetWidth}x${img.offsetHeight}px\n` +
                `  upscaled: ${img.offsetWidth > img.naturalWidth || img.offsetHeight > img.naturalHeight}`
              );
            }}
            onError={e => {
              console.warn('[TrustBridge] Gallery image failed:', e.target.src);
              e.target.style.display = "none";
            }}
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + images.length) % images.length); }}
                style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
                <ChevronLeft style={{ width:17, height:17, color:"white" }}/>
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % images.length); }}
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
                <ChevronRight style={{ width:17, height:17, color:"white" }}/>
              </button>
            </>
          )}

          {/* Expand hint */}
          <div style={{ position:"absolute", bottom:8, right:8, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.55)", borderRadius:6, padding:"4px 9px", backdropFilter:"blur(4px)" }}>
            <Maximize2 style={{ width:11, height:11, color:"white" }}/>
            <span style={{ fontSize:10, color:"white", fontWeight:600 }}>View full size</span>
          </div>

          {/* Cover badge */}
          {active === 0 && (
            <span style={{ position:"absolute", top:8, left:8, fontSize:9, fontWeight:700, background:"#2563eb", color:"white", padding:"2px 8px", borderRadius:999 }}>Cover</span>
          )}
        </div>

        {/* Thumbnail row */}
        {images.length > 1 && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
            {images.map((url, i) => (
              <button
                key={url}
                onClick={() => setActive(i)}
                style={{
                  flexShrink:0, width:64, height:48, borderRadius:7, overflow:"hidden", padding:0, cursor:"pointer",
                  border: i===active ? "2.5px solid #2563eb" : "2.5px solid transparent",
                  opacity: i===active ? 1 : 0.55,
                  transition: "opacity 0.15s, border-color 0.15s",
                  background:"#e2e8f0",
                }}
              >
                <img src={getImageUrl(url)} alt={`Thumb ${i+1}`}
                  style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                  onError={e => { e.target.style.display="none"; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


/* ─── Service Detail Modal ─── */
function ServiceDetailModal({ service, onClose, onEdit, onDelete, onContinuePayment, onReverify }) {
  const wf = WORKFLOW_LABELS[service.workflowStatus] || WORKFLOW_LABELS.draft;
  const dv = service.docVerification || {};
  // Filter out placeholder/broken URLs before rendering
  const realImages = (service.images || []).filter(isRealImage);
  const coverImg = realImages[0] ? getImageUrl(realImages[0]) : null;

  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:20,width:"100%",maxWidth:680,maxHeight:"90vh",
          overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>

        {/* Cover image / header */}
        <div style={{position:"relative",height:coverImg?200:72,background:"linear-gradient(135deg,#0f172a,#1e3a5f)",flexShrink:0}}>
          {coverImg && <img src={coverImg} alt="cover"
            style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.85}}
            onError={e=>{
              console.warn('[TrustBridge] Cover image failed to load:', e.target.src);
              e.target.style.display='none';
            }}
          />}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 50%)"}}/>
          <div style={{position:"absolute",bottom:16,left:20,right:56}}>
            <p style={{fontSize:18,fontWeight:800,color:"white",margin:"0 0 6px",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{service.title}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:wf.bg,color:wf.color}}>{wf.label}</span>
              {dv.identityPassed && <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:"#dcfce7",color:"#15803d"}}>✔ Identity Verified</span>}
              {dv.businessPassed && <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:"#e0e7ff",color:"#4338ca"}}>✔ Business Verified</span>}
            </div>
          </div>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.4)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X style={{width:16,height:16,color:"white"}}/>
          </button>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* Quick info */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            {[
              {icon:<MapPin style={{width:13,height:13}}/>, label:"Location", value:`${service.location}${service.address?` — ${service.address}`:""}` },
              {icon:<span style={{fontSize:13}}>₹</span>, label:"Price", value:service.price>0?`₹${service.price}${service.priceUnit?` / ${service.priceUnit}`:""}` : "Free / Negotiable"},
              {icon:<Phone style={{width:13,height:13}}/>, label:"Contact", value:service.contactNumber||"—"},
              {icon:<Mail style={{width:13,height:13}}/>, label:"Email", value:service.businessEmail||"—"},
            ].filter(r=>r.value&&r.value!=="—").map(r => (
              <div key={r.label} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{color:"#64748b",marginTop:1,flexShrink:0}}>{r.icon}</span>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:10,color:"#94a3b8",fontWeight:600,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{r.label}</p>
                  <p style={{fontSize:12,color:"#0f172a",fontWeight:600,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {service.description && (
            <div style={{marginBottom:18}}>
              <p style={{fontSize:12,fontWeight:700,color:"#374151",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Description</p>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.65,margin:0}}>{service.description}</p>
            </div>
          )}

          {/* Photo gallery */}
          {realImages.length > 0 && <ImageGallery images={realImages} />}

          {/* Verification details */}
          <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <p style={{fontSize:12,fontWeight:700,color:"#374151",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Verification Status</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,
                background:dv.identityPassed?"#dcfce7":"#fee2e2",color:dv.identityPassed?"#15803d":"#b91c1c"}}>
                {dv.identityPassed ? "✔ Identity Verified" : "✘ Identity Not Verified"}
              </span>
              {Object.keys(service.documents||{}).length > 0 && (
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,
                  background:dv.businessPassed?"#e0e7ff":"#f1f5f9",color:dv.businessPassed?"#4338ca":"#64748b"}}>
                  {dv.businessPassed ? "✔ Business Verified" : "Business Docs Uploaded"}
                </span>
              )}
            </div>
            {dv.score > 0 && <p style={{fontSize:12,color:"#64748b",margin:"0 0 4px"}}>Verification Score: <strong>{dv.score}/100</strong></p>}
            {dv.failureReasons?.length > 0 && (
              <div style={{marginTop:8}}>
                <p style={{fontSize:11,fontWeight:700,color:"#b91c1c",margin:"0 0 4px"}}>Issues found:</p>
                <ul style={{margin:0,paddingLeft:16}}>
                  {dv.failureReasons.slice(0,3).map((r,i) => <li key={i} style={{fontSize:11,color:"#b91c1c"}}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Docs summary */}
          {Object.keys(service.documents||{}).length > 0 && (
            <div style={{marginBottom:18}}>
              <p style={{fontSize:12,fontWeight:700,color:"#374151",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Uploaded Documents</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(service.documents).map(([k,v]) => v?.url && (
                  <span key={k} style={{fontSize:11,padding:"4px 10px",borderRadius:999,fontWeight:600,
                    background:v.verified?"#dcfce7":"#f1f5f9",color:v.verified?"#15803d":"#64748b",border:`1px solid ${v.verified?"#bbf7d0":"#e2e8f0"}`}}>
                    {v.verified?"✔ ":""}{k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
          {service.workflowStatus === "payment_pending" && (
            <button onClick={onContinuePayment}
              style={{flex:2,padding:"11px",borderRadius:10,background:"#2563eb",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              💳 Complete Payment
            </button>
          )}
          {service.workflowStatus === "rejected" && (
            <button onClick={onReverify}
              style={{flex:2,padding:"11px",borderRadius:10,background:"#7c3aed",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              📤 Re-upload Documents
            </button>
          )}
          <button onClick={onEdit}
            style={{flex:1,padding:"11px",borderRadius:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
            data-testid="edit-service-btn">
            <Edit style={{width:14,height:14}}/> Edit
          </button>
          <button onClick={onDelete}
            style={{padding:"11px 16px",borderRadius:10,background:"#fef2f2",border:"1.5px solid #fecaca",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <Trash2 style={{width:14,height:14}}/>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Edit Service Modal ─── */
function EditServiceModal({ service, onClose, onSaved }) {
  const EDIT_TABS = ["Details","Photos","Documents","Status"];
  const [tab, setTab] = useState("Details");
  const [f, setF] = useState({
    title:         service.title || "",
    description:   service.description || "",
    category:      service.category || "Medical",
    location:      service.location || "Bachupally",
    address:       service.address || "",
    price:         String(service.price || 0),
    priceUnit:     service.priceUnit || "per service",
    contactNumber: service.contactNumber || "",
    businessEmail: service.businessEmail || "",
    website:       service.website || "",
  });
  const [images,    setImages]    = useState((service.images || []).filter(isRealImage));
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [pausing,   setPausing]   = useState(false);
  const imgInp = useRef(null);
  const upd = (k,v) => setF(p => ({...p,[k]:v}));

  // ── save details ────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const { data } = await serviceAPI.update(service._id, { ...f, price: Number(f.price) });
      if (data.requiresReview) {
        toast("Your changes have been saved and submitted for verification.", { icon:"🔍" });
      } else {
        toast.success("Service updated successfully.");
      }
      onSaved();
    } catch(e) { toast.error(e.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  // ── photo helpers ───────────────────────────────────────────────────────────
  const addPhotos = async (files) => {
    if (!files?.length) return;
    if (images.length + files.length > 10) { toast.error("Maximum 10 photos per service"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(file => fd.append("images", file));
      const { data } = await serviceAPI.uploadImages(service._id, fd);
      setImages((data.data.images || []).filter(isRealImage));
      toast.success("Photos uploaded!");
    } catch(e) { toast.error(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const removePhoto = async (url) => {
    try {
      const { data } = await serviceAPI.deleteImage(service._id, url);
      setImages((data.data.images || []).filter(isRealImage));
      toast.success("Photo removed.");
    } catch { toast.error("Could not remove photo"); }
  };

  const makeCover = (url) => {
    const reordered = [url, ...images.filter(u => u !== url)];
    setImages(reordered);
    serviceAPI.update(service._id, { images: reordered }).catch(() => {});
    toast.success("Cover photo updated.");
  };

  // ── pause / activate ────────────────────────────────────────────────────────
  const togglePause = async () => {
    const newStatus = service.workflowStatus === "published" ? "paused" : "published";
    setPausing(true);
    try {
      await serviceAPI.patchStatus(service._id, newStatus);
      toast.success(newStatus === "paused" ? "Service paused." : "Service re-activated.");
      onSaved();
    } catch(e) { toast.error(e.response?.data?.message || "Status update failed"); }
    finally { setPausing(false); }
  };

  const fieldStyle = {
    width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0",
    borderRadius:9, fontSize:13, color:"#0f172a", outline:"none",
    background:"#fff", boxSizing:"border-box", fontFamily:"inherit",
  };
  const lblStyle = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 };

  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        style={{background:"white",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"92vh",
          overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>

        {/* Header */}
        <div style={{padding:"18px 24px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:800,color:"#0f172a",margin:"0 0 2px"}}>Edit Service</h3>
              <p style={{fontSize:12,color:"#64748b",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:400}}>{service.title}</p>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
              <X style={{width:18,height:18,color:"#64748b"}}/>
            </button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:3,background:"#f1f5f9",borderRadius:9,padding:3}}>
            {EDIT_TABS.map(t => (
              <button key={t} onClick={()=>setTab(t)}
                style={{flex:1,padding:"6px 4px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,
                  fontWeight:tab===t?700:500,background:tab===t?"#fff":"transparent",
                  color:tab===t?"#0f172a":"#64748b",
                  boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.12s"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.15}}>

              {/* ── DETAILS TAB ── */}
              {tab === "Details" && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* Critical change warning */}
                  {["published"].includes(service.workflowStatus) && (
                    <div style={{padding:"10px 14px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,fontSize:12,color:"#b45309"}}>
                      💡 Changing Category or Location will require admin re-verification before your service goes live again.
                    </div>
                  )}
                  <div>
                    <label style={lblStyle}>Service Name *</label>
                    <input value={f.title} onChange={e=>upd("title",e.target.value)} style={fieldStyle} placeholder="Service name"/>
                  </div>
                  <div>
                    <label style={lblStyle}>Description *</label>
                    <textarea value={f.description} onChange={e=>upd("description",e.target.value)}
                      rows={4} style={{...fieldStyle,resize:"vertical"}} placeholder="Describe your service…"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <label style={lblStyle}>Category</label>
                      <select value={f.category} onChange={e=>upd("category",e.target.value)} style={fieldStyle}>
                        {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lblStyle}>Location</label>
                      <select value={f.location} onChange={e=>upd("location",e.target.value)} style={fieldStyle}>
                        {LOCS.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lblStyle}>Full Address</label>
                    <input value={f.address} onChange={e=>upd("address",e.target.value)} style={fieldStyle} placeholder="Shop No., Street, Area"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <label style={lblStyle}>Price (₹)</label>
                      <input type="number" min="0" value={f.price} onChange={e=>upd("price",e.target.value)} style={fieldStyle}/>
                    </div>
                    <div>
                      <label style={lblStyle}>Price Unit</label>
                      <input value={f.priceUnit} onChange={e=>upd("priceUnit",e.target.value)} style={fieldStyle} placeholder="per visit, per hour…"/>
                    </div>
                  </div>
                  <div>
                    <label style={lblStyle}>Contact Number</label>
                    <input value={f.contactNumber} onChange={e=>upd("contactNumber",e.target.value)} style={fieldStyle} placeholder="+91 XXXXX XXXXX"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <label style={lblStyle}>Business Email</label>
                      <input type="email" value={f.businessEmail} onChange={e=>upd("businessEmail",e.target.value)} style={fieldStyle} placeholder="email@business.com"/>
                    </div>
                    <div>
                      <label style={lblStyle}>Website (optional)</label>
                      <input value={f.website} onChange={e=>upd("website",e.target.value)} style={fieldStyle} placeholder="www.example.com"/>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PHOTOS TAB ── */}
              {tab === "Photos" && (
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <p style={{fontSize:13,color:"#64748b",margin:0}}>{images.length} / 10 photos</p>
                    <button onClick={()=>imgInp.current?.click()} disabled={uploading || images.length>=10}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,
                        background:"#2563eb",color:"#fff",border:"none",fontSize:12,fontWeight:700,
                        cursor:images.length>=10?"not-allowed":"pointer",opacity:images.length>=10?0.5:1}}>
                      {uploading ? <><Loader2 style={{width:13,height:13,animation:"spin 1s linear infinite"}}/> Uploading…</> : <><Upload style={{width:13,height:13}}/> Add Photos</>}
                    </button>
                    <input ref={imgInp} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addPhotos(e.target.files)}/>
                  </div>
                  {images.length === 0 ? (
                    <div style={{textAlign:"center",padding:"40px 24px",background:"#f8fafc",borderRadius:12,border:"1.5px dashed #e2e8f0"}}>
                      <p style={{fontSize:32,margin:"0 0 8px"}}>📷</p>
                      <p style={{fontSize:13,color:"#64748b",margin:0}}>No photos yet. Upload photos to attract more customers.</p>
                    </div>
                  ) : (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      {images.map((url,i) => (
                        <div key={url} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"4/3",background:"#f1f5f9"}}>
                          <img src={url} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}
                            onError={e=>{
                              console.warn('[TrustBridge] Edit modal image failed to load:', e.target.src);
                              e.target.style.display='none';
                              e.target.parentElement.insertAdjacentHTML('afterbegin','<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#94a3b8">Image unavailable</div>');
                            }}
                          />
                          {i===0 && <span style={{position:"absolute",top:4,left:4,fontSize:9,fontWeight:700,background:"#2563eb",color:"white",padding:"2px 7px",borderRadius:999}}>Cover</span>}
                          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.35)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}>
                            <div style={{position:"absolute",bottom:6,left:0,right:0,display:"flex",justifyContent:"center",gap:5,opacity:0,transition:"opacity 0.15s"}}
                              onMouseEnter={e=>{e.currentTarget.style.opacity=1;e.currentTarget.parentElement.style.background="rgba(0,0,0,0.35)";}}
                              onMouseLeave={e=>{e.currentTarget.style.opacity=0;e.currentTarget.parentElement.style.background="rgba(0,0,0,0)";}}>
                              {i!==0&&<button onClick={()=>makeCover(url)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:999,background:"#2563eb",color:"white",border:"none",cursor:"pointer"}}>Set Cover</button>}
                              <button onClick={()=>removePhoto(url)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:999,background:"#dc2626",color:"white",border:"none",cursor:"pointer"}}>Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add more slot */}
                      {images.length < 10 && (
                        <button onClick={()=>imgInp.current?.click()}
                          style={{aspectRatio:"4/3",borderRadius:10,border:"1.5px dashed #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,color:"#94a3b8"}}>
                          <Upload style={{width:18,height:18}}/><span style={{fontSize:11,fontWeight:600}}>Add more</span>
                        </button>
                      )}
                    </div>
                  )}
                  <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Hover over a photo to set it as cover or remove it. First photo is always the cover.</p>
                </div>
              )}

              {/* ── DOCUMENTS TAB ── */}
              {tab === "Documents" && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{padding:"12px 16px",background:"#eff6ff",borderRadius:10,border:"1px solid #bfdbfe",fontSize:12,color:"#1d4ed8"}}>
                    ℹ️ Re-uploading documents will trigger a new AI verification process. Your service may be temporarily hidden during review.
                  </div>
                  {/* Verification status */}
                  <div style={{padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1.5px solid #e2e8f0"}}>
                    <p style={{fontSize:12,fontWeight:700,color:"#374151",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Current Status</p>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,
                        background:service.docVerification?.identityPassed?"#dcfce7":"#fee2e2",
                        color:service.docVerification?.identityPassed?"#15803d":"#b91c1c"}}>
                        {service.docVerification?.identityPassed?"✔ Identity Verified":"✘ Identity Not Verified"}
                      </span>
                      <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,
                        background:service.docVerification?.businessPassed?"#e0e7ff":"#f1f5f9",
                        color:service.docVerification?.businessPassed?"#4338ca":"#64748b"}}>
                        {service.docVerification?.businessPassed?"✔ Business Verified":"Business Docs Not Verified"}
                      </span>
                    </div>
                    {service.docVerification?.failureReasons?.length > 0 && (
                      <div style={{marginTop:10}}>
                        <p style={{fontSize:11,fontWeight:700,color:"#b91c1c",margin:"0 0 4px"}}>Issues:</p>
                        <ul style={{margin:0,paddingLeft:16}}>{service.docVerification.failureReasons.slice(0,3).map((r,i)=><li key={i} style={{fontSize:11,color:"#b91c1c"}}>{r}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  {/* Upload new docs */}
                  <StepDocuments category={service.category} serviceId={service._id} onNext={()=>{onSaved();onClose();}}/>
                </div>
              )}

              {/* ── STATUS TAB ── */}
              {tab === "Status" && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* Current status */}
                  <div style={{padding:"16px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:12}}>
                    <p style={{fontSize:12,fontWeight:700,color:"#374151",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Current Status</p>
                    {(() => {
                      const wf = WORKFLOW_LABELS[service.workflowStatus] || WORKFLOW_LABELS.draft;
                      return (
                        <span style={{fontSize:13,fontWeight:700,padding:"6px 14px",borderRadius:99,background:wf.bg,color:wf.color}}>
                          {wf.label}
                        </span>
                      );
                    })()}
                  </div>
                  {/* Pause / Activate */}
                  {(service.workflowStatus === "published" || service.workflowStatus === "paused") && (
                    <div style={{padding:"16px",background:service.workflowStatus==="paused"?"#f0fdf4":"#fffbeb",
                      border:`1.5px solid ${service.workflowStatus==="paused"?"#bbf7d0":"#fde68a"}`,borderRadius:12}}>
                      <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>
                        {service.workflowStatus==="published" ? "Pause Service" : "Re-activate Service"}
                      </p>
                      <p style={{fontSize:12,color:"#64748b",margin:"0 0 14px",lineHeight:1.5}}>
                        {service.workflowStatus==="published"
                          ? "Pausing will hide your service from newcomers. You can re-activate it at any time."
                          : "Re-activating will make your service visible to newcomers again."}
                      </p>
                      <button onClick={togglePause} disabled={pausing}
                        style={{padding:"10px 20px",borderRadius:9,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",
                          background:service.workflowStatus==="published"?"#d97706":"#16a34a",color:"white"}}>
                        {pausing?"Updating…":service.workflowStatus==="published"?"Pause Service":"Re-activate Service"}
                      </button>
                    </div>
                  )}
                  {/* Danger zone */}
                  <div style={{padding:"16px",background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:12}}>
                    <p style={{fontSize:13,fontWeight:700,color:"#dc2626",margin:"0 0 6px"}}>Delete Service</p>
                    <p style={{fontSize:12,color:"#64748b",margin:"0 0 14px"}}>Permanently remove this service from your dashboard.</p>
                    <button onClick={()=>{onClose();}} style={{padding:"10px 20px",borderRadius:9,border:"1.5px solid #fecaca",background:"#fff",color:"#dc2626",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      Open Delete Dialog
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — save button only for Details tab */}
        {tab === "Details" && (
          <div style={{padding:"14px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,flexShrink:0}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{flex:2,padding:"11px",borderRadius:10,background:saving?"#93c5fd":"#2563eb",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {saving?<><Loader2 style={{width:14,height:14,animation:"spin 1s linear infinite"}}/>Saving…</>:"Save Changes"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}


/* ─── Delete Confirm Modal ─── */
function DeleteConfirmModal({ serviceName, onConfirm, onCancel, deleting }) {
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
        style={{background:"white",borderRadius:16,width:"100%",maxWidth:400,padding:"28px 28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <Trash2 style={{width:22,height:22,color:"#dc2626"}}/>
        </div>
        <h3 style={{fontSize:16,fontWeight:800,color:"#0f172a",textAlign:"center",margin:"0 0 8px"}}>Delete Service?</h3>
        <p style={{fontSize:13,color:"#64748b",textAlign:"center",margin:"0 0 24px",lineHeight:1.6}}>
          "<strong>{serviceName}</strong>" will be removed from your dashboard and hidden from newcomers. This action can be reversed by contacting support.
        </p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            style={{flex:1,padding:"11px",borderRadius:10,background:"#dc2626",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:deleting?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {deleting?<><Loader2 style={{width:14,height:14,animation:"spin 1s linear infinite"}}/> Deleting…</>:"Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Create Service Wizard ─── */
const WIZARD_STEPS = ["Basic Info","Photos","Documents","AI Verification","Choose Plan","Payment","Done"];

function CreateServiceWizard({ onClose, onCreated, resumeServiceId, resumeStep, resumeFormData }) {
  const isResume = !!resumeServiceId;
  const [step,      setStep]      = useState(resumeStep ?? 0);
  const [formData,  setFormData]  = useState(resumeFormData ?? { title:"", description:"", category:"Medical", location:"Bachupally", price:0 });
  const [serviceId, setServiceId] = useState(resumeServiceId ?? null);
  const [images,    setImages]    = useState([]);
  const [chosenPlan,setChosenPlan]= useState(null);
  const [creating,  setCreating]  = useState(false);

  const goNext = () => setStep(s => s + 1);

  const createAndNext = async () => {
    setCreating(true);
    try {
      const { data } = await serviceAPI.create(formData);
      setServiceId(data.data._id);
      goNext();
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to create service");
    } finally { setCreating(false); }
  };

  const pct = Math.round((step / (WIZARD_STEPS.length - 1)) * 100);

  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
        style={{background:"white",borderRadius:20,width:"100%",maxWidth:640,
          maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",
          boxShadow:"0 24px 80px rgba(0,0,0,0.2)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h3 style={{fontSize:17,fontWeight:800,color:"#0f172a",margin:"0 0 2px"}}>{isResume ? "Continue Service Setup" : "Add New Service"}</h3>
              <p style={{fontSize:12,color:"#64748b",margin:0}}>Step {step+1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}</p>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
              <X style={{width:18,height:18,color:"#64748b"}}/>
            </button>
          </div>
          {/* Progress bar */}
          <div style={{marginTop:14,height:4,background:"#e2e8f0",borderRadius:999,overflow:"hidden"}}>
            <motion.div animate={{width:`${pct}%`}} transition={{duration:0.4}}
              style={{height:"100%",borderRadius:999,background:"#2563eb"}}/>
          </div>
          {/* Step pills */}
          <div style={{display:"flex",gap:4,marginTop:10,overflowX:"auto",paddingBottom:2}}>
            {WIZARD_STEPS.map((s,i) => (
              <span key={s} style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:999,whiteSpace:"nowrap",
                background:i<step?"#dcfce7":i===step?"#dbeafe":"#f1f5f9",
                color:i<step?"#15803d":i===step?"#1d4ed8":"#94a3b8"}}>
                {i<step?"✔ ":""}{s}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
              transition={{duration:0.22}}>

              {step === 0 && <StepBasicInfo data={formData} onChange={setFormData}
                onNext={createAndNext} />}
              {creating && step === 0 && <div style={{textAlign:"center",padding:20}}><LoadingSpinner/></div>}

              {step === 1 && serviceId && <StepPhotos serviceId={serviceId} images={images} setImages={setImages}
                onNext={goNext} onSkip={goNext}/>}

              {step === 2 && serviceId && <StepDocuments category={formData.category} serviceId={serviceId} onNext={goNext}/>}

              {step === 3 && serviceId && <StepVerification serviceId={serviceId} onNext={goNext}
                onRetry={() => setStep(2)}/>}

              {step === 4 && <StepSubscription currentPlan={chosenPlan}
                onSelect={p => { setChosenPlan(p); goNext(); }}
                onSkip={goNext}/>}

              {step === 5 && serviceId && chosenPlan && <StepPayment plan={chosenPlan} serviceId={serviceId}
                onSuccess={() => { goNext(); onCreated(); }}/>}

              {step === 6 && (
                <div style={{textAlign:"center",padding:"32px 20px"}}>
                  <div style={{fontSize:52,marginBottom:16}}>🏢</div>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>Service is Live!</h3>
                  <p style={{fontSize:13,color:"#64748b",marginBottom:24,lineHeight:1.65}}>
                    Your service is now visible to newcomers on TrustBridge. You can manage it from your dashboard.
                  </p>
                  <button onClick={onClose}
                    style={{padding:"12px 28px",borderRadius:10,background:"#2563eb",color:"white",border:"none",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                    Go to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Provider Dashboard ─── */
export default function ProviderDashboard() {
  const { user }           = useAuth();
  const nav                = useNavigate();
  const [an, setAn]        = useState(null);
  const [svcs, setSvcs]    = useState([]);
  const [books, setBook]   = useState([]);
  const [sub, setSub]      = useState(null);
  const [plans, setPl]     = useState({});
  const [ld, setLd]        = useState(true);
  const [tab, setTab]      = useState("Services");
  const [showWizard,    setShowWizard]    = useState(false);
  const [showPlans,     setShowPlans]     = useState(false);
  const [detailSvc,     setDetailSvc]     = useState(null);
  const [editSvc,       setEditSvc]       = useState(null);
  const [deleteSvc,     setDeleteSvc]     = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [resumeWizard,  setResumeWizard]  = useState(null);

  const load = () => {
    Promise.all([providerAPI.getAnalytics(), serviceAPI.getMyServices(), bookingAPI.getMy(), paymentAPI.getSubscription()])
      .then(([a, s, b, su]) => { setAn(a.data.data); setSvcs(s.data.data); setBook(b.data.data); setSub(su.data.data); setPl(su.data.plans); })
      .finally(() => setLd(false));
  };

  useEffect(() => { load(); }, []);

  const subscribe = async key => {
    try {
      const { data } = await paymentAPI.createOrder(key);
      await paymentAPI.verify({ plan:key, mock:true, orderId:data.data.orderId, transactionId:data.data.transactionId });
      toast.success(`${key} plan activated!`);
      const su = await paymentAPI.getSubscription(); setSub(su.data.data); setShowPlans(false);
    } catch(e) { toast.error(e.response?.data?.message || "Payment failed"); }
  };

  const handleDelete = async () => {
    if (!deleteSvc) return;
    setDeleting(true);
    const svcId = deleteSvc._id;
    const svcTitle = deleteSvc.title;
    try {
      console.log('[Dashboard] DELETE service:', svcId);
      const res = await serviceAPI.delete(svcId);
      console.log('[Dashboard] DELETE response:', res.data);
      toast.success(`"${svcTitle}" removed`);
      // Optimistically remove from UI immediately
      setSvcs(prev => prev.filter(s => s._id !== svcId));
      setDeleteSvc(null);
      setDetailSvc(null);
    } catch(e) {
      console.error('[Dashboard] DELETE error:', e.response?.data || e.message);
      toast.error(e.response?.data?.message || "Delete failed");
    } finally { setDeleting(false); }
  };

  // Open the right action when a card is clicked based on its workflow state
  const handleCardClick = (svc) => {
    console.log('[Dashboard] Card clicked:', svc._id, 'status:', svc.workflowStatus);
    const ws = svc.workflowStatus;
    if (ws === 'docs_pending' || ws === 'draft') {
      // Resume wizard from documents step
      setResumeWizard({ serviceId: svc._id, startStep: 2, formData: { title: svc.title, description: svc.description, category: svc.category, location: svc.location, price: svc.price } });
    } else {
      setDetailSvc(svc);
    }
  };

  if (ld) return <LoadingSpinner size="lg"/>;
  const active = sub?.status === "active";
  const daysLeft = sub?.endDate ? Math.max(0, Math.ceil((new Date(sub.endDate)-new Date())/86400000)) : 0;

  // If user's role is not provider (e.g. registered as resident), show fix banner
  const needsRoleUpgrade = user?.role && user.role !== 'provider';

  const handleBecomeProvider = async () => {
    try {
      const { data } = await api.post('/auth/become-provider');
      localStorage.setItem('accessToken',  data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      toast.success('Account upgraded to Provider! Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch(e) {
      toast.error(e.response?.data?.message || 'Upgrade failed');
    }
  };

  return (
    <div className="wrap py-8">
      {/* Role mismatch warning */}
      {needsRoleUpgrade && (
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
          <AlertCircle style={{width:20,height:20,color:"#dc2626",flexShrink:0}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:700,color:"#b91c1c",margin:"0 0 2px"}}>Account role mismatch</p>
            <p style={{fontSize:12,color:"#b91c1c",margin:0}}>
              Your account is registered as <strong>{user.role}</strong>. Payment APIs require provider role.
            </p>
          </div>
          <button onClick={handleBecomeProvider}
            style={{background:"#dc2626",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            Fix: Upgrade to Provider
          </button>
        </div>
      )}

      {/* ── Compact Welcome Banner ── */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
        style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:16,padding:"18px 24px",marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 60% 100% at 80% 50%,rgba(59,130,246,0.2) 0%,transparent 70%)"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <h1 style={{fontSize:"1.2rem",fontWeight:800,color:"#fff",letterSpacing:"-0.02em",margin:"0 0 3px"}}>
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Manage your services, bookings, and business performance.</p>
          </div>
          {/* Verification badge */}
          {(() => {
            const vs = sub?.verificationStatus || "pending";
            const badges = {
              verified:      {label:"Verified Provider",  bg:"rgba(22,163,74,0.2)",   border:"rgba(22,163,74,0.4)",   color:"#86efac", icon:"✔"},
              manual_review: {label:"Verification Pending",bg:"rgba(217,119,6,0.2)",  border:"rgba(217,119,6,0.4)",   color:"#fde68a", icon:"⏳"},
              rejected:      {label:"Verification Rejected",bg:"rgba(220,38,38,0.2)", border:"rgba(220,38,38,0.4)",   color:"#fca5a5", icon:"✘"},
            };
            const b = badges[vs] || badges.manual_review;
            return (
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:99,background:b.bg,border:`1px solid ${b.border}`}}>
                <span style={{fontSize:12}}>{b.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:b.color}}>{b.label}</span>
              </div>
            );
          })()}
        </div>
        {/* KPI row */}
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          {[
            {label:"Services",         value:an?.totalServices||0,                         icon:"🏢"},
            {label:"Total Bookings",   value:an?.totalBookings||0,                         icon:"📅"},
            {label:"Pending",          value:an?.pendingBookings||0,                       icon:"⏳"},
            {label:"Completed",        value:an?.completedBookings||0,                     icon:"✅"},
            {label:"Avg Rating",       value:an?.averageRating?an.averageRating.toFixed(1):"—", icon:"⭐"},
            {label:"Revenue",          value:`₹${an?.revenue||0}`,                        icon:"💰"},
          ].map(m => (
            <div key={m.label} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(8px)",borderRadius:10,padding:"10px 16px",border:"1px solid rgba(255,255,255,0.1)",minWidth:90}}>
              <p style={{fontSize:16,margin:"0 0 2px"}}>{m.icon}</p>
              <p style={{fontSize:"1.1rem",fontWeight:800,color:"#fff",margin:0,lineHeight:1}}>{m.value}</p>
              <p style={{fontSize:10,color:"#94a3b8",margin:"2px 0 0",fontWeight:500}}>{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Profile Completion Bar ── */}
      {(() => {
        const factors = [
          { label:"Profile details",        done: !!(user?.name && user?.email) },
          { label:"Contact information",    done: !!(svcs[0]?.contactNumber || svcs[0]?.businessEmail) },
          { label:"Service information",    done: svcs.length > 0 },
          { label:"Verification documents", done: !!(svcs.some(s => s.docVerification?.identityPassed)) },
        ];
        const pct = Math.round(factors.filter(f=>f.done).length / factors.length * 100);
        if (pct === 100) return null;
        return (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"16px 20px",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 2px"}}>Profile Completion</p>
                <p style={{fontSize:11,color:"#64748b",margin:0}}>Complete your profile to attract more customers</p>
              </div>
              <span style={{fontSize:18,fontWeight:800,color:pct>=75?"#16a34a":pct>=50?"#d97706":"#dc2626"}}>{pct}%</span>
            </div>
            <div style={{height:6,background:"#f1f5f9",borderRadius:999,overflow:"hidden",marginBottom:12}}>
              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8}}
                style={{height:"100%",borderRadius:999,background:pct>=75?"#16a34a":pct>=50?"#d97706":"#2563eb"}}/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {factors.map(f => (
                <span key={f.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,
                  padding:"3px 10px",borderRadius:99,
                  background:f.done?"#f0fdf4":"#f8fafc",color:f.done?"#16a34a":"#94a3b8",
                  border:`1px solid ${f.done?"#bbf7d0":"#e2e8f0"}`}}>
                  {f.done?"✔":""} {f.label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Tabs + Add button ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:10,padding:4}}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t?700:500,
                background:tab===t?"#fff":"transparent",color:tab===t?"#0f172a":"#64748b",
                boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowWizard(true)}
          style={{display:"flex",alignItems:"center",gap:7,background:"#2563eb",color:"#fff",border:"none",
            borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 12px rgba(37,99,235,0.25)"}}>
          <Plus style={{width:15,height:15}}/> Add Service
        </button>
      </div>

      {/* ── Services tab ── */}
      {tab === "Services" && (
        svcs.length > 0 ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
            {svcs.map((s,i) => {
              const wf = WORKFLOW_LABELS[s.workflowStatus] || WORKFLOW_LABELS.draft;
              return (
                <motion.div key={s._id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  style={{background:"#fff",border:"1.5px solid #f1f5f9",borderRadius:14,overflow:"hidden",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",transition:"box-shadow 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.09)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"}>
                  {/* Cover */}
                  <div style={{height:120,background:"linear-gradient(135deg,#e2e8f0,#cbd5e1)",position:"relative",overflow:"hidden",cursor:"pointer"}}
                    onClick={()=>handleCardClick(s)}>
                    {isRealImage(s.images?.[0])
                      ? <img src={getImageUrl(s.images[0])} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover"}}
                          onError={e=>{
                            console.warn('[TrustBridge] Card cover failed to load:', e.target.src);
                            e.target.style.display='none';
                          }}
                        />
                      : <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:6}}>
                          <Image style={{width:26,height:26,color:"#94a3b8"}}/><span style={{fontSize:10,color:"#94a3b8"}}>No photo</span>
                        </div>}
                    <span style={{position:"absolute",top:8,right:8,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:999,background:wf.bg,color:wf.color}}>{wf.label}</span>
                    {s.docVerification?.identityPassed && (
                      <span style={{position:"absolute",bottom:8,left:8,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:999,background:"rgba(22,163,74,0.9)",color:"white"}}>✔ Verified</span>
                    )}
                  </div>
                  {/* Body */}
                  <div style={{padding:"14px 16px"}}>
                    <p style={{fontWeight:700,fontSize:14,color:"#0f172a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                    <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 10px"}}>{s.category} · {s.location}</p>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <p style={{fontSize:14,fontWeight:700,color:"#2563eb",margin:0}}>{s.price>0?`₹${s.price}`:"Free"}</p>
                      <div style={{display:"flex",gap:10,fontSize:11,color:"#64748b"}}>
                        <span>📅 {s.totalBookings||0} bookings</span>
                        <span>⭐ {s.averageRating?.toFixed(1)||"—"}</span>
                      </div>
                    </div>
                    {/* Action hints */}
                    {s.workflowStatus==="payment_pending" && <div style={{marginBottom:10,padding:"7px 10px",background:"#fffbeb",borderRadius:8,border:"1px solid #fde68a",fontSize:11,color:"#b45309",fontWeight:600}}>⚠️ Payment required to publish</div>}
                    {s.workflowStatus==="docs_pending"    && <div style={{marginBottom:10,padding:"7px 10px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",fontSize:11,color:"#b91c1c",fontWeight:600}}>📄 Documents required</div>}
                    {s.workflowStatus==="rejected"        && <div style={{marginBottom:10,padding:"7px 10px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",fontSize:11,color:"#b91c1c",fontWeight:600}}>❌ Documents rejected — please re-upload</div>}
                    {/* Quick actions */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[
                        {label:"View Listing", action:()=>handleCardClick(s),          style:{bg:"#eff6ff",color:"#2563eb",border:"#bfdbfe"}},
                        {label:"Edit Service", action:()=>setEditSvc(s),               style:{bg:"#f8fafc",color:"#475569",border:"#e2e8f0"}},
                        {label:"Delete",       action:()=>setDeleteSvc(s),             style:{bg:"#fef2f2",color:"#dc2626",border:"#fecaca"}},
                        {label:s.workflowStatus==="published"?"Published ✔":"Setup",   action:()=>handleCardClick(s), style:{bg:"#f0fdf4",color:"#16a34a",border:"#bbf7d0"}},
                      ].map(({label,action,style:st})=>(
                        <button key={label} onClick={action}
                          style={{padding:"7px 4px",borderRadius:8,border:`1px solid ${st.border}`,
                            background:st.bg,color:st.color,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── Empty state onboarding ── */
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:20,padding:"48px 32px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16}}>🚀</div>
            <h3 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:"0 0 8px"}}>Set up your first service</h3>
            <p style={{fontSize:14,color:"#64748b",margin:"0 0 28px",lineHeight:1.7,maxWidth:420,marginLeft:"auto",marginRight:"auto"}}>
              Start accepting bookings by listing your service on TrustBridge. Verified providers get featured placement.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,maxWidth:480,margin:"0 auto 28px"}}>
              {[
                {icon:"🏢",label:"Add First Service",   sub:"Create and list your service",         action:()=>setShowWizard(true),                           primary:true},
                {icon:"👤",label:"Complete Profile",     sub:"Update your business profile",         action:()=>nav("/profile"),                               primary:false},
                {icon:"📖",label:"Provider Help Guide", sub:"Learn how TrustBridge works",          action:()=>window.open("/help","_blank"),                  primary:false},
                {icon:"💼",label:"Contact Support",      sub:"Get help from our team",               action:()=>window.open("/contact","_blank"),               primary:false},
              ].map(({icon,label,sub,action,primary})=>(
                <button key={label} onClick={action}
                  style={{padding:"16px",borderRadius:14,border:`1.5px solid ${primary?"#2563eb":"#e2e8f0"}`,
                    background:primary?"#eff6ff":"#f8fafc",cursor:"pointer",textAlign:"left",
                    display:"flex",flexDirection:"column",gap:4,
                    transition:"box-shadow 0.15s, transform 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                  <span style={{fontSize:22}}>{icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:primary?"#1d4ed8":"#0f172a"}}>{label}</span>
                  <span style={{fontSize:11,color:"#94a3b8"}}>{sub}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowWizard(true)}
              style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",
                fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}}>
              <Plus style={{width:14,height:14,display:"inline",marginRight:6}}/>Get Started
            </button>
          </div>
        )
      )}

      {/* ── Bookings tab ── */}
      {tab === "Bookings" && (
        <div>
          {/* Status summary pills */}
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {[
              {label:"Pending",   count:books.filter(b=>b.status==="pending").length,   bg:"#fffbeb",border:"#fde68a",color:"#b45309"},
              {label:"Confirmed", count:books.filter(b=>b.status==="confirmed").length, bg:"#eff6ff",border:"#bfdbfe",color:"#2563eb"},
              {label:"Completed", count:books.filter(b=>b.status==="completed").length, bg:"#f0fdf4",border:"#bbf7d0",color:"#16a34a"},
              {label:"Cancelled", count:books.filter(b=>b.status==="cancelled").length, bg:"#fef2f2",border:"#fecaca",color:"#dc2626"},
            ].map(({label,count,bg,border,color})=>(
              <div key={label} style={{padding:"10px 18px",borderRadius:10,background:bg,border:`1.5px solid ${border}`,minWidth:100}}>
                <p style={{fontSize:20,fontWeight:800,color,margin:0,lineHeight:1}}>{count}</p>
                <p style={{fontSize:11,fontWeight:600,color,margin:"3px 0 0"}}>{label}</p>
              </div>
            ))}
          </div>
          {/* Link to full bookings page */}
          <div style={{marginBottom:16}}>
            <a href="/bookings" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,
              color:"#2563eb",textDecoration:"none",padding:"8px 16px",borderRadius:9,
              background:"#eff6ff",border:"1.5px solid #bfdbfe"}}>
              Manage All Bookings →
            </a>
          </div>
          {/* Booking list */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {books.length > 0 ? books.map((b,i) => {
              const statusStyle = {
                pending:  {bg:"#fffbeb",color:"#b45309",border:"#fde68a"},
                confirmed:{bg:"#eff6ff",color:"#2563eb",border:"#bfdbfe"},
                completed:{bg:"#f0fdf4",color:"#16a34a",border:"#bbf7d0"},
                cancelled:{bg:"#fef2f2",color:"#dc2626",border:"#fecaca"},
              }[b.status] || {bg:"#f8fafc",color:"#64748b",border:"#e2e8f0"};
              return (
                <motion.div key={b._id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                  style={{background:"#fff",border:"1.5px solid #f1f5f9",borderRadius:12,padding:"14px 18px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
                    boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,fontSize:14,color:"#0f172a",margin:"0 0 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {b.service?.title}
                    </p>
                    <p style={{fontSize:12,color:"#64748b",margin:0}}>
                      {b.newcomer?.name || b.user?.name || "Customer"} · {new Date(b.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}{b.time ? ` · ${b.time}` : ""}
                    </p>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,
                    background:statusStyle.bg,color:statusStyle.color,border:`1px solid ${statusStyle.border}`,
                    textTransform:"capitalize",whiteSpace:"nowrap"}}>
                    {b.status}
                  </span>
                </motion.div>
              );
            }) : (
              <div style={{textAlign:"center",padding:"48px 24px",background:"#fff",border:"1.5px dashed #e2e8f0",borderRadius:16}}>
                <p style={{fontSize:36,margin:"0 0 12px"}}>📅</p>
                <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>No bookings yet</p>
                <p style={{fontSize:13,color:"#64748b",margin:0}}>Bookings will appear here once customers book your services.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Analytics tab ── */}
      {tab === "Analytics" && (
        an?.totalBookings === 0 && an?.totalServices === 0 ? (
          <div style={{textAlign:"center",padding:"48px 24px",background:"#fff",border:"1.5px dashed #e2e8f0",borderRadius:16}}>
            <p style={{fontSize:36,margin:"0 0 12px"}}>📈</p>
            <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:"0 0 6px"}}>No analytics available yet</p>
            <p style={{fontSize:13,color:"#64748b",margin:0,lineHeight:1.6}}>
              Analytics will appear once you receive bookings and reviews.<br/>Add your first service to get started.
            </p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {/* KPI grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
              {[
                {icon:"🏢",label:"Total Services",    value:an?.totalServices||0,                          bg:"#eff6ff",border:"#bfdbfe",text:"#1d4ed8"},
                {icon:"✅",label:"Active Services",   value:an?.activeServices||0,                         bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d"},
                {icon:"📅",label:"Total Bookings",    value:an?.totalBookings||0,                          bg:"#faf5ff",border:"#ddd6fe",text:"#7c3aed"},
                {icon:"✅",label:"Completed",         value:an?.completedBookings||0,                      bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d"},
                {icon:"⏳",label:"Pending",           value:an?.pendingBookings||0,                        bg:"#fffbeb",border:"#fde68a",text:"#b45309"},
                {icon:"⭐",label:"Avg Rating",        value:an?.averageRating?an.averageRating.toFixed(1):"—",bg:"#fffbeb",border:"#fde68a",text:"#b45309"},
                {icon:"💰",label:"Total Revenue",     value:`₹${an?.revenue||0}`,                         bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d"},
                {icon:"⭐",label:"Reviews",           value:svcs.reduce((t,s)=>t+(s.totalReviews||0),0),  bg:"#eff6ff",border:"#bfdbfe",text:"#1d4ed8"},
              ].map(m => (
                <div key={m.label} style={{background:m.bg,border:`1.5px solid ${m.border}`,borderRadius:14,padding:"18px 20px"}}>
                  <p style={{fontSize:24,margin:"0 0 8px"}}>{m.icon}</p>
                  <p style={{fontSize:"1.6rem",fontWeight:800,color:m.text,margin:"0 0 3px",lineHeight:1}}>{m.value}</p>
                  <p style={{fontSize:11,color:"#64748b",margin:0,fontWeight:600}}>{m.label}</p>
                </div>
              ))}
            </div>
            {/* Revenue breakdown */}
            <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:16,padding:"20px 24px"}}>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",margin:"0 0 16px"}}>Revenue Breakdown</h3>
              {(() => {
                const gross    = an?.revenue || 0;
                const platFee  = Math.round(gross * 0.10);
                const net      = gross - platFee;
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {[
                      {label:"Gross Revenue",  value:`₹${gross}`,   sub:"Total earned",       color:"#2563eb"},
                      {label:"Platform Fee",   value:`₹${platFee}`, sub:"10% service charge", color:"#dc2626"},
                      {label:"Net Earnings",   value:`₹${net}`,     sub:"Your take-home",      color:"#16a34a"},
                    ].map(r=>(
                      <div key={r.label} style={{padding:"16px",background:"#f8fafc",borderRadius:12,border:"1.5px solid #e2e8f0"}}>
                        <p style={{fontSize:"1.3rem",fontWeight:800,color:r.color,margin:"0 0 4px"}}>{r.value}</p>
                        <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 2px"}}>{r.label}</p>
                        <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{r.sub}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            {/* Subscription */}
            {sub && (
              <div style={{background:sub.status==="active"?"#f0fdf4":"#fffbeb",border:`1.5px solid ${sub.status==="active"?"#bbf7d0":"#fde68a"}`,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"0 0 2px"}}>Subscription — {sub.plan?.charAt(0).toUpperCase()+(sub.plan?.slice(1)||"")} Plan</p>
                  <p style={{fontSize:11,color:"#64748b",margin:0}}>
                    Status: <strong style={{color:sub.status==="active"?"#16a34a":"#d97706",textTransform:"capitalize"}}>{sub.status}</strong>
                    {sub.endDate && ` · Renews ${new Date(sub.endDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`}
                  </p>
                </div>
                <button onClick={()=>setShowPlans(true)}
                  style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Manage Plan
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Plans modal */}
      <AnimatePresence>
        {showPlans && (
          <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowPlans(false);}}>
            <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
              style={{background:"white",borderRadius:18,width:"100%",maxWidth:720,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}>
                <h3 style={{fontWeight:800,color:"#0f172a",fontSize:16,margin:0}}>Choose a Subscription Plan</h3>
                <button onClick={() => setShowPlans(false)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                  <X style={{width:18,height:18,color:"#64748b"}}/>
                </button>
              </div>
              <div style={{padding:24}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}} className="plans-grid">
                  {PLANS_STATIC.map(p => (
                    <motion.div key={p.key} whileHover={{y:-3}}
                      style={{background:"#fff",borderRadius:14,padding:"20px 18px",
                        border:p.highlight?"2px solid #2563eb":"1.5px solid #e2e8f0",
                        boxShadow:p.highlight?"0 4px 20px rgba(37,99,235,0.12)":"0 1px 4px rgba(0,0,0,0.04)",
                        position:"relative"}}>
                      {p.badge && (
                        <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:"#2563eb",
                          color:"white",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:999}}>
                          {p.badge}
                        </span>
                      )}
                      <p style={{fontWeight:700,color:"#0f172a",margin:"0 0 4px",fontSize:15}}>{p.name}</p>
                      <div style={{display:"flex",alignItems:"flex-end",gap:2,marginBottom:14}}>
                        <span style={{fontSize:24,fontWeight:800,color:"#2563eb"}}>{p.price}</span>
                        <span style={{fontSize:11,color:"#94a3b8",paddingBottom:2}}>{p.period}</span>
                      </div>
                      <ul style={{listStyle:"none",padding:0,margin:"0 0 16px",display:"flex",flexDirection:"column",gap:6}}>
                        {p.features.map(f => (
                          <li key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#64748b"}}>
                            <CheckCircle style={{width:11,height:11,color:"#16a34a",flexShrink:0}}/>{f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => subscribe(p.key)}
                        style={{width:"100%",background:p.highlight?"#2563eb":"white",color:p.highlight?"white":"#2563eb",
                          border:`1.5px solid #2563eb`,borderRadius:9,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        Subscribe {p.price}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Service Wizard (new) */}
      <AnimatePresence>
        {showWizard && (
          <CreateServiceWizard
            onClose={() => setShowWizard(false)}
            onCreated={() => { load(); setShowWizard(false); }}
          />
        )}
      </AnimatePresence>

      {/* Resume Wizard (continue from incomplete step) */}
      <AnimatePresence>
        {resumeWizard && (
          <CreateServiceWizard
            resumeServiceId={resumeWizard.serviceId}
            resumeStep={resumeWizard.startStep}
            resumeFormData={resumeWizard.formData}
            onClose={() => setResumeWizard(null)}
            onCreated={() => { load(); setResumeWizard(null); }}
          />
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {detailSvc && (
          <ServiceDetailModal
            service={detailSvc}
            onClose={() => setDetailSvc(null)}
            onEdit={() => {
                const svc = detailSvc;
                console.log('[Dashboard] Edit clicked for service:', svc?._id, svc?.title);
                setDetailSvc(null);
                setTimeout(() => setEditSvc(svc), 50); // small delay ensures detailSvc modal unmounts first
              }}
            onDelete={() => { setDeleteSvc(detailSvc); setDetailSvc(null); }}
            onContinuePayment={() => {
              const svc = detailSvc;
              setDetailSvc(null);
              // Resume at plan selection (step 4) so user picks a plan before paying
              setResumeWizard({ serviceId: svc._id, startStep: 4 });
            }}
            onReverify={() => {
              const svc = detailSvc;
              setDetailSvc(null);
              setResumeWizard({ serviceId: svc._id, startStep: 3 });
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editSvc && (
          <EditServiceModal
            service={editSvc}
            onClose={() => setEditSvc(null)}
            onSaved={() => { setEditSvc(null); load(); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteSvc && (
          <DeleteConfirmModal
            serviceName={deleteSvc.title}
            onConfirm={handleDelete}
            onCancel={() => setDeleteSvc(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>

      <style>{`@media(max-width:640px){.plans-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}
