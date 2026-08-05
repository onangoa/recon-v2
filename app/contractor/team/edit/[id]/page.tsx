'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    roleId: '',
    email: '',
    phone: '',
    status: 'Active',
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/web/api/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const response = await fetch(`/web/api/team/${id}`);
        if (!response.ok) throw new Error('Failed to fetch team member');
        const data = await response.json();
        setFormData({
          name: data.name || '',
          role: data.role || '',
          email: data.email || '',
          phone: data.phone || '',
          status: data.status || 'Active',
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "Unable to load the team member. Please refresh the page and try again."),
          variant: "destructive",
        });
        router.push('/contractor/team');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMember();
  }, [id, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Member name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.role.trim()) {
      toast({
        title: "Validation Error",
        description: "Role is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/web/api/team/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Team member details updated.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/team');
        router.refresh();
      } else {
        throw new Error(getApiError(result, "Unable to update the team member. Please verify the details and try again."));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to update the team member. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/team">Workforce</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Member</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Edit Member Details</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Update staff records and role assignments.</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 h-10">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      <div className="rounded-xl border border-muted-foreground/10 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-muted-foreground/5 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Staff Information</h2>
              <p className="text-xs text-muted-foreground">Basic details for identification and communication.</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                disabled={isSubmitting}
                className="w-full rounded-lg border-muted-foreground/20 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">Assigned Role *</label>
              <select
                value={formData.roleId}
                onChange={(e) => {
                  const selectedRole = roles.find(r => r.id === e.target.value);
                  setFormData({ ...formData, roleId: e.target.value, role: selectedRole?.name || '' });
                }}
                disabled={isSubmitting}
                className="w-full rounded-lg border-muted-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. john@reconsmi.ke"
                disabled={isSubmitting}
                className="w-full rounded-lg border-muted-foreground/20 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +254 700 000 000"
                disabled={isSubmitting}
                className="w-full rounded-lg border-muted-foreground/20 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={isSubmitting}
              className="w-full md:w-1/2 rounded-lg border-muted-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="Active">Active</option>
              <option value="On-Site">On-Site</option>
              <option value="Off-Duty">Off-Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-4 pt-6 border-t border-muted-foreground/5">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="text-base font-bold">Update Records</span>
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()} 
              disabled={isSubmitting}
              className="gap-2 px-8 py-6 rounded-xl border-muted-foreground/20 hover:bg-muted/50"
            >
              <X className="w-5 h-5" />
              <span className="text-base font-medium">Cancel</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
