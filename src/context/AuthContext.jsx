import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'demo-admin',
  name: '演示管理员',
  phone: '13800000000',
  role: 'admin',
  balance: 1000,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ev_token');
    if (token) {
      try {
        const data = JSON.parse(atob(token.split('.')[1] || ''));
        if (data && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('ev_token');
        }
      } catch {
        localStorage.removeItem('ev_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const demoUser = { ...DEMO_USER, phone, name: '演示用户' };
    const fakeToken = 'demo.' + btoa(JSON.stringify({ user: demoUser })) + '.demo';
    localStorage.setItem('ev_token', fakeToken);
    setUser(demoUser);
    return { user: demoUser };
  };

  const register = async (phone, password, name) => {
    const demoUser = { ...DEMO_USER, phone, name };
    const fakeToken = 'demo.' + btoa(JSON.stringify({ user: demoUser })) + '.demo';
    localStorage.setItem('ev_token', fakeToken);
    setUser(demoUser);
    return { user: demoUser };
  };

  const logout = () => {
    localStorage.removeItem('ev_token');
    setUser(null);
  };

  const updateProfile = async (name) => {
    const updated = { ...user, name };
    setUser(updated);
    return updated;
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