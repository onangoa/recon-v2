'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ArrowLeft,
  Save,
  X,
  UserPlus,
  CheckCircle2,
  ScanLine,
  AlertCircle,
  Upload,
  CreditCard
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
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
  startTime?: string;
  endTime?: string;
  workingDays?: string;
}

interface Device {
  id: string;
  name: string;
  sn: string;
  location: string | null;
  isActive: boolean;
  online?: boolean;
}

export default function CreateWorkerPage() {
  const { toast } = useToast();
  const { activeSite } = useSite();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceSn, setSelectedDeviceSn] = useState<string>('');

  const onlineDevices = devices.filter((d) => d.isActive && d.online);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    designationId: '',
    shiftIds: [] as string[],
    status: 'Active',
    paymentMode: 'manual',
    paymentPhone: '',
    paymentAccount: '',
    joinedAt: new Date().toISOString().split('T')[0],
    idDocumentUrl: '',
  });

  const toggleShift = (shiftId: string) => {
    setFormData((prev) => ({
      ...prev,
      shiftIds: prev.shiftIds.includes(shiftId)
        ? prev.shiftIds.filter((s) => s !== shiftId)
        : [...prev.shiftIds, shiftId],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [desigRes, shiftRes, devRes] = await Promise.all([
          fetch('/web/api/designations'),
          fetch(`/web/api/shifts?contractorId=${activeSite?.contractorId || ''}`),
          fetch('/web/api/biometric/devices?status=1'),
        ]);
        
        if (desigRes.ok) {
          const desigData = await desigRes.json();
          setDesignations(desigData.designations || desigData);
        }
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShifts(Array.isArray(shiftData) ? shiftData : (shiftData.shifts || []));
        }
        if (devRes.ok) {
          const devData = await devRes.json();
          const list: Device[] = devData.devices || [];
          setDevices(list);
          // Pre-select the first online device if none chosen yet.
          const firstOnline = list.find((d) => d.isActive && d.online);
          if (firstOnline) setSelectedDeviceSn((prev) => prev || firstOnline.sn);
        }
      } catch (error) {
        console.error('Failed to fetch data');
      }
    };
    fetchData();
  }, [activeSite?.contractorId]);

  const handleIdDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setIdDocFile(selected);
      setFormData((prev) => ({ ...prev, idDocumentUrl: '' }));
    }
  };

  const uploadIdDoc = async (): Promise<string | null> => {
    if (!idDocFile || formData.idDocumentUrl) return formData.idDocumentUrl || null;
    setIsUploadingId(true);
    try {
      const fd = new FormData();
      fd.append('file', idDocFile);
      const response = await fetch('/web/api/upload', { method: 'POST', body: fd });
      if (!response.ok) throw new Error('Unable to upload the ID document. Please try again.');
      const data = await response.json();
      setFormData((prev) => ({ ...prev, idDocumentUrl: data.url }));
      return data.url;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: getErrorMessage(error, "Unable to upload the ID document. Please try again."),
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, enrollDevice = false) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.designationId || !formData.nationalId.trim()) {
      toast({
        title: "Validation Error",
        description: "Name, National ID and Designation are required.",
        variant: "destructive",
      });
      return;
    }

    // Enrolling requires a selected, online device. The Enroll ID itself is
    // assigned server-side when the enrollment call is made.
    if (enrollDevice && !onlineDevices.some((d) => d.sn === selectedDeviceSn)) {
      toast({
        title: "No online device selected",
        description: "Pick an online device to enroll to (add one under Settings → Devices).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let idDocUrl: string | null = formData.idDocumentUrl || null;
      if (idDocFile && !idDocUrl) {
        idDocUrl = await uploadIdDoc();
        if (!idDocUrl) {
          toast({
            title: "Upload Error",
            description: "The ID document could not be uploaded. Please try again or remove it.",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch('/web/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          idDocumentUrl: idDocUrl,
          siteId: activeSite?.id || '',
          contractorId: 'placeholder-id',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getApiError(data, 'Failed to create worker'));
      }
      const created = await response.json();

      if (enrollDevice && created?.id) {
        setIsEnrolling(true);
        try {
          const enrollRes = await fetch('/web/api/biometric/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId: created.id, deviceSn: selectedDeviceSn }),
          });
          const enrollData = await enrollRes.json();
          if (!enrollRes.ok || !enrollData?.ok) {
            throw new Error(getApiError(enrollData, 'Device enrollment failed'));
          }
          toast({
            title: "Saved & Enrolled!",
            description: `"${formData.name}" was registered and enrolled to the device (enrollId ${enrollData.enrollId}, sn ${selectedDeviceSn}).`,
            variant: "success",
            action: (
              <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            ),
          });
        } catch (err: any) {
          toast({
            title: "Saved, but enrollment failed",
            description: `Worker saved, but device enrollment failed: ${getErrorMessage(err, "Unable to reach the biometric device. Please check the connection and try again.")}`,
            variant: "destructive",
          });
        } finally {
          setIsEnrolling(false);
        }
      } else {
        toast({
          title: "Success!",
          description: `Worker "${formData.name}" has been registered.`,
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
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to create the worker. Please verify the details and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/workers">Workers</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Add Worker</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Add New Worker</h1>
          <p className="text-sm text-gray-500 italic">Register a new employee into your workforce.</p>
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
                placeholder="Enter worker's full name"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">National ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                  placeholder="ID Number"
                  disabled={isSubmitting}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Enroll to Device</label>
                {devices.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1 h-[42px]">
                    <AlertCircle className="w-3 h-3" /> No devices configured. Add one in Settings → Devices.
                  </p>
                ) : (
                  <select
                    value={selectedDeviceSn}
                    onChange={(e) => setSelectedDeviceSn(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Select device…</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.sn} disabled={!d.isActive || !d.online}>
                        {d.name} — {d.sn}{d.online ? '' : (d.isActive ? ' (offline)' : ' (inactive)')}
                      </option>
                    ))}
                  </select>
                )}
                {selectedDeviceSn && !onlineDevices.some((d) => d.sn === selectedDeviceSn) && (
                  <p className="mt-1 text-xs font-medium text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Selected device is offline — enroll will be blocked.
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
                placeholder="example@email.com"
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
                placeholder="+254..."
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t pt-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Site (Enrollment)</label>
              <input
                type="text"
                value={activeSite?.name || ''}
                readOnly
                disabled={isSubmitting}
                placeholder="No active site"
                className="w-full rounded-md border border-gray-300 bg-muted/50 px-4 py-2.5 text-sm text-gray-700"
              />
              <p className="mt-1 text-xs text-muted-foreground italic">
                Workers are enrolled to the active site. Change the site in the sidebar; reassign later from Edit Worker.
              </p>
            </div>
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
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Assigned Shifts</label>
              {shifts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1 h-[42px]">
                  <AlertCircle className="w-3 h-3" /> No shifts configured. Add one under Shifts.
                </p>
              ) : (
                <div className="rounded-md border border-gray-300 bg-white px-4 py-2.5 space-y-1.5 max-h-44 overflow-y-auto">
                  {shifts.map((s) => (
                    <label key={s.id} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={formData.shiftIds.includes(s.id)}
                        onChange={() => toggleShift(s.id)}
                        disabled={isSubmitting}
                        className="size-4 accent-primary cursor-pointer disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700 flex-1">{s.name}</span>
                      {(s.startTime || s.endTime) && (
                        <span className="text-[10px] text-muted-foreground">{s.startTime} - {s.endTime}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground italic">
                A worker can hold several shifts — the one covering a day drives attendance &amp; overtime for that day.
              </p>
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

          {/* Worker ID Document */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Worker ID Document
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdDocChange}
                  disabled={isUploadingId || isSubmitting}
                  className="flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                />
                {isUploadingId && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              {idDocFile && !formData.idDocumentUrl && !isUploadingId && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Document will be uploaded when you save.
                </p>
              )}
              {formData.idDocumentUrl && (
                <div className="flex items-center gap-3">
                  <a href={formData.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-muted/30 block">
                    {formData.idDocumentUrl.match(/\.(pdf)$/i) ? (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-destructive">PDF</div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.idDocumentUrl} alt="ID preview" className="w-full h-full object-cover" />
                    )}
                  </a>
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ID document uploaded!</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFormData((prev) => ({ ...prev, idDocumentUrl: '' })); setIdDocFile(null); }}
                      className="text-destructive hover:bg-destructive/10 h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
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
                  Save Worker
                </>
              )}
            </Button>
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              disabled={isSubmitting || isEnrolling || onlineDevices.length === 0}
              title={onlineDevices.length === 0 ? 'No online devices configured' : ''}
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
                  Save & Enroll to Device
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
