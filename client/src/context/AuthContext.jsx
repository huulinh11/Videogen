import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('videogen_admin_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data);
    } catch {
      localStorage.removeItem('videogen_admin_token');
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('videogen_admin_token', data.token);
    localStorage.setItem('videogen_admin_username', data.username);
    setUser({ username: data.username, authenticated: true });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('videogen_admin_token');
    localStorage.removeItem('videogen_admin_username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
