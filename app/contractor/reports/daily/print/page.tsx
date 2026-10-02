'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertCircle,
  Users,
  ClipboardList,
  Target,
  ShieldAlert,
} from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useSite } from '@/hooks/use-site';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/lib/toast-utils';
import { DailyReportDocument } from '@/components/daily-report-document';
import {
  formatDayLabel,
  formatKes,
  parseISODate,
  toDateKey,
  type DailyReportFull,
} from '@/lib/daily-report';

function PrintToolbar({
  from,
  to,
  onPrint,
}: {
  from: string;
  to: string;
  onPrint: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/contractor/reports/daily">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Daily Reports</span>
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground italic">
          Printing{' '}
          <span className="font-bold not-italic text-foreground">
            {formatDayLabel(from)}
          </span>
          {' — '}
          <span className="font-bold not-italic text-foreground">
            {formatDayLabel(to)}
          </span>
        </p>
      </div>
      <Button onClick={onPrint} className="gap-2 bg-primary hover:bg-primary/90 text-white">
        <Printer className="w-4 h-4" />
        <span>Print</span>
      </Button>
    </div>
  );
}

function CoverStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3 print:break-inside-avoid">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function DailyReportPrintView() {
  const searchParams = useSearchParams();
  const { activeSite } = useSite();
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReportFull[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoPrintedRef = useRef(false);

  const siteId = searchParams.get('siteId') || activeSite?.id || '';
  const from = searchParams.get('from') || toDateKey(new Date());
  const to = searchParams.get('to') || from;
  const autoPrint = searchParams.get('autoPrint') === '1';

  useEffect(() => {
    if (!siteId) return;
    const params = new URLSearchParams({ siteId, from, to });
    fetch(`/web/api/daily-reports?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load reports');
        const json = await res.json();
        setReports(json.reports || []);
      })
      .catch((err: any) => {
        setError(getErrorMessage(err, 'Unable to load the reports for printing.'));
      });
  }, [siteId, from, to]);

  useEffect(() => {
    if (autoPrint && reports && !autoPrintedRef.current) {
      autoPrintedRef.current = true;
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, reports]);

  const summary = useMemo(() => {
    if (!reports) return null;
    let activities = 0;
    let targets = 0;
    let labourCost = 0;
    let workforce = 0;
    const verdicts = { achieved: 0, partially_achieved: 0, not_achieved: 0 };
    for (const report of reports) {
      activities += report.activities.length;
      targets += report.targets.length;
      labourCost += report.activities.reduce((sum, a) => sum + (a.labourCost || 0), 0);
      workforce += (report.dayWorkforce || []).reduce((sum, w) => sum + w.count, 0);
      for (const activity of report.activities) {
        if (activity.verdict && activity.verdict in verdicts) {
          verdicts[activity.verdict as keyof typeof verdicts] += 1;
        }
      }
    }
    return { activities, targets, labourCost, workforce, verdicts };
  }, [reports]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/contractor/reports/daily">Back to Daily Reports</Link>
        </Button>
      </div>
    );
  }

  if (!siteId || !reports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">
          Preparing reports for printing...
        </p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Printer className="h-8 w-8 opacity-20" />
        <p className="text-sm italic">
          No daily reports found between {formatDayLabel(from)} and {formatDayLabel(to)}.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/contractor/reports/daily">Back to Daily Reports</Link>
        </Button>
      </div>
    );
  }

  const daysInRange = differenceInCalendarDays(parseISODate(to), parseISODate(from)) + 1;
  const isSingleDay = reports.length === 1 && daysInRange === 1;
  const site = reports[0]?.site;
  const contractorName = site?.contractor?.companyName;

  return (
    <div className="space-y-6">
      <PrintToolbar from={from} to={to} onPrint={() => window.print()} />

      <div className="mx-auto w-full max-w-[900px] print:max-w-none">
        {/* ---------------- Cover page ---------------- */}
        <div className="rounded-lg border border-border bg-white shadow-sm print:shadow-none print:rounded-none print:break-after-page min-h-[1000px] flex flex-col">
          <div className="border-b-2 border-primary px-8 py-8 flex items-center justify-between gap-6">
            <img src="/default_full_logo.png" alt="ReconSMI" className="h-12 w-auto" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {contractorName || 'Construction Site Management'}
              </p>
              <p className="text-xs text-muted-foreground">Site: {site?.name || activeSite?.name}</p>
              {site?.location && (
                <p className="text-xs text-muted-foreground">{site.location}</p>
              )}
            </div>
          </div>

          <div className="flex-1 px-8 py-10 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">
              ReconSMI Site Reporting
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-primary leading-tight">
              {isSingleDay ? 'Daily Report' : 'Merged Daily Reports'}
            </h1>
            <p className="text-sm font-bold mt-4 max-w-lg">
              {isSingleDay
                ? formatDayLabel(from)
                : `${formatDayLabel(from)} — ${formatDayLabel(to)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Daily Site Progress &amp; Next-Day Planning Report
              {isSingleDay ? '' : ` · ${reports.length} of ${daysInRange} days reported`}
            </p>

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10 w-full max-w-2xl text-left">
                <CoverStat
                  icon={ClipboardList}
                  label="Days Reported"
                  value={`${reports.length} day${reports.length === 1 ? '' : 's'}`}
                />
                <CoverStat icon={Target} label="Activities" value={`${summary.activities}`} />
                <CoverStat icon={Users} label="Workforce (Attendance)"
                  value={`${summary.workforce} present`}
                />
                <CoverStat
                  icon={ShieldAlert}
                  label="Achieved"
                  value={`${summary.verdicts.achieved} activities`}
                />
                <CoverStat
                  icon={ShieldAlert}
                  label="Partially Achieved"
                  value={`${summary.verdicts.partially_achieved} activities`}
                />
                <CoverStat
                  icon={ShieldAlert}
                  label="Not Achieved"
                  value={`${summary.verdicts.not_achieved} activities`}
                />
                <div className="col-span-2 md:col-span-3 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 print:break-inside-avoid">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Total Labour Cost Implication
                    </p>
                    <p className="text-lg font-black text-primary">
                      {formatKes(summary.labourCost)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 pb-10">
            <div className="grid grid-cols-3 gap-6">
              {['Prepared By', 'Reviewed By', 'Approved By'].map((role) => (
                <div key={role} className="text-center">
                  <div className="border-t-2 border-border pt-2 mt-10">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {role}
                    </p>
                    <p className="text-xs font-bold">
                      {role === 'Prepared By' ? user?.name || '—' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-6 italic">
              Printed on {format(new Date(), 'EEEE, d MMMM yyyy HH:mm')}
            </p>
          </div>
        </div>

        {/* ---------------- One document per day ---------------- */}
        {reports.map((report, index) => (
          <div
            key={report.id}
            className={index < reports.length - 1 ? 'print:break-after-page' : ''}
          >
            <DailyReportDocument report={report} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailyReportPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">
            Preparing reports for printing...
          </p>
        </div>
      }
    >
      <DailyReportPrintView />
    </Suspense>
  );
}
