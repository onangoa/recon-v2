'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, refreshOnce, setAuthCallbacks, type AuthRefreshData } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  avatar?: string | null;
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
  needsOnboarding: boolean;
  hasPermission: (permission: string) => boolean;
  setAuthData: (user: User | null, contractor: Contractor | null, sites: Site[], needsOnboarding?: boolean) => void;
  updateContractor: (contractor: Contractor | null) => void;
  updateSites: (sites: Site[]) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  setSelectedSite: (siteId: string) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/docs'];

const IDLE_TIMEOUT = 30 * 60 * 1000;
const PROACTIVE_REFRESH_INTERVAL = 13 * 60 * 1000;
const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const isRefreshingRef = useRef(false);
  const userRef = useRef<User | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearAllState = useCallback(() => {
    setUser(null);
    setContractor(null);
    setSites([]);
    setSelectedSiteId(null);
    setNeedsOnboarding(false);
    localStorage.removeItem('user');
    localStorage.removeItem('contractor');
    localStorage.removeItem('sites');
    localStorage.removeItem('selectedSiteId');
  }, []);

  const applyAuthData = useCallback((data: AuthRefreshData) => {
    setUser(data.user);
    setContractor(data.contractor);
    setSites(data.sites || []);
    setSelectedSiteId(data.selectedSiteId || null);
    setNeedsOnboarding(data.needsOnboarding || false);

    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.contractor) {
      localStorage.setItem('contractor', JSON.stringify(data.contractor));
    } else {
      localStorage.removeItem('contractor');
    }
    localStorage.setItem('sites', JSON.stringify(data.sites || []));
    if (data.selectedSiteId) {
      localStorage.setItem('selectedSiteId', data.selectedSiteId);
    } else {
      localStorage.removeItem('selectedSiteId');
    }
  }, []);

  useEffect(() => {
    setAuthCallbacks(applyAuthData, () => {
      clearAllState();
      router.push('/login');
    });
    return () => setAuthCallbacks(null, null);
  }, [applyAuthData, clearAllState, router]);

  const refreshSession = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const response = await apiFetch('/web/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        applyAuthData(data);
      } else {
        if (!userRef.current) {
          clearAllState();
        }
      }
    } catch {
      if (!userRef.current) {
        clearAllState();
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [applyAuthData, clearAllState]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/web/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAllState();
      router.push('/login');
    }
  }, [clearAllState, router]);

  const proactiveRefresh = useCallback(async () => {
    if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
      return;
    }
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      await refreshOnce();
    } catch (error) {
      console.error('Proactive refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      proactiveRefresh();
    }, PROACTIVE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, proactiveRefresh]);

  useEffect(() => {
    if (!user) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      lastActivityRef.current = Date.now();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT);
    };

    IDLE_EVENTS.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
        logout();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      IDLE_EVENTS.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(idleTimer);
    };
  }, [user, logout]);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/docs') && !pathname.startsWith('/web/api/')) {
      if (!pathname.includes('/auth/')) {
        const callbackUrl = encodeURIComponent(pathname);
        router.push(`/login?callbackUrl=${callbackUrl}`);
      }
      return;
    }

    if (user && contractor && needsOnboarding && user.role === 'contractor' && pathname.startsWith('/contractor') && !pathname.includes('/sites/create') && !pathname.includes('/sites/create?') && pathname !== '/contractor/sites/create') {
      router.push('/contractor/sites/create');
    }

    if (user && pathname.startsWith('/superadmin') && user.role !== 'superadmin') {
      router.push('/contractor');
    }
    if (user && user.role === 'superadmin' && pathname.startsWith('/contractor')) {
      router.push('/superadmin');
    }
  }, [user, contractor, isLoading, needsOnboarding, pathname, router]);

  const setSelectedSite = useCallback(async (siteId: string) => {
    setSelectedSiteId(siteId);
    localStorage.setItem('selectedSiteId', siteId);

    try {
      await fetch('/web/api/auth/select-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
    } catch (error) {
      console.error('Failed to select site:', error);
    }
  }, []);

  const setAuthData = useCallback((user: User | null, contractor: Contractor | null, sites: Site[], needsOnboarding?: boolean) => {
    setUser(user);
    setContractor(contractor);
    setSites(sites);
    if (needsOnboarding !== undefined) setNeedsOnboarding(needsOnboarding);

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');

    if (contractor) localStorage.setItem('contractor', JSON.stringify(contractor));
    else localStorage.removeItem('contractor');

    localStorage.setItem('sites', JSON.stringify(sites));
  }, []);

  const updateContractor = useCallback((contractor: Contractor | null) => {
    setContractor(contractor);
    if (contractor) localStorage.setItem('contractor', JSON.stringify(contractor));
    else localStorage.removeItem('contractor');
  }, []);

  const updateSites = useCallback((sites: Site[]) => {
    setSites(sites);
    localStorage.setItem('sites', JSON.stringify(sites));
  }, []);

  const clearAuth = useCallback(() => {
    clearAllState();
  }, [clearAllState]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  const selectedSite = sites.find(site => site.id === selectedSiteId) || null;

  return (
    <AuthContext.Provider value={{
      user,
      contractor,
      sites,
      selectedSiteId,
      selectedSite,
      isAuthenticated: !!user,
      isLoading,
      needsOnboarding,
      hasPermission,
      setAuthData,
      updateContractor,
      updateSites,
      clearAuth,
      logout,
      setSelectedSite,
      refreshSession,
    }}>
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
