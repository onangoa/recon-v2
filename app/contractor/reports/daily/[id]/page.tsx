'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Printer,
  Trash2,
  Loader2,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSite } from '@/hooks/use-site';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';
import { DailyReportDocument } from '@/components/daily-report-document';
import {
  formatDayLabel,
  toDateKey,
  type DailyReportFull,
  type DailyReportMeta,
} from '@/lib/daily-report';

export default function DailyReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeSite } = useSite();
  const { toast } = useToast();
  const [report, setReport] = useState<DailyReportFull | null>(null);
  const [meta, setMeta] = useState<DailyReportMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    fetch(`/web/api/daily-reports/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load report');
        const json = await res.json();
        setReport(json.report);
        setMeta(json.meta);
      })
      .catch((err: any) => {
        setError(getErrorMessage(err, 'Unable to load the report. Please try again.'));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/web/api/daily-reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
      toast({
        title: 'Report deleted',
        description: 'The daily report has been removed.',
        variant: 'success',
        action: (
          <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        ),
      });
      router.push('/contractor/reports/daily');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(
          err,
          'Unable to delete the report. Please try again.'
        ),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading report...</p>
      </div>
    );
  }

  if (error || !report || !meta) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error || 'Report not found'}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/contractor/reports/daily">Back to Daily Reports</Link>
        </Button>
      </div>
    );
  }

  const reportDay = toDateKey(new Date(report.reportDate));
  const printHref = `/contractor/reports/daily/print?siteId=${report.siteId}&from=${reportDay}&to=${reportDay}`;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/reports">Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/reports/daily">Daily Site Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{formatDayLabel(report.reportDate)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {formatDayLabel(report.reportDate)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm italic">
            Daily site progress &amp; next-day planning report for{' '}
            <span className="font-bold not-italic text-foreground">
              {report.site?.name || activeSite?.name || 'site'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/contractor/reports/daily">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={printHref}>
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/contractor/reports/daily/${report.id}/edit`}>
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <DailyReportDocument
        report={report}
        workforce={meta.workforce}
        visitors={meta.visitors}
        incidents={meta.incidents}
        poDeliveries={meta.deliveries}
        designations={meta.designations}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this daily report?</DialogTitle>
            <DialogDescription>
              The report for {formatDayLabel(report.reportDate)} including its
              activities, targets, materials, visitors and incidence sections will be
              permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 gap-2"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
