/**
 * PasswordField — reusable component with real-time validation, strength meter,
 * show/hide toggle, caps-lock warning, and confirm-password matching.
 *
 * Props:
 *   value         string   — controlled value
 *   onChange      fn       — (value) => void
 *   label         string   — field label (default "Password")
 *   placeholder   string
 *   autoComplete  string
 *   showRules     bool     — show the rules checklist (default true)
 *   showStrength  bool     — show the strength bar (default true)
 *   compact       bool     — smaller checklist layout for tight spaces
 */
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

/* ── Rules ── */
const RULES = [
  { key: "len",     label: "At least 8 characters",       test: v => v.length >= 8                 },
  { key: "upper",   label: "One uppercase letter (A-Z)",  test: v => /[A-Z]/.test(v)               },
  { key: "lower",   label: "One lowercase letter (a-z)",  test: v => /[a-z]/.test(v)               },
  { key: "number",  label: "One number (0-9)",             test: v => /[0-9]/.test(v)               },
  { key: "special", label: "One special character (!@#…)", test: v => /[^A-Za-z0-9]/.test(v)       },
  { key: "noSpace", label: "No spaces",                    test: v => !/\s/.test(v)                 },
];

/* ── Strength calculation ── */
function getStrength(value, passed) {
  if (!value) return null;
  const n = passed;
  if (n <= 1) return { level: 0, label: "Very Weak",   color: "#ef4444", width: "16%"  };
  if (n === 2) return { level: 1, label: "Weak",        color: "#f97316", width: "33%"  };
  if (n === 3) return { level: 2, label: "Fair",        color: "#eab308", width: "50%"  };
  if (n === 4) return { level: 3, label: "Good",        color: "#22c55e", width: "66%"  };
  if (n === 5) return { level: 4, label: "Strong",      color: "#16a34a", width: "83%"  };
  return              { level: 5, label: "Very Strong", color: "#15803d", width: "100%" };
}

export function PasswordField({
  value = "",
  onChange,
  label = "Password",
  placeholder = "Create a strong password",
  autoComplete = "new-password",
  showRules = true,
  showStrength = true,
  compact = false,
}) {
  const [show,      setShow]      = useState(false);
  const [focused,   setFocused]   = useState(false);
  const [capsOn,    setCapsOn]    = useState(false);
  const inputRef = useRef(null);

  /* Detect caps-lock */
  useEffect(() => {
    const onKey = (e) => { if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock")); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup",   onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, []);

  const results = RULES.map(r => ({ ...r, ok: value.length > 0 ? r.test(value) : null }));
  const passedCount = results.filter(r => r.ok === true).length;
  const allPassed   = results.every(r => r.ok === true);
  const strength    = getStrength(value, passedCount);

  const borderColor = !value    ? (focused ? "#2563eb" : "#e2e8f0")
                    : allPassed ? "#16a34a"
                    : focused   ? "#2563eb"
                    :             "#e2e8f0";
  const shadowColor = !value    ? (focused ? "rgba(37,99,235,0.1)" : "none")
                    : allPassed ? "rgba(22,163,74,0.12)"
                    : focused   ? "rgba(37,99,235,0.1)"
                    :             "none";

  return (
    <div>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>
        {label}
      </label>

      {/* Input */}
      <div style={{ position:"relative" }}>
        <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
          width:15, height:15, color: allPassed && value ? "#16a34a" : "#94a3b8",
          pointerEvents:"none", transition:"color 0.2s" }} />
        <input
          ref={inputRef}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", height:52, paddingLeft:42, paddingRight:46,
            border:`1.5px solid ${borderColor}`,
            boxShadow:`0 0 0 3px ${focused || (allPassed && value) ? shadowColor : "transparent"}`,
            borderRadius:11, fontSize:14, color:"#0f172a", background:"#fff",
            outline:"none", transition:"border-color 0.2s, box-shadow 0.2s",
            boxSizing:"border-box",
          }}
        />
        <button
          type="button"
          onClick={() => { setShow(s => !s); inputRef.current?.focus(); }}
          tabIndex={-1}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", padding:4,
            color:"#94a3b8", display:"flex", alignItems:"center",
            transition:"color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#374151"}
          onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
        >
          {show ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>

      {/* Caps-lock warning */}
      {capsOn && (
        <p style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#d97706",
          margin:"5px 0 0", fontWeight:600 }}>
          🔒 Caps Lock is ON
        </p>
      )}

      {/* Strength bar */}
      {showStrength && value.length > 0 && strength && (
        <div style={{ marginTop:9 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:4 }}>
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Strength</span>
            <span style={{ fontSize:11, fontWeight:700, color: strength.color,
              transition:"color 0.3s" }}>
              {strength.label}
            </span>
          </div>
          <div style={{ height:4, background:"#f1f5f9", borderRadius:999, overflow:"hidden" }}>
            <div style={{ height:"100%", width: strength.width, background: strength.color,
              borderRadius:999, transition:"width 0.35s ease, background 0.35s ease" }} />
          </div>
        </div>
      )}

      {/* Rules checklist */}
      {showRules && value.length > 0 && (
        <div style={{ marginTop:10,
          display:"grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr",
          gap: compact ? 4 : "4px 8px" }}>
          {results.map(r => (
            <div key={r.key} style={{ display:"flex", alignItems:"center", gap:5,
              fontSize:11, fontWeight:600,
              color: r.ok === true  ? "#16a34a"
                   : r.ok === false ? "#ef4444"
                   : "#94a3b8",
              transition:"color 0.2s" }}>
              <span style={{ fontSize:12, lineHeight:1, flexShrink:0 }}>
                {r.ok === true ? "✓" : r.ok === false ? "✗" : "○"}
              </span>
              {r.label}
            </div>
          ))}
        </div>
      )}

      {/* Static hint when field is empty */}
      {value.length === 0 && (
        <p style={{ fontSize:11, color:"#94a3b8", margin:"6px 0 0" }}>
          Min. 8 chars · uppercase · lowercase · number · special character
        </p>
      )}
    </div>
  );
}

/* ── Confirm Password Field ── */
export function ConfirmPasswordField({
  value = "",
  password = "",
  onChange,
  label = "Confirm Password",
  placeholder = "Re-enter your password",
}) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const matches  = value.length > 0 && value === password;
  const mismatch = value.length > 0 && value !== password;

  const borderColor = mismatch ? "#ef4444" : matches ? "#16a34a" : focused ? "#2563eb" : "#e2e8f0";
  const shadowColor = mismatch ? "rgba(239,68,68,0.1)" : matches ? "rgba(22,163,74,0.12)" : focused ? "rgba(37,99,235,0.1)" : "none";

  return (
    <div>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>
        {label}
      </label>
      <div style={{ position:"relative" }}>
        <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
          width:15, height:15,
          color: matches ? "#16a34a" : mismatch ? "#ef4444" : "#94a3b8",
          pointerEvents:"none", transition:"color 0.2s" }} />
        <input
          ref={inputRef}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", height:52, paddingLeft:42, paddingRight:46,
            border:`1.5px solid ${borderColor}`,
            boxShadow:`0 0 0 3px ${focused || matches || mismatch ? shadowColor : "transparent"}`,
            borderRadius:11, fontSize:14, color:"#0f172a", background:"#fff",
            outline:"none", transition:"border-color 0.2s, box-shadow 0.2s",
            boxSizing:"border-box",
          }}
        />
        <button
          type="button"
          onClick={() => { setShow(s => !s); inputRef.current?.focus(); }}
          tabIndex={-1}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", padding:4,
            color:"#94a3b8", display:"flex", alignItems:"center" }}
        >
          {show ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>

      {value.length > 0 && (
        <p style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600,
          margin:"6px 0 0",
          color: matches ? "#16a34a" : "#ef4444",
          transition:"color 0.2s" }}>
          <span>{matches ? "✓" : "✗"}</span>
          {matches ? "Passwords match" : "Passwords do not match"}
        </p>
      )}
    </div>
  );
}

/* ── Helper: check all rules pass (use to disable submit buttons) ── */
export function isPasswordValid(value) {
  return RULES.every(r => r.test(value));
}
