'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Site {
  id: string;
  name: string;
  location: string;
  plan?: string;
  contractorId: string;
  logo?: any;
  isPrimary?: boolean;
}

interface SiteContextType {
  activeSite: Site | null;
  setActiveSite: (site: Site) => void;
  sites: Site[];
  isLoading: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [activeSite, setActiveSiteState] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/sites');
        const data = await response.json();
        
        // Handle both array and object responses (pagination)
        const rawSites = Array.isArray(data) ? data : (data.sites || []);
        
        if (rawSites.length === 0 && !pathname.includes('/sites/create') && !pathname.includes('/auth') && pathname.startsWith('/contractor')) {
          router.push('/contractor/sites/create');
          return;
        }

        const transformedSites = rawSites.map((site: any) => ({
          id: site.id,
          name: site.name,
          location: site.location,
          plan: undefined,
          contractorId: site.contractorId,
          isPrimary: site.isPrimary,
        }));
        
        setSites(transformedSites);
        
        const primarySite = transformedSites.find((s: any) => s.isPrimary);
        const savedSite = localStorage.getItem('activeSite');
        
        if (savedSite) {
          const parsed = JSON.parse(savedSite);
          const found = transformedSites.find((s: any) => s.id === parsed.id);
          setActiveSiteState(found || primarySite || (transformedSites.length > 0 ? transformedSites[0] : null));
        } else {
          setActiveSiteState(primarySite || (transformedSites.length > 0 ? transformedSites[0] : null));
        }
      } catch (e) {
        console.error("Failed to load sites", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, [router, pathname]);

  const setActiveSite = (site: Site) => {
    setActiveSiteState(site);
    localStorage.setItem('activeSite', JSON.stringify(site));
  };

  return (
    <SiteContext.Provider value={{ activeSite, setActiveSite, sites, isLoading }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
