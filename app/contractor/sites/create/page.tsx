'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSite } from '@/hooks/use-site';
import { useAuth } from '@/context/auth-context';

export default function CreateSitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { sites, isLoading, setActiveSite } = useSite();
  const { setSelectedSite, refreshSession } = useAuth();
  const isOnboarding = !isLoading && sites.length === 0;
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    category: '',
    isPrimary: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Site name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Site location is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/web/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          description: formData.description,
          category: formData.category,
          isPrimary: formData.isPrimary,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Site "${result.name}" has been created.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });

        if (isOnboarding) {
          const newSite = {
            id: result.id,
            name: result.name,
            location: result.location,
            contractorId: result.contractorId,
            isPrimary: result.isPrimary,
          };
          setActiveSite(newSite);
          await setSelectedSite(newSite.id);
          await refreshSession();
          router.push('/contractor');
          router.refresh();
        } else {
          router.push('/contractor/sites');
          router.refresh();
        }
      } else {
        const err = new Error(result.error || result.message || 'Failed to create site') as Error & { code?: string };
        err.code = result.code;
        throw err;
      }
    } catch (error: any) {
      if (error.code === 'SITE_LIMIT_REACHED') {
        toast({
          title: "Site Limit Reached",
          description: error.message || "You've used all your subscription site slots. Subscribe again to add another site.",
          variant: "destructive",
          action: (
            <Button size="sm" variant="outline" onClick={() => router.push('/contractor/settings')}>
              Subscribe Again
            </Button>
          ),
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          ),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isOnboarding ? (
        // Onboarding layout: welcome banner, no back button or breadcrumb
        <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Welcome
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Let’s set up your first site</h1>
              <p className="text-sm text-gray-500 max-w-xl">
                Create your first site to get started. Once you add a site, you’ll be able to access
                your dashboard and start managing your operations.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/contractor/sites">Sites</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create Site</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Site</h1>
              <p className="text-sm text-gray-500">Add a new site to your portfolio.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Simplified Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Site Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter site name"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter site location"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Category</label>
            <select 
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Select Category</option>
              <option value="infrastructure">Infrastructure / Roads</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter site description"
              rows={4}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Primary Site Checkbox */}
          <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-lg border border-primary/10">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
            />
            <label htmlFor="isPrimary" className="text-sm font-semibold text-gray-900 cursor-pointer select-none">
              Mark as Primary Site
              <span className="block text-xs font-normal text-gray-500 mt-0.5">This site will be selected by default when you log in.</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Site
                </>
              )}
            </Button>
            {!isOnboarding && (
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
