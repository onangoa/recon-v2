'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Briefcase,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

interface WorkerData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  enrollId?: string | null;
  idDocumentUrl?: string | null;
  status: string;
  paymentMode?: string | null;
  paymentPhone?: string | null;
  paymentAccount?: string | null;
  joinedAt?: string | null;
  designation?: { title: string | null } | null;
  shift?: { name: string; startTime: string; endTime: string } | null;
}

const paymentModeLabel = (mode?: string | null) => {
  if (!mode || mode === 'manual') return 'Manual';
  if (mode === 'phone') return 'Direct M-Pesa';
  if (mode === 'pochi') return 'M-Pesa Pochi';
  if (mode === 'till') return 'M-Pesa Till';
  if (mode === 'paybill') return 'M-Pesa Paybill';
  return mode;
};

export default function ViewWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await fetch(`/web/api/workers/${id}`);
        if (!response.ok) throw new Error('Failed to fetch worker');
        const data = await response.json();
        setWorker(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Unable to load the worker. Please try again.'),
          variant: 'destructive',
        });
        router.push('/contractor/workers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorker();
  }, [id, toast, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!worker) return null;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const paymentRows = [
    { label: 'Mode of Payment', value: paymentModeLabel(worker.paymentMode) },
    { label: 'Payment Phone', value: worker.paymentPhone || '—' },
    { label: 'Payment Account', value: worker.paymentAccount || '—' },
  ];

  const isPdf = worker.idDocumentUrl?.match(/\.(pdf)$/i);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/workers">Workers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>View Worker</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 border border-muted-foreground/10">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
              {getInitials(worker.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] uppercase font-bold ${worker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                {worker.status}
              </Badge>
              {worker.designation?.title && (
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {worker.designation.title}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <a href={`/contractor/workers/edit/${worker.id}`}>
            <Pencil className="w-4 h-4" />
            Edit
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-8 space-y-6">
          {/* Contact & IDs */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Personal & Identity
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">National ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{worker.nationalId || '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Enroll ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{worker.enrollId || '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium text-gray-900">{worker.email || '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900">{worker.phone || '—'}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Employment */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Employment
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Designation</dt>
                <dd className="text-sm font-medium text-gray-900">{worker.designation?.title || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Shift</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {worker.shift ? (
                    <span className="flex flex-col gap-0.5">
                      <span className="font-bold">{worker.shift.name}</span>
                      <span className="text-[10px] text-muted-foreground">{worker.shift.startTime} - {worker.shift.endTime}</span>
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">No shift assigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Joining Date</dt>
                <dd className="text-sm font-medium text-gray-900">{formatDate(worker.joinedAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</dt>
                <dd>
                  <Badge className={`text-[10px] uppercase font-bold ${worker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {worker.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              {paymentRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{row.label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{row.value as string}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right column: ID document */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Worker ID Document</h3>
          </div>
          {worker.idDocumentUrl ? (
            <div className="space-y-3">
              {isPdf ? (
                <a
                  href={worker.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center aspect-[3/4] w-full rounded-lg border-2 border-dashed border-gray-200 bg-muted/20 text-destructive gap-2 hover:bg-muted/40 transition-colors"
                >
                  <FileText className="w-12 h-12 opacity-50" />
                  <span className="text-xs font-bold">PDF Document</span>
                  <span className="text-[10px] text-muted-foreground">Click to open</span>
                </a>
              ) : (
                <a href={worker.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={worker.idDocumentUrl} alt={`${worker.name} ID`} className="w-full h-full object-cover" />
                </a>
              )}
              <a
                href={worker.idDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
              >
                <CheckCircle2 className="w-3 h-3" /> Open full document
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-[3/4] w-full rounded-lg border-2 border-dashed border-gray-200 bg-muted/20 text-muted-foreground gap-2">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-xs italic">No ID document uploaded.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Joined: {formatDate(worker.joinedAt)}</span>
            </div>
            {worker.designation?.title && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                <span>Role: {worker.designation.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}