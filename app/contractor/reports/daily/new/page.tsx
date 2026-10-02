'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
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

export default function NewDailyReportPage() {
  const router = useRouter();
  const { activeSite, isLoading: siteLoading } = useSite();
  const [report, setReport] = useState<DailyReportFull | null>(null);
  const [meta, setMeta] = useState<DailyReportMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = toDateKey(new Date());

  useEffect(() => {
    if (!activeSite) return;
    setIsLoading(true);
    setError(null);
    fetch(`/web/api/daily-reports?siteId=${activeSite.id}&date=${today}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load report data');
        const json = await res.json();
        if (json.report?.id) {
          router.replace(`/contractor/reports/daily/${json.report.id}/edit`);
          return;
        }
        setReport(json.report || null);
        setMeta(json.meta);
      })
      .catch((err: any) => {
        setError(getErrorMessage(err, 'Unable to load the report form. Please try again.'));
      })
      .finally(() => setIsLoading(false));
  }, [activeSite, router, today]);

  const showLoader = siteLoading || isLoading;

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
            <BreadcrumbPage>New Daily Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            New Daily Report
          </h1>
          <p className="text-muted-foreground mt-1 text-sm italic">
            Daily site progress &amp; next-day planning report for{' '}
            <span className="font-bold not-italic text-foreground">
              {formatDayLabel(today)}
            </span>
            {activeSite && (
              <>
                {' '}
                · <span className="font-bold not-italic text-foreground">
                  {activeSite.name}
                </span>
              </>
            )}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/contractor/reports/daily">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </Link>
        </Button>
      </div>

      {showLoader ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">Loading report form...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Try Again
          </Button>
        </div>
      ) : !activeSite || !meta ? null : (
        <DailyReportForm
          siteId={activeSite.id}
          reportDate={today}
          existing={report}
          meta={meta}
        />
      )}
    </div>
  );
}
