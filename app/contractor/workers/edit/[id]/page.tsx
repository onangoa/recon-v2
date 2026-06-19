'use client';

import { useState, useEffect, use } from 'react';
import { 
  Loader2,
  ArrowLeft,
  Save,
  X,
  CheckCircle2
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Designation {
  id: string;
  title: string;
}

interface Shift {
  id: string;
  name: string;
}

export default function EditWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    enrollId: '',
    designationId: '',
    shiftId: '',
    status: 'Active',
    paymentMode: 'manual',
    paymentPhone: '',
    paymentAccount: '',
    joinedAt: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [workerRes, designRes, shiftRes] = await Promise.all([
          fetch(`/web/api/workers/${id}`),
          fetch('/web/api/designations'),
          fetch('/web/api/shifts?contractorId=placeholder-id')
        ]);

        if (!workerRes.ok) throw new Error('Failed to fetch worker');
        if (!designRes.ok) throw new Error('Failed to fetch designations');
        if (!shiftRes.ok) throw new Error('Failed to fetch shifts');

        const worker = await workerRes.json();
        const designs = await designRes.json();
        const shiftData = await shiftRes.json();

        setDesignations(designs.designations || designs);
        setShifts(shiftData.shifts || shiftData);
        setFormData({
          name: worker.name,
          email: worker.email || '',
          phone: worker.phone || '',
          nationalId: worker.nationalId || '',
          enrollId: worker.enrollId || '',
          designationId: worker.designationId || '',
          shiftId: worker.shiftId || '',
          status: worker.status,
          paymentMode: worker.paymentMode || 'manual',
          paymentPhone: worker.paymentPhone || '',
          paymentAccount: worker.paymentAccount || '',
          joinedAt: worker.joinedAt ? new Date(worker.joinedAt).toISOString().split('T')[0] : ''
        });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/workers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update worker');

      toast({
        title: "Success!",
        description: "Worker profile updated successfully.",
        variant: "success",
        action: (
          <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        ),
      });
      router.push('/contractor/workers');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading worker data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/workers">Workers</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Edit Worker</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Edit Worker Profile</h1>
          <p className="text-sm text-gray-500 italic">Modify personal and employment details for {formData.name}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">National ID</label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Enroll ID</label>
                <input
                  type="text"
                  value={formData.enrollId}
                  onChange={(e) => setFormData({...formData, enrollId: e.target.value})}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t pt-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Job Designation *</label>
              <select
                value={formData.designationId}
                onChange={(e) => setFormData({...formData, designationId: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
              >
                <option value="">Select job role</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Assigned Shift</label>
              <select
                value={formData.shiftId}
                onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">No shift assigned</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Joining Date</label>
              <input
                type="date"
                value={formData.joinedAt}
                onChange={(e) => setFormData({...formData, joinedAt: e.target.value})}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Payment Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Mode of Payment *</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({...formData, paymentMode: e.target.value, paymentPhone: '', paymentAccount: ''})}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="manual">Manual Settlement</option>
                  <option value="phone">Direct M-Pesa (Phone Number)</option>
                  <option value="pochi">M-Pesa Pochi</option>
                  <option value="till">M-Pesa Till Number</option>
                  <option value="paybill">M-Pesa Paybill</option>
                </select>
              </div>
              {(formData.paymentMode === 'phone' || formData.paymentMode === 'pochi') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Payment Phone Number</label>
                  <input
                    type="text"
                    value={formData.paymentPhone}
                    onChange={(e) => setFormData({...formData, paymentPhone: e.target.value})}
                    placeholder="e.g. 254712345678"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              )}
              {(formData.paymentMode === 'till' || formData.paymentMode === 'paybill') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    {formData.paymentMode === 'till' ? 'Till Number' : 'Paybill Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.paymentAccount}
                    onChange={(e) => setFormData({...formData, paymentAccount: e.target.value})}
                    placeholder={formData.paymentMode === 'till' ? 'e.g. 123456' : 'e.g. 123456'}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              )}
              {formData.paymentMode === 'paybill' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Account Number</label>
                  <input
                    type="text"
                    value={formData.paymentPhone}
                    onChange={(e) => setFormData({...formData, paymentPhone: e.target.value})}
                    placeholder="Paybill account reference"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 h-11 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Profile
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()} 
              disabled={isSubmitting}
              className="gap-2 h-11 px-6 border-gray-300"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
