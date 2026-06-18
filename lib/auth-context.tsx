'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  avatar?: string;
  permissions: string[];
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
  isPrimary: boolean;
  projectId: string | null;
}

interface AuthContextType {
  user: User | null;
  contractor: Contractor | null;
  sites: Site[];
  selectedSiteId: string | null;
  selectedSite: Site | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  setSelectedSite: (siteId: string) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessionFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      const contractorStr = localStorage.getItem('contractor');
      const sitesStr = localStorage.getItem('sites');
      const selectedSiteIdStr = localStorage.getItem('selectedSiteId');

      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      if (contractorStr) {
        setContractor(JSON.parse(contractorStr));
      }
      if (sitesStr) {
        setSites(JSON.parse(sitesStr));
      }
      if (selectedSiteIdStr) {
        setSelectedSiteId(selectedSiteIdStr);
      }
    } catch (error) {
      console.error('Failed to load session from storage:', error);
    }
  };

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        
        setUser(data.user);
        setContractor(data.contractor);
        setSites(data.sites || []);
        setSelectedSiteId(data.selectedSiteId || null);
        
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.contractor) {
          localStorage.setItem('contractor', JSON.stringify(data.contractor));
        }
        if (data.sites) {
          localStorage.setItem('sites', JSON.stringify(data.sites));
        }
        if (data.selectedSiteId) {
          localStorage.setItem('selectedSiteId', data.selectedSiteId);
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      loadSessionFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessionFromStorage();
    setIsLoading(false);
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('contractor');
      localStorage.removeItem('sites');
      localStorage.removeItem('selectedSiteId');
      
      setUser(null);
      setContractor(null);
      setSites([]);
      setSelectedSiteId(null);
      
      router.push('/login');
    }
  };

  const setSelectedSite = async (siteId: string) => {
    try {
      const response = await fetch('/api/auth/select-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      if (response.ok) {
        setSelectedSiteId(siteId);
        localStorage.setItem('selectedSiteId', siteId);
      } else {
        const error = await response.json();
        console.error('Failed to select site:', error);
      }
    } catch (error) {
      console.error('Failed to select site:', error);
    }
  };

  const selectedSite = sites.find(site => site.id === selectedSiteId) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        contractor,
        sites,
        selectedSiteId,
        selectedSite,
        isAuthenticated: !!user,
        isLoading,
        logout,
        setSelectedSite,
        refreshSession,
      }}
    >
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