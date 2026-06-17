'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

interface Contractor {
  id: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  licenseNo: string;
  userId: string;
}

interface Site {
  id: string;
  name: string;
  location: string;
  status: string;
  projectId: string | null;
  contractorId: string;
}

interface AuthContextType {
  user: User | null;
  contractor: Contractor | null;
  sites: Site[];
  hasPermission: (permission: string) => boolean;
  setAuthData: (user: User | null, contractor: Contractor | null, sites: Site[]) => void;
  updateContractor: (contractor: Contractor | null) => void;
  updateSites: (sites: Site[]) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedContractor = localStorage.getItem('contractor');
    const storedSites = localStorage.getItem('sites');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedContractor) setContractor(JSON.parse(storedContractor));
    if (storedSites) setSites(JSON.parse(storedSites));
  }, []);

  const setAuthData = (user: User | null, contractor: Contractor | null, sites: Site[]) => {
    setUser(user);
    setContractor(contractor);
    setSites(sites);

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');

    if (contractor) localStorage.setItem('contractor', JSON.stringify(contractor));
    else localStorage.removeItem('contractor');

    localStorage.setItem('sites', JSON.stringify(sites));
  };

  const updateContractor = (contractor: Contractor | null) => {
    setContractor(contractor);
    if (contractor) localStorage.setItem('contractor', JSON.stringify(contractor));
    else localStorage.removeItem('contractor');
  };

  const updateSites = (sites: Site[]) => {
    setSites(sites);
    localStorage.setItem('sites', JSON.stringify(sites));
  };

  const clearAuth = () => {
    setUser(null);
    setContractor(null);
    setSites([]);
    localStorage.removeItem('user');
    localStorage.removeItem('contractor');
    localStorage.removeItem('sites');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, contractor, sites, hasPermission, setAuthData, updateContractor, updateSites, clearAuth }}>
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