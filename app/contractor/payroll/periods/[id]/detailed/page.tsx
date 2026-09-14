'use client';

import { useState, useEffect, use, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  RotateCcw,
  Table2,
  Filter,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';
import { exportToCSV } from '@/lib/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

interface DetailedViewDay {
  key: string;
  dayOfMonth: number;
  weekday: number;
}

interface DetailedViewRow {
  workerId: string;
  workerName: string;
  designation: string;
  salary: number;
  overtimeRatePerHour: number;
  attendance: Record<string, { present: 0 | 1; overtimeHours: number }>;
  totalOvertimeHours: number;
  daysWorked: number;
  grossSalary: number;
  grossOt: number;
  grossSalaryPlusOt: number;
  payeTax: number;
  netPay: number;
  status: string;
}

interface DetailedViewData {
  period: { name: string; startDate: string; endDate: string };
  days: DetailedViewDay[];
  rows: DetailedViewRow[];
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fmtHalf = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

// Brand palette + logo (matches the transaction mini report PDF)
const BRAND_BROWN: [number, number, number] = [139, 69, 19]; // #8B4513 saddle brown (primary)
const BRAND_SIENNA: [number, number, number] = [160, 82, 45]; // #A0522D sienna (accent)
const BRAND_TINT: [number, number, number] = [249, 245, 240]; // light brown tint
const BRAND_ZEBRA: [number, number, number] = [252, 249, 246]; // zebra stripe tint
const BRAND_LINE: [number, number, number] = [222, 205, 189]; // wheat/brown grid line

const loadLogoDataUrl = async (): Promise<string | null> => {
  try {
    const res = await fetch('/default_full_logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export default function DetailedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [data, setData] = useState<DetailedViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [designationFilter, setDesignationFilter] = useState('');

  const fetchDetailedView = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/web/api/payroll-periods/${id}/detailed-view`);
      if (!res.ok) throw new Error('Failed to fetch detailed view');
      setData(await res.json());
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to load the detailed view. Please try again."), variant: "destructive" });
      setLoadError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetailedView();
  }, [fetchDetailedView]);

  const designations = data ? Array.from(new Set(data.rows.map(r => r.designation))).sort() : [];
  const filteredRows = data
    ? (designationFilter ? data.rows.filter(r => r.designation === designationFilter) : data.rows)
    : [];
  const totals = filteredRows.reduce(
    (acc, r) => ({
      totalOvertimeHours: acc.totalOvertimeHours + r.totalOvertimeHours,
      daysWorked: acc.daysWorked + r.daysWorked,
      grossSalary: acc.grossSalary + r.grossSalary,
      grossOt: acc.grossOt + r.grossOt,
      grossSalaryPlusOt: acc.grossSalaryPlusOt + r.grossSalaryPlusOt,
      payeTax: acc.payeTax + r.payeTax,
      netPay: acc.netPay + r.netPay,
    }),
    { totalOvertimeHours: 0, daysWorked: 0, grossSalary: 0, grossOt: 0, grossSalaryPlusOt: 0, payeTax: 0, netPay: 0 },
  );

  const exportRows = (rows: DetailedViewRow[]) => {
    if (!data) return { headers: [] as string[], body: [] as (string | number)[][] };
    const dayLabel = (d: DetailedViewDay) => `${new Date(d.key + 'T00:00:00').toLocaleString('en', { month: 'short' })} ${d.dayOfMonth}`;
    const headers = [
      'Worker', 'Designation', 'Salary', 'OT/hr',
      ...data.days.flatMap(d => [dayLabel(d), `${dayLabel(d)} OT`]),
      'Total OT Hours', 'Days', 'GROSS SALARY', 'GROSS OT', 'GROSS SALARY + OT', 'PAYE TAX', 'NET PAY', 'STATUS',
    ];
    const body = rows.map(r => [
      r.workerName,
      r.designation,
      r.salary,
      r.overtimeRatePerHour,
      ...data.days.flatMap(d => {
        const cell = r.attendance[d.key];
        return [cell ? cell.present : 0, cell ? fmtHalf(cell.overtimeHours) : '0'];
      }),
      fmtHalf(r.totalOvertimeHours),
      r.daysWorked,
      r.grossSalary.toFixed(2),
      r.grossOt.toFixed(2),
      r.grossSalaryPlusOt.toFixed(2),
      r.payeTax.toFixed(2),
      r.netPay.toFixed(2),
      r.status,
    ]);
    return { headers, body };
  };

  const fileSlug = data
    ? `detailed-view-${data.period.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
    : '';

  const handleExportCSV = () => {
    if (!data || filteredRows.length === 0) return;
    const { headers, body } = exportRows(filteredRows);
    const records = body.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
    exportToCSV(records, fileSlug);
    toast({ title: "Exported", description: "CSV file downloaded", variant: "success" });
  };

  const handleExportPDF = async () => {
    if (!data || filteredRows.length === 0) return;
    const { headers, body } = exportRows(filteredRows);
    const dayCount = data.days.length;
    const summaryStart = 4 + dayCount * 2;

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const right = pageWidth - 14;

    // Logo preloaded once; header/footer chrome drawn on every page
    // (including horizontal continuations) by the autoTable hook below.
    const logoDataUrl = await loadLogoDataUrl();
    const drawChrome = () => {
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 14, 11, 42, 11.07); // 4096x1080 logo, aspect preserved
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...BRAND_BROWN);
        doc.text('ReconSMI', 14, 18);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...BRAND_BROWN);
      doc.text(`DETAILED VIEW — ${data.period.name}`, right, 16, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`Generated: ${new Date().toLocaleString()}`, right, 21.5, { align: 'right' });

      // Brand brown divider rules
      doc.setDrawColor(...BRAND_BROWN);
      doc.setLineWidth(0.8);
      doc.line(14, 27, right, 27);
      doc.setDrawColor(...BRAND_SIENNA);
      doc.setLineWidth(0.25);
      doc.line(14, 28.5, right, 28.5);

      // Footer: brand rule + tagline
      doc.setDrawColor(...BRAND_SIENNA);
      doc.setLineWidth(0.4);
      doc.line(14, pageHeight - 14, right, pageHeight - 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_BROWN);
      doc.text('ReconSMI — Construction Hub', pageWidth / 2, pageHeight - 8, { align: 'center' });
    };

    // Totals row aligned under the summary columns.
    const foot = [
      `TOTAL (${filteredRows.length} worker${filteredRows.length === 1 ? '' : 's'})`,
      '', '', '',
      ...Array<string>(dayCount * 2).fill(''),
      fmtHalf(totals.totalOvertimeHours),
      String(totals.daysWorked),
      totals.grossSalary.toFixed(2),
      totals.grossOt.toFixed(2),
      totals.grossSalaryPlusOt.toFixed(2),
      totals.payeTax.toFixed(2),
      totals.netPay.toFixed(2),
      '',
    ];

    const columnStyles: Record<string, any> = {
      2: { halign: 'right' }, // Salary
      3: { halign: 'right' }, // OT/hr
    };
    for (let i = summaryStart; i < summaryStart + 7; i++) columnStyles[i] = { halign: 'right' };
    columnStyles[summaryStart + 1] = { halign: 'center' }; // Days
    columnStyles[summaryStart + 7] = { halign: 'center' }; // Status

    autoTable(doc, {
      startY: 34,
      head: [headers],
      body: body.map(row => row.map(String)),
      foot: [foot],
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1.5, lineColor: BRAND_LINE, lineWidth: 0.1, textColor: [26, 26, 26] },
      headStyles: { fillColor: BRAND_BROWN, textColor: 255, fontStyle: 'bold', fontSize: 6 },
      footStyles: { fillColor: BRAND_TINT, textColor: BRAND_BROWN, fontStyle: 'bold', fontSize: 6 },
      alternateRowStyles: { fillColor: BRAND_ZEBRA },
      columnStyles,
      margin: { top: 34, bottom: 20, left: 14, right: 14 },
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: ['0', '1'],
      didDrawPage: () => drawChrome(),
    });

    doc.save(`${fileSlug}.pdf`);
    toast({ title: "Exported", description: "PDF file downloaded", variant: "success" });
  };

  const periodHref = `/contractor/payroll/periods/${id}`;

  return (
    <div className="space-y-6 text-foreground">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/payroll">Payroll</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={periodHref}>{data?.period.name ?? 'Payroll Period'}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Detailed View</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href={periodHref}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-primary">Detailed View</h1>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {data
                ? `${data.period.name} — ${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()}`
                : 'Per-day attendance and overtime hours from biometric attendance'}
            </p>
          </div>
        </div>
        {data && data.rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="">All designations ({data.rows.length} workers)</option>
                {designations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Button onClick={fetchDetailedView} variant="outline" size="icon" disabled={loading}>
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={filteredRows.length === 0}>
              <FileSpreadsheet className="w-4 h-4" /> Excel (CSV)
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={filteredRows.length === 0}>
              <FileDown className="w-4 h-4" /> PDF
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Building detailed view from biometric attendance…</p>
          </div>
        </div>
      ) : loadError || !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <AlertCircle className="h-10 w-10" />
          <p className="text-sm">
            {loadError
              ? 'Could not load the detailed view. The period may not exist or you may lack permission.'
              : 'No detailed view data available for this period.'}
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link href={periodHref}><ArrowLeft className="w-4 h-4" /> Back to payroll period</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto max-h-[75vh]">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead rowSpan={2} className="sticky left-0 bg-muted z-30 min-w-[140px]">Worker</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 min-w-[110px] border-l">Designation</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l">Salary</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l">OT/hr</TableHead>
                {data.days.map(d => (
                  <TableHead key={d.key} colSpan={2} className="text-center border-l px-1">
                    <div className="font-mono">{d.dayOfMonth}</div>
                    <div className="text-[8px] font-normal text-muted-foreground">{WEEKDAY_LETTERS[d.weekday]}</div>
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-center border-l whitespace-nowrap">Total OT</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-center border-l">Days</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l whitespace-nowrap">Gross Salary</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l whitespace-nowrap">Gross OT</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l whitespace-nowrap">Gross + OT</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l whitespace-nowrap">PAYE</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-right border-l whitespace-nowrap">Net Pay</TableHead>
                <TableHead rowSpan={2} className="sticky bg-muted z-20 text-center border-l">Status</TableHead>
              </TableRow>
              <TableRow className="bg-muted hover:bg-muted">
                {data.days.map(d => (
                  <TableHead key={d.key} colSpan={2} className="h-6 text-center px-0 text-[9px] font-normal border-l">
                    <div className="grid grid-cols-2 divide-x">
                      <span>P</span>
                      <span>OT</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map(row => (
                <TableRow key={row.workerId}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">{row.workerName}</TableCell>
                  <TableCell className="whitespace-nowrap border-l">{row.designation}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(row.salary)}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap font-mono">{row.overtimeRatePerHour}</TableCell>
                  {data.days.map(d => {
                    const cell = row.attendance[d.key];
                    return (
                      <TableCell key={d.key} colSpan={2} className="p-0 border-l">
                        <div className="grid grid-cols-2 divide-x">
                          <div className={`text-center font-mono ${cell?.present ? 'text-emerald-600 font-semibold' : 'text-red-400'}`}>
                            {cell?.present ?? 0}
                          </div>
                          <div className={`text-center font-mono ${cell && cell.overtimeHours > 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground/50'}`}>
                            {cell && cell.overtimeHours > 0 ? fmtHalf(cell.overtimeHours) : '·'}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center border-l font-mono font-semibold text-amber-600 whitespace-nowrap">{fmtHalf(row.totalOvertimeHours)}</TableCell>
                  <TableCell className="text-center border-l font-mono">{row.daysWorked}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(row.grossSalary)}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(row.grossOt)}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap font-medium">{formatCurrency(row.grossSalaryPlusOt)}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(row.payeTax)}</TableCell>
                  <TableCell className="text-right border-l whitespace-nowrap font-semibold">{formatCurrency(row.netPay)}</TableCell>
                  <TableCell className="text-center border-l">
                    <Badge variant={row.status === 'paid' ? 'default' : 'secondary'} className={row.status === 'paid' ? 'bg-emerald-600' : ''}>
                      {row.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/60 hover:bg-muted/60 font-semibold">
                <TableCell colSpan={4} className="sticky left-0 bg-muted/60 z-10 whitespace-nowrap">
                  TOTAL ({filteredRows.length} worker{filteredRows.length === 1 ? '' : 's'})
                </TableCell>
                <TableCell colSpan={data.days.length * 2} className="text-center text-[10px] font-normal text-muted-foreground">
                  {data.days.length} day{data.days.length === 1 ? '' : 's'} in period
                </TableCell>
                <TableCell className="text-center border-l font-mono whitespace-nowrap">{fmtHalf(totals.totalOvertimeHours)}</TableCell>
                <TableCell className="text-center border-l font-mono">{totals.daysWorked}</TableCell>
                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(totals.grossSalary)}</TableCell>
                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(totals.grossOt)}</TableCell>
                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(totals.grossSalaryPlusOt)}</TableCell>
                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(totals.payeTax)}</TableCell>
                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(totals.netPay)}</TableCell>
                <TableCell className="border-l" />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
