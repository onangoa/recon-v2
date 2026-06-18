'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function SiteSelector() {
  const { sites, selectedSiteId, setSelectedSite, isLoading } = useAuth();

  if (isLoading || sites.length === 0) {
    return null;
  }

  const selectedSite = sites.find(site => site.id === selectedSiteId);

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-[#8B4513]" />
      <Select value={selectedSiteId || ''} onValueChange={setSelectedSite}>
        <SelectTrigger className="w-[200px] border-[#8B4513]/20 focus:border-[#8B4513]">
          <SelectValue placeholder="Select a site">
            {selectedSite ? selectedSite.name : 'Select a site'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              <div className="flex items-center gap-2">
                {site.name}
                {site.isPrimary && (
                  <span className="text-[10px] bg-[#8B4513]/10 text-[#8B4513] px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}