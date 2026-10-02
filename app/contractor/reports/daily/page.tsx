'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  CalendarDays,
  CalendarRange,
  Loader2,
  AlertCircle,
  Pencil,
  Eye,
  FileText,
  CalendarCheck,
} from 'lucide-react';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSite } from '@/hooks/use-site';
import { getErrorMessage } from '@/lib/toast-utils';
import {
  formatKes,
  toDateKey,
  VERDICT_BADGE_CLASSES,
  VERDICT_LABELS,
} from '@/lib/daily-report';

interface ReportSummary {
  id: string;
  reportDate: string;
  status: string;
  activities: { title: string; verdict: string | null; labourCost: number }[];
  targets: { title: string }[];
  _count: { deliveries: number; materials: number };
}

export default function DailyReportsPage() {
  const { activeSite } = useSite();
  const [tab, setTab] = useState('daily');
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStart = weekAnchor;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const monthStart = monthAnchor;
  const monthEnd = endOfMonth(monthAnchor);
  const rangeStart = tab === 'daily' ? weekStart : monthStart;
  const rangeEnd = tab === 'daily' ? weekEnd : monthEnd;

  const fetchReports = async () => {
    if (!activeSite) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        siteId: activeSite.id,
        listFrom: toDateKey(rangeStart),
        listTo: toDateKey(rangeEnd),
        limit: '62',
      });
      const res = await fetch(`/web/api/daily-reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load daily reports');
      const json = await res.json();
      setReports(json.reports || []);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load daily reports. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeSite, tab, weekAnchor, monthAnchor]);

  const reportsByKey = useMemo(() => {
    const map = new Map<string, ReportSummary>();
    for (const report of reports) {
      map.set(toDateKey(new Date(report.reportDate)), report);
    }
    return map;
  }, [reports]);

  const printHref = (from: Date, to: Date) => {
    const params = new URLSearchParams({
      siteId: activeSite?.id || '',
      from: toDateKey(from),
      to: toDateKey(to),
    });
    return `/contractor/reports/daily/print?${params.toString()}`;
  };

  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekReportCount = weekDays.filter((day) => reportsByKey.has(toDateKey(day))).length;
  const monthReportCount = reports.length;

  const monthWeeks = useMemo(() => {
    const weeks: { start: Date; end: Date }[] = [];
    let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
    while (cursor <= monthEnd) {
      weeks.push({ start: cursor, end: endOfWeek(cursor, { weekStartsOn: 1 }) });
      cursor = addWeeks(cursor, 1);
    }
    return weeks;
  }, [monthStart, monthEnd]);

  const summarizeVerdicts = (list: ReportSummary[]) => {
    const counts = { achieved: 0, partially_achieved: 0, not_achieved: 0 };
    for (const report of list) {
      for (const activity of report.activities) {
        if (activity.verdict && activity.verdict in counts) {
          counts[activity.verdict as keyof typeof counts] += 1;
        }
      }
    }
    return counts;
  };

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
            <BreadcrumbPage>Daily Site Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Daily Site Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm italic">
            Daily site progress &amp; next-day planning reports — print a single day, a
            merged week, or merged weekly reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'daily' && weekReportCount > 0 && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={printHref(weekStart, weekEnd)}>
                <Printer className="w-4 h-4" />
                <span>Print Merged Week</span>
              </Link>
            </Button>
          )}
          {tab === 'weekly' && monthReportCount > 0 && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={printHref(monthStart, monthEnd)}>
                <Printer className="w-4 h-4" />
                <span>Print Merged Weekly Reports</span>
              </Link>
            </Button>
          )}
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Link href="/contractor/reports/daily/new">
              <Plus className="w-4 h-4" />
              <span>New Daily Report</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30">
          <TabsTrigger value="daily" className="gap-2">
            <CalendarDays className="w-4 h-4" /> Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <CalendarRange className="w-4 h-4" /> Weekly
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Daily tab ---------------- */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setWeekAnchor(subWeeks(weekStart, 1))}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm font-bold">
                {format(weekStart, 'EEE d MMM')} — {format(weekEnd, 'EEE d MMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setWeekAnchor(addWeeks(weekStart, 1))}
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-bold"
              onClick={() => setWeekAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              This Week
            </Button>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground italic">Loading reports...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchReports}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase">Day</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase">
                        Activities &amp; Verdicts
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase text-center">
                        Next-Day Targets
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekDays.map((day) => {
                      const key = toDateKey(day);
                      const report = reportsByKey.get(key);
                      const isToday = key === todayKey;
                      const isPast = key < todayKey;
                      const isFuture = key > todayKey;
                      return (
                        <TableRow
                          key={key}
                          className={isToday ? 'bg-primary/5' : 'hover:bg-muted/20'}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                  report
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted/40 text-muted-foreground'
                                }`}
                              >
                                {format(day, 'd')}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{format(day, 'EEEE')}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(day, 'd MMMM yyyy')}
                                  {isToday && (
                                    <span className="text-primary font-bold"> · Today</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report ? (
                              <Badge
                                className={`text-[10px] font-black uppercase px-2 py-0 border-none ${
                                  report.status === 'Submitted'
                                    ? 'bg-emerald-500/10 text-emerald-700'
                                    : 'bg-amber-500/10 text-amber-700'
                                }`}
                              >
                                {report.status}
                              </Badge>
                            ) : isFuture ? (
                              <span className="text-xs text-muted-foreground italic">
                                Upcoming
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/70 italic">
                                Not created
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {report && report.activities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {report.activities.map((activity, i) => (
                                  <Badge
                                    key={i}
                                    className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${
                                      activity.verdict
                                        ? VERDICT_BADGE_CLASSES[activity.verdict]
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {activity.title}
                                    {activity.verdict
                                      ? ` · ${VERDICT_LABELS[activity.verdict]}`
                                      : ' · no verdict'}
                                  </Badge>
                                ))}
                              </div>
                            ) : report ? (
                              <span className="text-xs text-muted-foreground italic">
                                No activities
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {report ? (
                              <span className="text-sm font-bold">
                                {report.targets.length}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {report ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                                  <Link href={`/contractor/reports/daily/${report.id}`}>
                                    <Eye className="w-4 h-4" />
                                    <span className="text-xs font-bold hidden sm:inline">
                                      View
                                    </span>
                                  </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                                  <Link href={`/contractor/reports/daily/${report.id}/edit`}>
                                    <Pencil className="w-4 h-4" />
                                    <span className="text-xs font-bold hidden sm:inline">
                                      Edit
                                    </span>
                                  </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                                  <Link href={printHref(day, day)}>
                                    <Printer className="w-4 h-4" />
                                    <span className="text-xs font-bold hidden sm:inline">
                                      Print
                                    </span>
                                  </Link>
                                </Button>
                              </div>
                            ) : isToday ? (
                              <Button asChild size="sm" className="gap-1 h-8 bg-primary hover:bg-primary/90 text-white">
                                <Link href="/contractor/reports/daily/new">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="text-xs font-bold">Create</span>
                                </Link>
                              </Button>
                            ) : isPast ? (
                              <span className="text-[10px] text-muted-foreground/60 italic">
                                Day passed
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic">
                                From {format(day, 'EEEE')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Weekly tab ---------------- */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMonthAnchor(subMonths(monthStart, 1))}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm font-bold">
                {format(monthStart, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMonthAnchor(addMonths(monthStart, 1))}
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-bold"
              onClick={() => setMonthAnchor(startOfMonth(new Date()))}
            >
              This Month
            </Button>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Weekly Reports
                </CardTitle>
                <CardDescription className="text-sm italic">
                  Each week merges its daily reports. Print one week, or all weeks of{' '}
                  {format(monthStart, 'MMMM yyyy')} merged together.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground italic">Loading weeks...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchReports}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase">Week</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-center">
                        Days Reported
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase">
                        Verdict Summary
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">
                        Labour Cost
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthWeeks.map((week, index) => {
                      const weekReports = reports.filter((report) => {
                        const date = new Date(report.reportDate);
                        return date >= week.start && date <= week.end;
                      });
                      const verdicts = summarizeVerdicts(weekReports);
                      const labourCost = weekReports.reduce(
                        (sum, report) =>
                          sum + report.activities.reduce((s, a) => s + (a.labourCost || 0), 0),
                        0
                      );
                      const isCurrentWeek =
                        startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() ===
                        week.start.getTime();
                      return (
                        <TableRow
                          key={index}
                          className={isCurrentWeek ? 'bg-primary/5' : 'hover:bg-muted/20'}
                        >
                          <TableCell>
                            <div>
                              <p className="text-sm font-bold">
                                Week {index + 1}
                                {isCurrentWeek && (
                                  <span className="text-primary text-[10px] font-black uppercase">
                                    {' '}
                                    · Current
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(week.start, 'EEE d MMM')} —{' '}
                                {format(week.end, 'EEE d MMM yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`text-sm font-black ${
                                weekReports.length > 0 ? 'text-foreground' : 'text-muted-foreground/50'
                              }`}
                            >
                              {weekReports.length}
                            </span>
                            <span className="text-[10px] text-muted-foreground"> / 7</span>
                          </TableCell>
                          <TableCell>
                            {weekReports.length === 0 ? (
                              <span className="text-xs text-muted-foreground/50 italic">
                                No reports
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                <Badge className="text-[9px] font-bold uppercase px-1.5 py-0 border-none bg-emerald-500/10 text-emerald-700">
                                  {verdicts.achieved} Achieved
                                </Badge>
                                <Badge className="text-[9px] font-bold uppercase px-1.5 py-0 border-none bg-amber-500/10 text-amber-700">
                                  {verdicts.partially_achieved} Partial
                                </Badge>
                                <Badge className="text-[9px] font-bold uppercase px-1.5 py-0 border-none bg-red-500/10 text-red-700">
                                  {verdicts.not_achieved} Not Achieved
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold">
                            {labourCost > 0 ? formatKes(labourCost) : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {weekReports.length > 0 ? (
                              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                                <Link href={printHref(week.start, week.end)}>
                                  <Printer className="w-4 h-4" />
                                  <span className="text-xs font-bold">Print Week</span>
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground/50 italic">
                                Nothing to print
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {reports.length === 0 && !isLoading && !error && (
        <Card className="border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-20" />
            <p className="text-sm italic">
              No daily reports yet for this period. Create today&apos;s report to get
              started.
            </p>
            <Button asChild size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white">
              <Link href="/contractor/reports/daily/new">
                <Plus className="w-4 h-4" /> Create Today&apos;s Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
