import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved auth from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('smartcart_token');
    const savedUser = localStorage.getItem('smartcart_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenStr, userData) => {
    setToken(tokenStr);
    setUser(userData);
    localStorage.setItem('smartcart_token', tokenStr);
    localStorage.setItem('smartcart_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartcart_token');
    localStorage.removeItem('smartcart_user');
  };

  const isLoggedIn = !!token;
  const isRetailer = user?.role === 'retailer';
  const isUser = user?.role === 'user';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isLoggedIn, isRetailer, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}
