import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';
import { getRangeReports } from '@/lib/daily-report-data';
import { siteCategoryLabel } from '@/lib/site-report';
import { format, startOfWeek } from 'date-fns';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Weekly Progress Report - PDF export (the contractor's SAMPLE REPORT.docx
// template).
//
// GET /web/api/weekly-report/pdf?siteId=&from=&to=
//
// `from`/`to` are the week range (Monday - Sunday as the reports page
// computes it). The report title comes from the site name (plus the site
// image in the header); "Prepared by" picks the logged-in user's name; the
// PROJECT DATA / CONSTRUCTION STATUS sections come from the site's
// weekly-report fields and category; the PROJECT TEAM section from the
// staff (TeamMember) assigned to the site; and the ACTIVITY SUMMARY section
// is picked from the week's daily activity reports (titles, photos),
// grouped per day and numbered continuously across the week like the
// sample template.
// ---------------------------------------------------------------------------

const PRIMARY: [number, number, number] = [139, 69, 19];
const GRAY: [number, number, number] = [110, 110, 110];

const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP_Y = 20;
const BOTTOM_Y = 282;

interface Cursor {
  y: number;
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

/** "Label: value" row like the sample template (bold label, wrapped value). */
function row(doc: any, cursor: Cursor, label: string, value: string) {
  const text = value && value.trim() !== '' ? value : '—';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  const labelLine = `${label}: `;
  const labelW = doc.getTextWidth(labelLine);
  ensureSpace(doc, cursor, 8);
  doc.text(labelLine, MARGIN, cursor.y);
  const remaining = CONTENT_W - labelW;
  const fits = doc.getTextWidth(text);
  if (fits <= remaining) {
    doc.setFont('helvetica', 'normal');
    doc.text(text, MARGIN + labelW, cursor.y);
    cursor.y += 6;
    return;
  }
  const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
  doc.setFont('helvetica', 'normal');
  let first = true;
  for (const line of lines) {
    ensureSpace(doc, cursor, 6);
    if (first) {
      doc.text(line, MARGIN + labelW, cursor.y);
      first = false;
    } else {
      doc.text(line, MARGIN, cursor.y);
    }
    cursor.y += 5.5;
  }
  cursor.y += 1;
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

/** The two photos accompanying each activity (sample template requirement). */
async function drawActivityPhotos(
  doc: any,
  cursor: Cursor,
  files: { url: string; name?: string }[]
) {
  const usable = files.slice(0, 2);
  const loaded: { data: string; format: 'PNG' | 'JPEG' }[] = [];
  for (const file of usable) {
    const image = await loadImage(file.url);
    if (image) loaded.push(image);
  }
  if (loaded.length === 0) {
    if (usable.length > 0) {
      plainNote(doc, cursor, 'Photos attached but not available (image files missing).');
    }
    return;
  }
  const w = CONTENT_W / 2 - 3;
  const h = w * 0.75;
  ensureSpace(doc, cursor, h + 8);
  loaded.forEach((image, j) => {
    const x = MARGIN + j * (w + 6);
    doc.addImage(image.data, image.format, x, cursor.y, w, h);
  });
  cursor.y += h + 4;
}

function parseDayParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

function asFiles(value: unknown): { url: string; name?: string }[] {
  return Array.isArray(value)
    ? (value as { url: string; name?: string }[]).filter((e) => e && typeof e.url === 'string')
    : [];
}

function monthsBetween(start: Date, end: Date): number {
  if (end < start) return 0;
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Monday key of a report date (server-local, same grouping as the UI). */
function weekKey(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/**
 * Sequential weekly report number like the sample ("REPORT NO. 127"): the
 * 1-based index of this week among all of the site's weeks that have daily
 * reports, chronologically.
 */
function computeWeeklyReportNumber(reportDates: Date[], fromDay: Date): number {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const date of reportDates) {
    const key = weekKey(date);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys.indexOf(weekKey(fromDay)) + 1;
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

    const [site, allReportDates, weekReports, user] = await Promise.all([
      prisma.site.findFirst({
        where: { id: siteId, contractorId },
        include: {
          contractor: { select: { companyName: true, location: true } },
          team: {
            where: { status: { not: 'Suspended' } },
            select: { name: true, role: true },
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
          },
        },
      }),
      prisma.dailyReport.findMany({
        where: { siteId },
        select: { reportDate: true },
        orderBy: { reportDate: 'asc' },
      }),
      getRangeReports(siteId, fromDay, toDay),
      prisma.user.findUnique({
        where: { id: permCheck.userId! },
        select: { name: true },
      }),
    ]);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    if (weekReports.length === 0) {
      return NextResponse.json(
        { error: 'No daily reports found in the selected week' },
        { status: 404 }
      );
    }

    const reportNo = computeWeeklyReportNumber(
      allReportDates.map((r) => r.reportDate),
      fromDay
    );
    const contractorName = site.contractor?.companyName || '';

    const doc = new jsPDF() as any;
    const cursor: Cursor = { y: TOP_Y };

    // ---------------- Title block ----------------
    if (site.image) {
      const image = await loadImage(site.image);
      if (image) {
        const maxW = 70;
        const maxH = 40;
        let w = maxW;
        let h = maxH;
        try {
          const props = doc.getImageProperties(image.data);
          if (props?.width && props?.height) {
            const ratio = Math.min(maxW / props.width, maxH / props.height);
            w = props.width * ratio;
            h = props.height * ratio;
          }
        } catch {
          // keep the default box size
        }
        ensureSpace(doc, cursor, h + 6);
        doc.addImage(image.data, image.format, (PAGE_W - w) / 2, cursor.y, w, h);
        cursor.y += h + 5;
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const titleText = site.name.toUpperCase();
    const titleLines = doc.splitTextToSize(titleText, CONTENT_W) as string[];
    for (const line of titleLines) {
      ensureSpace(doc, cursor, 7);
      doc.text(line, PAGE_W / 2, cursor.y, { align: 'center' });
      cursor.y += 6;
    }
    ensureSpace(doc, cursor, 8);
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY);
    doc.text(`WEEKLY PROGRESS REPORT NO. ${reportNo}`, PAGE_W / 2, cursor.y, {
      align: 'center',
    });
    cursor.y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date Issued: ${format(new Date(), 'd MMMM yyyy')}`, PAGE_W / 2, cursor.y, {
      align: 'center',
    });
    cursor.y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Prepared by:', PAGE_W / 2, cursor.y, { align: 'center' });
    cursor.y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(user?.name || contractorName || '—', PAGE_W / 2, cursor.y, {
      align: 'center',
    });
    cursor.y += 5;
    doc.text(contractorName, PAGE_W / 2, cursor.y, { align: 'center' });
    cursor.y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    if (site.contractor?.location) {
      doc.text(site.contractor.location, PAGE_W / 2, cursor.y, { align: 'center' });
      cursor.y += 4;
    }
    cursor.y += 2;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, cursor.y, PAGE_W - MARGIN, cursor.y);
    doc.setTextColor(0, 0, 0);
    cursor.y += 9;

    // ---------------- PROJECT DATA ----------------
    sectionTitle(doc, cursor, 'PROJECT DATA');
    row(doc, cursor, 'Project Location', site.location || '');
    row(doc, cursor, 'Plot L.R No.', site.plotNumber || '');
    row(doc, cursor, 'Built Up Area', site.builtUpArea || '');
    row(
      doc,
      cursor,
      'No. of Floors',
      site.numberOfFloors != null ? String(site.numberOfFloors) : ''
    );
    row(doc, cursor, 'Category', siteCategoryLabel(site.category));
    row(
      doc,
      cursor,
      'Commencement Date',
      site.commencementDate ? format(site.commencementDate, 'd MMMM yyyy') : ''
    );
    row(
      doc,
      cursor,
      'Expected Completion Date',
      site.expectedCompletionDate ? format(site.expectedCompletionDate, 'd MMMM yyyy') : ''
    );
    cursor.y += 3;

    // ---------------- PROJECT TEAM ----------------
    sectionTitle(doc, cursor, 'PROJECT TEAM');
    row(doc, cursor, 'Main Contractor', contractorName || '');
    for (const member of site.team) {
      row(doc, cursor, member.role, member.name);
    }
    if (site.team.length === 0) {
      plainNote(doc, cursor, 'No staff assigned to this project yet.');
    }
    cursor.y += 3;

    // ---------------- CONSTRUCTION STATUS ----------------
    sectionTitle(doc, cursor, 'CONSTRUCTION STATUS');
    const commencement = site.commencementDate;
    const completion = site.expectedCompletionDate;
    const contractPeriod =
      site.contractPeriodMonths ??
      (commencement && completion ? monthsBetween(commencement, completion) : null);
    const timeElapsed =
      commencement != null ? monthsBetween(commencement, toDay) : null;
    const elapsedCapped =
      contractPeriod != null && timeElapsed != null
        ? Math.min(timeElapsed, contractPeriod)
        : timeElapsed;
    const percentTime =
      contractPeriod && timeElapsed != null
        ? Math.round((elapsedCapped! / contractPeriod) * 100)
        : null;

    row(
      doc,
      cursor,
      'Contract period',
      contractPeriod != null ? `${contractPeriod} months` : ''
    );
    row(
      doc,
      cursor,
      'Time elapsed',
      elapsedCapped != null ? `${elapsedCapped} months` : ''
    );
    row(
      doc,
      cursor,
      '% time elapsed',
      percentTime != null ? `${percentTime}%` : ''
    );
    row(
      doc,
      cursor,
      'Overall Progress',
      site.overallProgress != null ? `${Math.round(site.overallProgress)}%` : ''
    );
    row(doc, cursor, 'Description of progress', site.progressDescription || '');
    cursor.y += 3;

    // ---------------- ACTIVITY SUMMARY ----------------
    sectionTitle(doc, cursor, 'ACTIVITY SUMMARY');
    plainNote(
      doc,
      cursor,
      'Picked from the daily activity reports of this week (each activity is accompanied by its photos).'
    );
    let activityNo = 0;
    for (const report of weekReports) {
      ensureSpace(doc, cursor, 16);
      doc.setFillColor(238, 242, 246);
      doc.rect(MARGIN, cursor.y - 4, CONTENT_W, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(format(report.reportDate, 'EEEE'), MARGIN + 2, cursor.y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(format(report.reportDate, 'd MMMM yyyy'), PAGE_W - MARGIN - 2, cursor.y, {
        align: 'right',
      });
      doc.setTextColor(0, 0, 0);
      cursor.y += 10;

      if (report.activities.length === 0) {
        plainNote(doc, cursor, 'No activities recorded for this day.');
      }
      for (const activity of report.activities) {
        activityNo += 1;
        ensureSpace(doc, cursor, 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...PRIMARY);
        doc.text(`ACTIVITY ${activityNo} – ${activity.title}`, MARGIN, cursor.y);
        doc.setTextColor(0, 0, 0);
        cursor.y += 5;
        if (activity.description) {
          const lines = doc.splitTextToSize(activity.description, CONTENT_W) as string[];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          for (const line of lines) {
            ensureSpace(doc, cursor, 5);
            doc.text(line, MARGIN, cursor.y);
            cursor.y += 4.5;
          }
          doc.setTextColor(0, 0, 0);
        }
        await drawActivityPhotos(doc, cursor, asFiles(activity.photos));
        cursor.y += 3;
      }
      cursor.y += 2;
    }

    // ---------------- Footer on every page ----------------
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text('Powered by Recon Engineering International', PAGE_W / 2, 290, {
        align: 'center',
      });
      doc.text(contractorName, MARGIN, 290);
      doc.text(`${page}`, PAGE_W - MARGIN, 290, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    const filename = `Weekly-Progress-Report-No-${reportNo}.pdf`;
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate weekly progress report PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
