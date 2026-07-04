import { useState, useEffect } from "react";
import { Lock, Bell, Shield, Eye, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userAPI } from "../services/api";

/* ── Toggle row — auto-saves on change ── */
function ToggleRow({ label, sublabel, checked, saving, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"14px 0", borderBottom:"1px solid #f8fafc" }}>
      <div style={{ paddingRight: 16 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 2px" }}>{label}</p>
        {sublabel && <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{sublabel}</p>}
      </div>
      <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
        {saving && <Loader2 size={13} style={{ color:"#94a3b8", animation:"spin 1s linear infinite" }} />}
        <div
          onClick={() => { if (!saving) onChange(!checked); }}
          style={{ width:40, height:22, borderRadius:999,
            background: checked ? "#2563eb" : "#e2e8f0",
            cursor: saving ? "not-allowed" : "pointer",
            position:"relative", transition:"background 0.2s",
            opacity: saving ? 0.6 : 1 }}>
          <div style={{ width:18, height:18, borderRadius:"50%", background:"white",
            position:"absolute", top:2, left: checked ? 20 : 2,
            transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.15)" }} />
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:16,
      padding:"20px 22px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"#eff6ff",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon style={{ width:15, height:15, color:"#2563eb" }} />
        </div>
        <h2 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  /* ── state ── */
  const [loading,  setLoading]  = useState(true);
  const [notifs,   setNotifs]   = useState({ email:true, push:true, community:false });
  const [privacy,  setPrivacy]  = useState({ profileVisible:true, openMessaging:true });
  const [saving,   setSaving]   = useState({});   // { key: true } while a single toggle is saving
  const [pwd,      setPwd]      = useState({ current:"", next:"", confirm:"" });
  const [pwdSaving,setPwdSaving]= useState(false);

  if (!user) { nav("/login"); return null; }

  /* ── load settings on mount ── */
  useEffect(() => {
    userAPI.getSettings()
      .then(({ data }) => {
        const s = data.data;
        if (s?.notifications) setNotifs(n => ({ ...n, ...s.notifications }));
        if (s?.privacy)       setPrivacy(p => ({ ...p, ...s.privacy }));
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  /* ── auto-save a single notification toggle ── */
  const toggleNotif = async (key, val) => {
    const prev = notifs[key];
    setNotifs(n => ({ ...n, [key]: val }));
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await userAPI.updateSettings({ notifications: { [key]: val } });
      toast.success("Settings updated successfully.");
    } catch {
      setNotifs(n => ({ ...n, [key]: prev }));
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  /* ── auto-save a single privacy toggle ── */
  const togglePrivacy = async (key, val) => {
    const prev = privacy[key];
    setPrivacy(p => ({ ...p, [key]: val }));
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await userAPI.updateSettings({ privacy: { [key]: val } });
      toast.success("Settings updated successfully.");
    } catch {
      setPrivacy(p => ({ ...p, [key]: prev }));
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  /* ── change password ── */
  const handlePwdChange = async (e) => {
    e.preventDefault();
    if (!pwd.current.trim()) { toast.error("Please enter your current password."); return; }
    if (pwd.next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (pwd.next !== pwd.confirm) { toast.error("Passwords do not match."); return; }
    setPwdSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwd.current, newPassword: pwd.next });
      toast.success("Password updated successfully.");
      setPwd({ current:"", next:"", confirm:"" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div style={{ background:"#f8fafc", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"24px 0 20px" }}>
        <div className="wrap">
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>Settings</h1>
          <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
            Manage notifications, privacy preferences, and account security settings.
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:28, paddingBottom:56, maxWidth:680 }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
            <Loader2 size={28} style={{ color:"#2563eb", animation:"spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Notifications */}
            <Section icon={Bell} title="Notifications">
              <ToggleRow
                label="Email Notifications"
                sublabel="Receive booking updates, verification results, and important alerts via email."
                checked={notifs.email}
                saving={!!saving.email}
                onChange={v => toggleNotif("email", v)}
              />
              <ToggleRow
                label="Push Notifications"
                sublabel="Get instant alerts for bookings, reviews, recommendations, and account activity."
                checked={notifs.push}
                saving={!!saving.push}
                onChange={v => toggleNotif("push", v)}
              />
              <ToggleRow
                label="Community Notifications"
                sublabel="Receive updates when someone answers your questions or interacts with your posts."
                checked={notifs.community}
                saving={!!saving.community}
                onChange={v => toggleNotif("community", v)}
              />
            </Section>

            {/* Privacy */}
            <Section icon={Eye} title="Privacy">
              <ToggleRow
                label="Profile Visibility"
                sublabel="Allow other TrustBridge members to view your profile and community contributions."
                checked={privacy.profileVisible}
                saving={!!saving.profileVisible}
                onChange={v => togglePrivacy("profileVisible", v)}
              />
              <ToggleRow
                label="Open Messaging"
                sublabel="Allow verified community members and local guides to contact you through TrustBridge."
                checked={privacy.openMessaging}
                saving={!!saving.openMessaging}
                onChange={v => togglePrivacy("openMessaging", v)}
              />
            </Section>

            {/* Security */}
            <Section icon={Lock} title="Security">
              <p style={{ fontSize:12, color:"#64748b", margin:"0 0 16px" }}>
                Keep your account secure by updating your password regularly.
              </p>
              <form onSubmit={handlePwdChange} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { label:"Current Password", key:"current" },
                  { label:"New Password (min 8 chars)", key:"next" },
                  { label:"Confirm New Password", key:"confirm" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:12, fontWeight:600,
                      color:"#374151", marginBottom:6 }}>{f.label}</label>
                    <input
                      type="password"
                      value={pwd[f.key]}
                      onChange={e => setPwd({ ...pwd, [f.key]: e.target.value })}
                      disabled={pwdSaving}
                      style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0",
                        borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none",
                        boxSizing:"border-box", transition:"border-color 0.15s",
                        opacity: pwdSaving ? 0.6 : 1 }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                ))}
                <button type="submit" disabled={pwdSaving}
                  style={{ display:"flex", alignItems:"center", gap:7,
                    padding:"10px 20px", borderRadius:9,
                    background: pwdSaving ? "#93c5fd" : "#2563eb",
                    color:"white", border:"none", fontSize:13, fontWeight:700,
                    cursor: pwdSaving ? "not-allowed" : "pointer", alignSelf:"flex-start" }}>
                  {pwdSaving && <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} />}
                  {pwdSaving ? "Updating…" : "Update Password"}
                </button>
              </form>

              {/* 2FA — coming soon */}
              <div style={{ marginTop:16, padding:"12px 14px", background:"#f8fafc",
                borderRadius:10, border:"1px solid #e2e8f0",
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 2px" }}>
                    Two-Factor Authentication
                  </p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>
                    This feature will be available in a future update.
                  </p>
                </div>
                <ChevronRight style={{ width:15, height:15, color:"#94a3b8" }} />
              </div>
            </Section>

            {/* Account */}
            <Section icon={Shield} title="Account">
              <p style={{ fontSize:12, color:"#64748b", margin:"0 0 14px" }}>
                All changes are saved automatically when you toggle a setting.
              </p>
              <button
                onClick={() => nav("/profile")}
                style={{ padding:"10px 20px", borderRadius:9, background:"white",
                  color:"#475569", border:"1.5px solid #e2e8f0", fontSize:13,
                  fontWeight:600, cursor:"pointer" }}>
                View Profile
              </button>
            </Section>

          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
