import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';
import { getRangeReports } from '@/lib/daily-report-data';
import { addDays, format } from 'date-fns';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  computeLabourCost,
  formatKes,
  VERDICT_LABELS,
  type WorkforceEntry,
} from '@/lib/daily-report';

// ---------------------------------------------------------------------------
// Daily Site Progress & Next-Day Planning Report - PDF export.
//
// GET /web/api/daily-reports/pdf?siteId=&from=&to=
//
// Streams a PDF with a cover page followed by one document per day (the same
// merged range the print preview renders): a single day, a whole week, or
// several weeks of merged daily reports.
// ---------------------------------------------------------------------------

// Brand brown - matches the purchase order PDF table headers.
const PRIMARY: [number, number, number] = [139, 69, 19];
const GRAY: [number, number, number] = [110, 110, 110];
const GREEN: [number, number, number] = [16, 185, 129];
const AMBER: [number, number, number] = [217, 119, 6];

const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP_Y = 20;
const BOTTOM_Y = 282;

interface Cursor {
  y: number;
}

interface PdfReport {
  id: string;
  reportDate: Date;
  status: string;
  uploads: unknown;
  activities: {
    position: number;
    title: string;
    description: string | null;
    plannedWorkforce: unknown;
    actualWorkforce: unknown;
    labourCost: number;
    verdict: string | null;
    remarks: string | null;
    photos: unknown;
  }[];
  targets: {
    position: number;
    title: string;
    description: string | null;
    workforce: unknown;
    remarks: string | null;
    uploads: unknown;
  }[];
  deliveries: { item: string; quantity: number; unit: string | null; supplier: string | null; notes: string | null }[];
  materials: { item: string; quantity: number; unit: string | null; notes: string | null }[];
  site?: { name: string; location: string; contractor: { companyName: string } } | null;
  dayWorkforce?: { category: string; count: number }[];
  dayVisitors?: {
    id: string;
    name: string;
    company: string | null;
    purpose: string;
    checkInTime: Date;
    checkOutTime: Date | null;
  }[];
  dayIncidents?: {
    id: string;
    title: string;
    type: string;
    severity: string;
    status: string;
  }[];
  dayDeliveries?: {
    id: string;
    orderNumber: string;
    supplier: string;
    status: string;
    items: { description: string; quantity: number }[];
  }[];
}

function asWorkforce(value: unknown): WorkforceEntry[] {
  return Array.isArray(value)
    ? (value as WorkforceEntry[]).filter((e) => e && typeof e.category === 'string')
    : [];
}

function asFiles(value: unknown): { url: string; name?: string }[] {
  return Array.isArray(value)
    ? (value as { url: string; name?: string }[]).filter((e) => e && typeof e.url === 'string')
    : [];
}

function workforceLine(entries: WorkforceEntry[]): string {
  return entries.length > 0
    ? entries.map((e) => `${e.category} - ${e.count}`).join('    ')
    : '';
}

function ensureSpace(doc: any, cursor: Cursor, needed: number) {
  if (cursor.y + needed > BOTTOM_Y) {
    doc.addPage();
    cursor.y = TOP_Y;
  }
}

function sectionTitle(doc: any, cursor: Cursor, text: string) {
  ensureSpace(doc, cursor, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text(text, MARGIN, cursor.y);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, cursor.y + 1.5, PAGE_W - MARGIN, cursor.y + 1.5);
  doc.setTextColor(0, 0, 0);
  cursor.y += 9;
}

function field(doc: any, cursor: Cursor, label: string, value: string) {
  ensureSpace(doc, cursor, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), MARGIN, cursor.y);
  cursor.y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const text = value && value.trim() !== '' ? value : '—';
  const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
  for (const line of lines) {
    ensureSpace(doc, cursor, 6);
    doc.text(line, MARGIN, cursor.y);
    cursor.y += 5;
  }
  cursor.y += 2;
}

function plainNote(doc: any, cursor: Cursor, text: string) {
  ensureSpace(doc, cursor, 8);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(text, MARGIN, cursor.y);
  doc.setTextColor(0, 0, 0);
  cursor.y += 6;
}

function drawTable(doc: any, cursor: Cursor, head: string[], body: string[][]) {
  autoTable(doc, {
    startY: cursor.y,
    head: [head],
    body,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    margin: { left: MARGIN, right: MARGIN },
  });
  cursor.y = (doc as any).lastAutoTable.finalY + 6;
}

async function loadImage(url: string): Promise<{ data: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    if (!url || url.includes('..')) return null;
    const filename = basename(url);
    const ext = extname(filename).toLowerCase();
    const format = ext === '.png' ? 'PNG' : ext === '.jpg' || ext === '.jpeg' ? 'JPEG' : null;
    if (!format) return null;
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    if (!existsSync(filePath)) return null;
    const buffer = await readFile(filePath);
    return { data: buffer.toString('base64'), format };
  } catch {
    return null;
  }
}

async function drawPhotos(doc: any, cursor: Cursor, files: { url: string; name?: string }[]) {
  const usable = files.slice(0, 2);
  if (usable.length === 0) return;
  const loaded: { data: string; format: 'PNG' | 'JPEG'; name?: string; url: string }[] = [];
  for (const file of usable) {
    const image = await loadImage(file.url);
    if (image) loaded.push({ ...image, name: file.name, url: file.url });
  }
  if (loaded.length > 0) {
    const w = CONTENT_W / 2 - 3;
    const h = w * 0.75;
    ensureSpace(doc, cursor, h + 10);
    loaded.forEach((image, j) => {
      const x = MARGIN + j * (w + 6);
      doc.addImage(image.data, image.format, x, cursor.y, w, h);
    });
    cursor.y += h + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    loaded.forEach((image, j) => {
      doc.text(image.name || `Photo ${j + 1}`, MARGIN + j * (w + 6), cursor.y);
    });
    doc.setTextColor(0, 0, 0);
    cursor.y += 4;
  }
  const skipped = usable.filter((file) => !loaded.some((l) => l.url === file.url));
  if (skipped.length > 0) {
    field(doc, cursor, 'Attachments', skipped.map((f) => f.name || f.url).join(', '));
  }
}

function dayLabel(date: Date): string {
  return format(date, 'EEEE, d MMMM yyyy');
}

function verdictLine(verdict: string | null): string {
  const marks = [
    { value: 'achieved', label: VERDICT_LABELS.achieved },
    { value: 'partially_achieved', label: VERDICT_LABELS.partially_achieved },
    { value: 'not_achieved', label: VERDICT_LABELS.not_achieved },
  ];
  return marks
    .map((mark) => `${mark.value === verdict ? '[x]' : '[ ]'} ${mark.label}`)
    .join('    ');
}

async function renderReport(
  doc: any,
  report: PdfReport,
  designations: { title: string; salary: number | null }[]
) {
  doc.addPage();
  const cursor: Cursor = { y: TOP_Y };
  const siteName = report.site?.name || '';
  const contractorName = report.site?.contractor?.companyName || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text('DAILY SITE PROGRESS & NEXT-DAY PLANNING REPORT', MARGIN, cursor.y);
  cursor.y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text([contractorName, siteName].filter(Boolean).join(' — ') || 'Site Report', MARGIN, cursor.y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(report.status === 'Submitted' ? GREEN : AMBER));
  doc.text(report.status.toUpperCase(), PAGE_W - MARGIN, cursor.y, { align: 'right' });
  cursor.y += 3;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, cursor.y, PAGE_W - MARGIN, cursor.y);
  doc.setTextColor(0, 0, 0);
  cursor.y += 8;

  // ---------------- A. TODAY'S PERFORMANCE ----------------
  sectionTitle(doc, cursor, "A. TODAY'S PERFORMANCE");
  field(doc, cursor, 'Date (automatic)', dayLabel(report.reportDate));
  field(
    doc,
    cursor,
    'Total Workforce on Site (from attendance records)',
    workforceLine(report.dayWorkforce || []) || 'No attendance records for this day'
  );

  if (report.activities.length === 0) {
    plainNote(doc, cursor, 'No activities recorded for this day.');
  }
  for (const [index, activity] of report.activities.entries()) {
    ensureSpace(doc, cursor, 22);
    doc.setFillColor(238, 242, 246);
    doc.rect(MARGIN, cursor.y - 4, CONTENT_W, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text(`ACTIVITY ${index + 1}: ${activity.title}`, MARGIN + 2, cursor.y);
    doc.setTextColor(0, 0, 0);
    cursor.y += 10;

    field(doc, cursor, 'Activity Description', activity.description || '');
    field(
      doc,
      cursor,
      "Planned Workforce (auto from yesterday's target)",
      workforceLine(asWorkforce(activity.plannedWorkforce))
    );
    const actual = asWorkforce(activity.actualWorkforce);
    field(doc, cursor, 'Actual Labour Assigned', workforceLine(actual));

    const cost = computeLabourCost(actual, designations);
    if (cost.lines.length > 0) {
      ensureSpace(doc, cursor, 6 + cost.lines.length * 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text('ACTIVITY LABOUR COST IMPLICATION (AUTO-CALCULATED)', MARGIN, cursor.y);
      cursor.y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      for (const line of cost.lines) {
        ensureSpace(doc, cursor, 6);
        doc.text(
          `${line.category} (${line.count} x ${line.rate > 0 ? formatKes(line.rate) : 'no rate'})`,
          MARGIN,
          cursor.y
        );
        doc.text(formatKes(line.cost), PAGE_W - MARGIN, cursor.y, { align: 'right' });
        cursor.y += 5;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Total', MARGIN, cursor.y);
      doc.setTextColor(...PRIMARY);
      doc.text(formatKes(activity.labourCost ?? cost.total), PAGE_W - MARGIN, cursor.y, {
        align: 'right',
      });
      doc.setTextColor(0, 0, 0);
      cursor.y += 7;
    }
    field(doc, cursor, 'Verdict', verdictLine(activity.verdict));
    field(doc, cursor, 'Remarks / Challenges', activity.remarks || '');
    await drawPhotos(doc, cursor, asFiles(activity.photos));
    cursor.y += 2;
  }

  // ---------------- B. NEXT DAY'S TARGET ----------------
  sectionTitle(doc, cursor, "B. NEXT DAY'S TARGET");
  field(doc, cursor, 'Date (automatic)', dayLabel(addDays(report.reportDate, 1)));
  if (report.targets.length === 0) {
    plainNote(doc, cursor, 'No targets set for the next day.');
  }
  for (const [index, target] of report.targets.entries()) {
    ensureSpace(doc, cursor, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text(`ACTIVITY ${index + 1}: ${target.title}`, MARGIN, cursor.y);
    doc.setTextColor(0, 0, 0);
    cursor.y += 6;
    field(doc, cursor, 'Activity Description', target.description || '');
    field(
      doc,
      cursor,
      'Target Workforce',
      workforceLine(asWorkforce(target.workforce))
    );
    field(doc, cursor, 'Remarks', target.remarks || '');
    await drawPhotos(doc, cursor, asFiles(target.uploads));
    cursor.y += 2;
  }

  // ---------------- MATERIALS ----------------
  sectionTitle(doc, cursor, 'MATERIALS MANAGEMENT');
  if (report.deliveries.length > 0) {
    drawTable(
      doc,
      cursor,
      ['Deliveries - Item', 'Qty', 'Unit', 'Supplier'],
      report.deliveries.map((d) => [d.item, String(d.quantity), d.unit || '-', d.supplier || '-'])
    );
  } else {
    plainNote(doc, cursor, 'No deliveries listed.');
  }
  if (report.materials.length > 0) {
    drawTable(
      doc,
      cursor,
      ['Material Required - Item', 'Qty', 'Unit', 'Notes'],
      report.materials.map((m) => [m.item, String(m.quantity), m.unit || '-', m.notes || '-'])
    );
  } else {
    plainNote(doc, cursor, 'No materials required listed.');
  }
  const poDeliveries = report.dayDeliveries || [];
  if (poDeliveries.length > 0) {
    drawTable(
      doc,
      cursor,
      ['PO# (received this day)', 'Supplier', 'Items', 'Status'],
      poDeliveries.map((d) => [
        d.orderNumber,
        d.supplier,
        d.items.map((i) => `${i.description} (${i.quantity})`).join(', '),
        d.status === 'delivered' ? 'Delivered' : 'Partial',
      ])
    );
  }
  const attachments = asFiles(report.uploads);
  if (attachments.length > 0) {
    field(
      doc,
      cursor,
      'Materials Attachments / Delivery Notes',
      attachments.map((a) => a.name || a.url).join(', ')
    );
  }

  // ---------------- VISITORS ----------------
  sectionTitle(doc, cursor, 'VISITOR MANAGEMENT');
  const visitors = report.dayVisitors || [];
  if (visitors.length > 0) {
    drawTable(
      doc,
      cursor,
      ['Name', 'Company', 'Purpose', 'Check In', 'Check Out'],
      visitors.map((v) => [
        v.name,
        v.company || '-',
        v.purpose,
        format(new Date(v.checkInTime), 'HH:mm'),
        v.checkOutTime ? format(new Date(v.checkOutTime), 'HH:mm') : 'On site',
      ])
    );
  } else {
    plainNote(doc, cursor, 'No visitors recorded for this day.');
  }

  // ---------------- SAFETY ----------------
  sectionTitle(doc, cursor, 'SAFETY - INCIDENCES');
  const incidents = report.dayIncidents || [];
  if (incidents.length > 0) {
    drawTable(
      doc,
      cursor,
      ['Title', 'Type', 'Severity', 'Status'],
      incidents.map((i) => [i.title, i.type, i.severity, i.status])
    );
  } else {
    plainNote(doc, cursor, 'No safety incidences recorded for this day.');
  }
}

function drawCover(
  doc: any,
  options: {
    contractorName: string;
    siteName: string;
    siteLocation: string;
    isSingleDay: boolean;
    periodLabel: string;
    stats: {
      reportCount: number;
      activities: number;
      targets: number;
      workforce: number;
      labourCost: number;
      achieved: number;
      partially: number;
      notAchieved: number;
    };
  }
) {
  const { contractorName, siteName, siteLocation, isSingleDay, periodLabel, stats } =
    options;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(contractorName || 'Construction Site Management', PAGE_W / 2, 34, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...PRIMARY);
  doc.text(isSingleDay ? 'DAILY REPORT' : 'MERGED DAILY REPORTS', PAGE_W / 2, 56, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text('DAILY SITE PROGRESS & NEXT-DAY PLANNING REPORT', PAGE_W / 2, 64, {
    align: 'center',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(periodLabel, PAGE_W / 2, 73, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const siteLine = [siteName, siteLocation].filter(Boolean).join(' - ');
  if (siteLine) {
    doc.text(siteLine, PAGE_W / 2, 80, { align: 'center' });
  }

  const rows: [string, string][] = [
    ['Days Reported', `${stats.reportCount}`],
    ['Activities', `${stats.activities}`],
    ['Next-Day Targets', `${stats.targets}`],
    ['Workforce (Attendance)', `${stats.workforce} present`],
    ['Achieved', `${stats.achieved} activities`],
    ['Partially Achieved', `${stats.partially} activities`],
    ['Not Achieved', `${stats.notAchieved} activities`],
  ];
  autoTable(doc, {
    startY: 100,
    body: rows.map(([label, value]) => [label, value]),
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { halign: 'right' as const },
    },
    margin: { left: 55, right: 55 },
  });
  let y = (doc as any).lastAutoTable.finalY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text('Total Labour Cost Implication', 55, y);
  doc.text(formatKes(stats.labourCost), 155, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(`Printed on ${format(new Date(), 'EEEE, d MMMM yyyy HH:mm')}`, PAGE_W / 2, 285, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);
}

function parseDayParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'reports:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!siteId || !from || !to) {
      return NextResponse.json(
        { error: 'siteId, from and to query parameters are required' },
        { status: 400 }
      );
    }
    const owns = await verifySiteOwnership(contractorId, siteId);
    if (!owns) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    const fromDay = parseDayParam(from);
    const toDay = parseDayParam(to);
    if (!fromDay || !toDay || fromDay > toDay) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const [reports, designations] = await Promise.all([
      getRangeReports(siteId, fromDay, toDay),
      prisma.designation.findMany({
        where: { contractorId, isActive: true },
        select: { title: true, salary: true },
      }),
    ]);

    if (reports.length === 0) {
      return NextResponse.json(
        { error: 'No daily reports found in the selected range' },
        { status: 404 }
      );
    }

    const stats = {
      reportCount: reports.length,
      activities: reports.reduce((sum, r) => sum + r.activities.length, 0),
      targets: reports.reduce((sum, r) => sum + r.targets.length, 0),
      workforce: reports.reduce(
        (sum, r) => sum + (r.dayWorkforce || []).reduce((s, w) => s + w.count, 0),
        0
      ),
      labourCost: reports.reduce(
        (sum, r) => sum + r.activities.reduce((s, a) => s + (a.labourCost || 0), 0),
        0
      ),
      achieved: 0,
      partially: 0,
      notAchieved: 0,
    };
    for (const report of reports) {
      for (const activity of report.activities) {
        if (activity.verdict === 'achieved') stats.achieved += 1;
        else if (activity.verdict === 'partially_achieved') stats.partially += 1;
        else if (activity.verdict === 'not_achieved') stats.notAchieved += 1;
      }
    }

    const first = reports[0] as any;
    const isSingleDay = reports.length === 1 && fromDay.getTime() === toDay.getTime();
    const periodLabel = isSingleDay
      ? dayLabel(fromDay)
      : `${dayLabel(fromDay)} — ${dayLabel(toDay)}`;

    const doc = new jsPDF() as any;
    drawCover(doc, {
      contractorName: first.site?.contractor?.companyName || '',
      siteName: first.site?.name || '',
      siteLocation: first.site?.location || '',
      isSingleDay,
      periodLabel,
      stats,
    });
    for (const report of reports) {
      await renderReport(doc, report as any, designations);
    }

    const filename = isSingleDay
      ? `Daily-Report-${from}.pdf`
      : `Daily-Reports-${from}_to_${to}.pdf`;
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate daily reports PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
