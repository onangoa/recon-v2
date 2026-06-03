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
    // Load sites and active site from localStorage or API
    const savedSite = localStorage.getItem('activeSite');
    
    const fetchSites = async () => {
      try {
        // Mocking API call for now, but this will eventually hit /api/sites
        const mockSites: Site[] = [
          { id: '1', name: "Karen Plains Road", location: "Nairobi, KE", plan: "Infrastructure" },
          { id: '2', name: "Westlands Complex", location: "Westlands, KE", plan: "Commercial" },
          { id: '3', name: "Syokimau Estate", location: "Macha, KE", plan: "Residential" },
        ];
        setSites(mockSites);
        
        if (savedSite) {
          const parsed = JSON.parse(savedSite);
          const found = mockSites.find(s => s.id === parsed.id);
          setActiveSiteState(found || mockSites[0]);
        } else {
          setActiveSiteState(mockSites[0]);
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
