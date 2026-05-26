import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "@/lib/api";

export interface DecodedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  exp?: number;
}

interface AuthContextType {
  user: DecodedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("eaduan_token");
    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedUser>(storedToken);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          handleLogout();
        } else {
          setTokenState(storedToken);
          setUser(decoded);
          setAuthToken(storedToken);
        }
      } catch {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<DecodedUser>(newToken);
      localStorage.setItem("eaduan_token", newToken);
      setTokenState(newToken);
      setUser(decoded);
      setAuthToken(newToken);
    } catch {
      // invalid token
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eaduan_token");
    setTokenState(null);
    setUser(null);
    setAuthToken(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
