'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Pencil } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useSite } from '@/hooks/use-site';
import { getErrorMessage } from '@/lib/toast-utils';
import { DailyReportForm } from '@/components/daily-report-form';
import {
  formatDayLabel,
  toDateKey,
  type DailyReportFull,
  type DailyReportMeta,
} from '@/lib/daily-report';

export default function EditDailyReportPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSite } = useSite();
  const [report, setReport] = useState<DailyReportFull | null>(null);
  const [meta, setMeta] = useState<DailyReportMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <BreadcrumbLink
              href={`/contractor/reports/daily/${report.id}`}
            >
              {formatDayLabel(report.reportDate)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Pencil className="w-6 h-6" />
            Edit Daily Report
          </h1>
          <p className="text-muted-foreground mt-1 text-sm italic">
            Editing the daily site report for{' '}
            <span className="font-bold not-italic text-foreground">
              {formatDayLabel(report.reportDate)}
            </span>
            {report.site?.name && (
              <>
                {' '}· <span className="font-bold not-italic text-foreground">
                  {report.site.name}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/contractor/reports/daily/${report.id}`}>
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
          </Button>
        </div>
      </div>

      <DailyReportForm
        siteId={report.siteId}
        reportDate={toDateKey(new Date(report.reportDate))}
        existing={report}
        meta={meta}
      />
    </div>
  );
}
