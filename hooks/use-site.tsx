'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  location: string;
  plan?: string;
  logo?: any;
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

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/sites');
        const sitesData = await response.json();
        
        if (Array.isArray(sitesData)) {
          const transformedSites = sitesData.map((site: any) => ({
            id: site.id,
            name: site.name,
            location: site.location,
            plan: site.project?.name || undefined,
          }));
          setSites(transformedSites);
          
          const savedSite = localStorage.getItem('activeSite');
          if (savedSite) {
            const parsed = JSON.parse(savedSite);
            const found = transformedSites.find(s => s.id === parsed.id);
            setActiveSiteState(found || (transformedSites.length > 0 ? transformedSites[0] : null));
          } else {
            setActiveSiteState(transformedSites.length > 0 ? transformedSites[0] : null);
          }
        }
      } catch (e) {
        console.error("Failed to load sites", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, []);

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
