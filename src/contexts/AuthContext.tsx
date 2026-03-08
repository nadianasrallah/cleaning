import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, Company, Branding } from '@/lib/api';

interface AuthState {
  user: User | null;
  company: Company | null;
  branding: Branding | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  role: 'owner' | 'client';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    company: null,
    branding: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      refreshUser().catch(() => {
        api.setToken(null);
        setState(prev => ({ ...prev, isLoading: false }));
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  async function refreshUser() {
    try {
      const data = await api.get<{ user: User; company: Company | null; branding: Branding | null }>('/auth/me');
      setState({
        user: data.user,
        company: data.company,
        branding: data.branding,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const data = await api.post<{ token: string; user: User; company: Company | null }>('/auth/login', { email, password });
    api.setToken(data.token);
    await refreshUser();
    return data.user;
  }

  async function register(registerData: RegisterData): Promise<User> {
    const data = await api.post<{ token: string; user: User; company: Company | null }>('/auth/register', registerData);
    api.setToken(data.token);
    await refreshUser();
    return data.user;
  }

  function logout() {
    api.setToken(null);
    setState({
      user: null,
      company: null,
      branding: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
