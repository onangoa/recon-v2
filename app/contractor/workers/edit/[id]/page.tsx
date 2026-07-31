'use client';

import { useState, useEffect, use } from 'react';
import { 
  Loader2,
  ArrowLeft,
  Save,
  X,
  CheckCircle2,
  ScanLine,
  AlertCircle
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
import { useSite } from '@/hooks/use-site';
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
  const { activeSite } = useSite();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [takenEnrollIds, setTakenEnrollIds] = useState<number[]>([]);
  const [enrollIdAvailable, setEnrollIdAvailable] = useState<boolean | null>(null);
  const [originalEnrollId, setOriginalEnrollId] = useState<string>('');
  
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
        const [workerRes, designRes, shiftRes, bioRes] = await Promise.all([
          fetch(`/web/api/workers/${id}`),
          fetch('/web/api/designations'),
          fetch(`/web/api/shifts?contractorId=${activeSite?.contractorId || ''}`),
          fetch('/web/api/biometric/users'),
        ]);

        if (!workerRes.ok) throw new Error('Failed to fetch worker');
        if (!designRes.ok) throw new Error('Failed to fetch designations');

        const worker = await workerRes.json();
        const designs = await designRes.json();
        let shiftList: Shift[] = [];
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          shiftList = Array.isArray(shiftData) ? shiftData : (shiftData.shifts || []);
        }
        if (bioRes.ok) {
          const bioData = await bioRes.json();
          setTakenEnrollIds(Array.isArray(bioData.enrolledEnrollIds) ? bioData.enrolledEnrollIds : []);
        }

        setDesignations(designs.designations || designs);
        setShifts(shiftList);
        setOriginalEnrollId(worker.enrollId || '');
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
  }, [id, toast, activeSite?.contractorId]);

  // Validate typed enroll ID against the device's enrolled IDs,
  // excluding the worker's own current enroll ID (it can keep its own).
  useEffect(() => {
    const value = formData.enrollId.trim();
    if (!value) {
      setEnrollIdAvailable(null);
      return;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      setEnrollIdAvailable(false);
      return;
    }
    // The worker may keep its own current enroll ID.
    const isOwn = originalEnrollId.trim() !== '' && Number(originalEnrollId) === num;
    setEnrollIdAvailable(isOwn || !takenEnrollIds.includes(num));
  }, [formData.enrollId, takenEnrollIds, originalEnrollId]);

  const handleSubmit = async (e: React.FormEvent, enrollDevice = false) => {
    e.preventDefault();

    if (formData.enrollId.trim()) {
      const num = Number(formData.enrollId.trim());
      const isOwn = originalEnrollId.trim() !== '' && Number(originalEnrollId) === num;
      if (Number.isFinite(num) && !isOwn && takenEnrollIds.includes(num)) {
        toast({
          title: "Enroll ID already in use",
          description: `Enroll ID ${num} already exists on the device. Choose a unique ID.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/workers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update worker');

      if (enrollDevice && formData.enrollId.trim()) {
        setIsEnrolling(true);
        try {
          const enrollRes = await fetch('/web/api/biometric/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId: id }),
          });
          const enrollData = await enrollRes.json();
          if (!enrollRes.ok || !enrollData?.ok) {
            throw new Error(enrollData?.error || 'Device enrollment failed');
          }
          toast({
            title: "Updated & Enrolled!",
            description: `Profile updated and enrolled to the device (enrollId ${formData.enrollId}).`,
            variant: "success",
            action: (
              <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            ),
          });
        } catch (err: any) {
          toast({
            title: "Updated, but enrollment failed",
            description: `Profile saved, but device enrollment failed: ${err.message}`,
            variant: "destructive",
          });
        } finally {
          setIsEnrolling(false);
        }
      } else {
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
      }
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
                {formData.enrollId.trim() && (
                  <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${enrollIdAvailable ? 'text-emerald-600' : 'text-destructive'}`}>
                    {enrollIdAvailable ? (
                      <><CheckCircle2 className="w-3 h-3" /> Available on device</>
                    ) : (
                      <><AlertCircle className="w-3 h-3" /> Already enrolled on device — pick a unique ID</>
                    )}
                  </p>
                )}
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

          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
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
            {formData.enrollId.trim() && (
              <Button 
                type="button"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                disabled={isSubmitting || isEnrolling}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 min-w-[200px]"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enrolling to Device...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    Update & Enroll to Device
                  </>
                )}
              </Button>
            )}
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
