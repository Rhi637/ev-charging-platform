import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ev_token');
    if (token) {
      authAPI.getProfile()
        .then(setUser)
        .catch(() => localStorage.removeItem('ev_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    const data = await authAPI.login(phone, password);
    localStorage.setItem('ev_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (phone, password, name) => {
    const data = await authAPI.register(phone, password, name);
    localStorage.setItem('ev_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ev_token');
    setUser(null);
  };

  const updateProfile = async (name) => {
    const data = await authAPI.updateProfile(name);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return context;
}
