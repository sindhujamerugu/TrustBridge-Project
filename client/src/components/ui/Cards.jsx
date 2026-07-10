import { motion } from "framer-motion";
import { Star, MapPin, Shield, ArrowRight, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../services/api";

const CAT_FALLBACKS = {
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
const IMG = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop";

function Img({ src, alt, className, category }) {
  const fallback = (category && CAT_FALLBACKS[category]) || IMG;
  return <img src={src||fallback} alt={alt} className={className} loading="lazy"
    onError={e=>{e.target.onerror=null;e.target.src=fallback;}} />;
}

export function ServiceCard({ service, index=0 }) {
  return (
    <motion.article
      initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
      viewport={{once:true}} transition={{duration:0.3,delay:index*0.05}}
      className="card flex flex-col h-full overflow-hidden group"
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100">
        <Img
          src={service.images?.[0] ? getImageUrl(service.images[0]) : null}
          alt={service.title}
          category={service.category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {service.isFeatured && (
          <span className="absolute top-2.5 left-2.5 badge badge-amber text-[11px]">Featured</span>
        )}
        <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {service.category}
        </span>
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white text-[11px] font-semibold">{service.averageRating?.toFixed(1)||"New"}</span>
          <span className="text-white/60 text-[10px]">({service.totalReviews||0})</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 mb-1">{service.title}</h3>
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />{service.location}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
          {service.price>0
            ? <span className="font-bold text-slate-900 text-sm">₹{service.price.toLocaleString()}</span>
            : <span className="badge badge-green text-[11px]">Free</span>
          }
          <Link to={`/services/${service._id}`}
            className="btn btn-sm btn-primary">
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function ResidentCard({ resident, index=0 }) {
  const u = resident.user||resident;
  const trust = resident.trustScore||0;
  const fillClass = trust>=70?"trust-fill-high":trust>=40?"trust-fill-mid":"trust-fill-low";
  return (
    <motion.article
      initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}
      viewport={{once:true}} transition={{duration:0.3,delay:index*0.06}}
      className="card p-5 flex flex-col h-full"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
          {u.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{u.name}</h3>
            {resident.isVerifiedBadge && <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />{u.location||"Local Guide"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-slate-600">{resident.averageRating?.toFixed(1)||"New"}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-4">
        {resident.bio||"Verified local guide ready to help you settle in."}
      </p>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400 font-medium">Trust Score</span>
          <span className={`text-xs font-bold ${trust>=70?"text-emerald-600":trust>=40?"text-amber-600":"text-slate-400"}`}>{trust}/100</span>
        </div>
        <div className="trust-bar">
          <motion.div initial={{width:0}} whileInView={{width:`${Math.min(trust,100)}%`}}
            viewport={{once:true}} transition={{duration:0.7,delay:0.1}}
            className={`h-full rounded-full ${fillClass}`} />
        </div>
      </div>
      <Link to={`/chat?resident=${resident._id||resident.user?._id}`}
        className="btn btn-secondary w-full justify-center">Connect</Link>
    </motion.article>
  );
}

const ICON_COLORS = {
  blue:   "stat-icon-blue",
  green:  "stat-icon-green",
  amber:  "stat-icon-amber",
  purple: "stat-icon-purple",
  red:    "stat-icon-red",
};
const TEXT_COLORS = {
  blue:"text-blue-600", green:"text-emerald-600",
  amber:"text-amber-600", purple:"text-violet-600", red:"text-red-600",
};

export function StatCard({ icon:Icon, label, value, color="blue", trend }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ICON_COLORS[color]||ICON_COLORS.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend!==undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend>=0?"text-emerald-600":"text-red-500"}`}>
            {trend>=0?<TrendingUp className="w-3.5 h-3.5"/>:<TrendingDown className="w-3.5 h-3.5"/>}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold mb-0.5 ${TEXT_COLORS[color]||TEXT_COLORS.blue}`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

export function LoadingSpinner({ size="md" }) {
  const s={sm:"w-5 h-5",md:"w-7 h-7",lg:"w-10 h-10"}[size]||"w-7 h-7";
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className={`${s} text-blue-500 animate-spin`} />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  );
}

export function EmptyState({ icon:Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-4">{description}</p>
      {action}
    </div>
  );
}

export function SectionHeader({ title, subtitle, actionTo, actionLabel }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actionTo && actionLabel && (
        <Link to={actionTo} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap mt-0.5">
          {actionLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}