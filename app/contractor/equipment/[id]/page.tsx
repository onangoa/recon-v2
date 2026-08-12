'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Hammer,
  Calendar,
  Wrench,
  Image as ImageIcon,
  CheckCircle2,
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

interface EquipmentData {
  id: string;
  name: string;
  type: string;
  model?: string | null;
  serialNo?: string | null;
  serialNumber?: string | null;
  condition?: string | null;
  status: string;
  purchaseDate?: string | Date | null;
  purchasePrice?: number | string | null;
  lastService?: string | Date | null;
  lastMaintenanceDate?: string | Date | null;
  nextService?: string | Date | null;
  nextMaintenanceDate?: string | Date | null;
  notes?: string | null;
  image?: string | null;
  site?: { name?: string | null };
  createdAt: string;
}

export default function ViewEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/web/api/equipment/${id}`);
        if (!response.ok) throw new Error('Failed to fetch equipment');
        const data = await response.json();
        setEquipment(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Unable to load the equipment. Please try again.'),
          variant: 'destructive',
        });
        router.push('/contractor/equipment');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipment();
  }, [id, toast, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!equipment) return null;

  const lastMaint = equipment.lastService || equipment.lastMaintenanceDate;
  const nextMaint = equipment.nextService || equipment.nextMaintenanceDate;
  const purchase = equipment.purchaseDate;

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    'in-use': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    idle: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    maintenance: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  };
  const sConfig = statusConfig[equipment.status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };

  const rows = [
    { label: 'Machine Type', value: equipment.type },
    { label: 'Model', value: equipment.model || '—' },
    { label: 'Serial Number', value: equipment.serialNo || equipment.serialNumber || '—' },
    { label: 'Condition', value: equipment.condition || '—' },
    { label: 'Purchase Date', value: formatDate(purchase) },
    { label: 'Purchase Price', value: equipment.purchasePrice ? `KES ${Number(equipment.purchasePrice).toLocaleString()}` : '—' },
    { label: 'Last Maintenance', value: formatDate(lastMaint) },
    { label: 'Next Maintenance', value: formatDate(nextMaint) },
    { label: 'Site', value: equipment.site?.name || '—' },
    { label: 'Date Added', value: formatDate(equipment.createdAt) },
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
            <BreadcrumbLink href="/contractor/equipment">Equipment</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>View Equipment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 border border-muted-foreground/10">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-sm text-gray-500 italic">Equipment details and image.</p>
          </div>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <a href={`/contractor/equipment/edit/${equipment.id}`}>
            <Pencil className="w-4 h-4" />
            Edit
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-8 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Hammer className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{equipment.name}</h2>
              <Badge variant="secondary" className={`${sConfig.bg} ${sConfig.text} ${sConfig.border} border text-[10px] font-black uppercase mt-1`}>
                {equipment.status}
              </Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">{row.value as string}</dd>
              </div>
            ))}
          </dl>

          {equipment.notes && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{equipment.notes}</p>
            </div>
          )}
        </div>

        {/* Right column: image */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Equipment Image</h3>
          </div>
          {equipment.image ? (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={equipment.image} alt={equipment.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-square w-full rounded-lg border-2 border-dashed border-gray-200 bg-muted/20 text-muted-foreground gap-2">
              <ImageIcon className="w-10 h-10 opacity-30" />
              <p className="text-xs italic">No image uploaded.</p>
            </div>
          )}
          {equipment.image && (
            <a
              href={equipment.image}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              <CheckCircle2 className="w-3 h-3" /> Open full image
            </a>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last service: {formatDate(lastMaint)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wrench className="w-3 h-3" />
              <span>Next service: {formatDate(nextMaint)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}