'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  ShieldAlert,
  Calendar,
  User,
  MapPin,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Paperclip,
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
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

interface IncidentData {
  id: string;
  siteId: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  incidentDate: string;
  reportedBy: string;
  attachments: string | null;
  createdAt: string;
  site?: { name?: string | null };
}

export default function ViewSafetyIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await fetch(`/web/api/safety-incidents/${id}`);
        if (!response.ok) throw new Error('Failed to fetch incident');
        const data = await response.json();
        setIncident(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Unable to load the incident. Please try again.'),
          variant: 'destructive',
        });
        router.push('/contractor/safety');
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncident();
  }, [id, toast, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!incident) return null;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
  };
  const sevKey = incident.severity.toLowerCase();
  const sConfig = severityConfig[sevKey] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };

  const isImage = (url: string) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  const fileName = (url: string) => url.split('/').pop() || url;

  const rows = [
    { label: 'Incident Type', value: incident.type },
    { label: 'Severity', value: incident.severity },
    { label: 'Status', value: incident.status },
    { label: 'Incident Date', value: formatDate(incident.incidentDate) },
    { label: 'Reported By', value: incident.reportedBy || '—' },
    { label: 'Affected Site', value: incident.site?.name || '—' },
    { label: 'Date Reported', value: formatDate(incident.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/safety">Safety & Incidents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>View Incident</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 border border-muted-foreground/10">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
            <p className="text-sm text-gray-500 italic">Incident details and attachments.</p>
          </div>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <a href={`/contractor/safety?edit=${incident.id}`}>
            <Pencil className="w-4 h-4" />
            Edit
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-8 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="p-3 bg-red-50 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{incident.title}</h2>
              <Badge variant="outline" className="text-[10px] font-black uppercase">{incident.type}</Badge>
              <Badge className={`${sConfig.bg} ${sConfig.text} ${sConfig.border} border text-[10px] font-black uppercase`}>
                {incident.severity}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-black uppercase">{incident.status}</Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-gray-900">{row.value as string}</dd>
              </div>
            ))}
          </dl>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Full Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description || '—'}</p>
          </div>
        </div>

        {/* Right column: attachment */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Attachment</h3>
          </div>
          {incident.attachments ? (
            isImage(incident.attachments) ? (
              <>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={incident.attachments} alt={incident.title} className="w-full h-full object-cover" />
                </div>
                <a
                  href={incident.attachments}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <CheckCircle2 className="w-3 h-3" /> Open full image
                </a>
              </>
            ) : (
              <a
                href={incident.attachments}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-muted/20 p-4 hover:bg-muted/40 transition"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{fileName(incident.attachments)}</p>
                  <p className="text-xs text-primary font-medium">Open document</p>
                </div>
              </a>
            )
          ) : (
            <div className="flex flex-col items-center justify-center aspect-square w-full rounded-lg border-2 border-dashed border-gray-200 bg-muted/20 text-muted-foreground gap-2">
              <Paperclip className="w-10 h-10 opacity-30" />
              <p className="text-xs italic">No file uploaded.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Incident date: {formatDate(incident.incidentDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>Reported by: {incident.reportedBy || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Site: {incident.site?.name || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
