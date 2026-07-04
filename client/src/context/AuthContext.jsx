import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await userAPI.getMe();
      setUser(data.data.user);
      setProfile(data.data.profile);
    } catch (err) {
      // Only clear on 401 — don't wipe tokens on network errors
      if (err.response?.status === 401) {
        localStorage.clear();
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    try { await loadUser(); } catch { /* non-fatal */ }
    return data.data.user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    // loadUser enriches the profile — if it fails, registration still succeeded
    try { await loadUser(); } catch { /* non-fatal */ }
    return data.data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setProfile(null);
  };

  const loginWithGoogle = async (credential, role) => {
    const { data } = await authAPI.googleAuth(credential, role);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    try { await loadUser(); } catch { /* non-fatal */ }
    return data.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, loginWithGoogle, logout, loadUser, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
