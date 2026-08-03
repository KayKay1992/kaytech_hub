import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kaytech_token';
const USER_KEY = 'kaytech_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Confirm the stored token is still valid on first load.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persistSession(res.data);
    return res.data.user;
  };

  // Builds multipart/form-data when a `photo` File is present, otherwise
  // sends plain JSON — mirrors the pattern used for other image uploads.
  const toRequestBody = (payload) => {
    if (!(payload.photo instanceof File)) return payload;
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value);
    });
    return formData;
  };

  // Deliberately does not log the user in — after registering they land on
  // the login page and sign in explicitly.
  const register = async (payload) => {
    const res = await api.post('/auth/register', toRequestBody(payload));
    return res.data.user;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  };

  // Updates the logged-in user's own profile and refreshes the cached
  // session so the Topbar/UserMenu reflect the change immediately.
  const updateProfile = async (payload) => {
    const res = await api.patch('/auth/profile', toRequestBody(payload));
    const token = localStorage.getItem(TOKEN_KEY);
    persistSession({ token, user: res.data.user });
    return res.data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
