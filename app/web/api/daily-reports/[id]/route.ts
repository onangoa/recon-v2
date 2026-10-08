import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { requireContractorPermission } from '@/lib/require-permission';
import { DAILY_REPORT_FULL_INCLUDE } from '@/lib/daily-report-data';
import { isTitleWithinCharLimit, MAX_TITLE_CHARS } from '@/lib/daily-report';

// ---------------------------------------------------------------------------
// Single Daily Site Progress & Next-Day Planning Report API
//
// GET    -> { report, meta } (full report + form/print meta for its day)
// PUT    -> replace the report sections (activities, targets, materials...)
// DELETE -> remove the report (children cascade)
// ---------------------------------------------------------------------------

const VERDICTS = ['achieved', 'partially_achieved', 'not_achieved'];
// The form lets the user add as many activities / next-day targets as the
// day needs - these caps are only defensive payload limits.
const MAX_ACTIVITIES = 50;
const MAX_TARGETS = 50;
const MAX_PHOTOS = 2;
// One image per deliveries / materials line item.
const MAX_ROW_FILES = 1;

type WorkforceEntry = { category: string; count: number };
type FileEntry = { url: string; name?: string };

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeWorkforce(value: unknown): WorkforceEntry[] {
  return asArray(value)
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      category: String(e.category || '').trim(),
      count: Math.max(0, Math.round(Number(e.count) || 0)),
    }))
    .filter((e) => e.category !== '');
}

function normalizeFiles(value: unknown, max: number): FileEntry[] {
  return asArray(value)
    .filter((e) => e && typeof e === 'object' && typeof e.url === 'string' && e.url)
    .slice(0, max)
    .map((e) => ({ url: e.url, name: typeof e.name === 'string' ? e.name : undefined }));
}

async function getOwnReport(contractorId: string, id: string) {
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: { site: { select: { contractorId: true } } },
  });
  if (!report || report.site.contractorId !== contractorId) return null;
  return report;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'reports:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const report = await getOwnReport(contractorId, id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch the full report with relations, then the day meta for its date.
    const dayStart = startOfDay(report.reportDate);
    const dayEnd = endOfDay(report.reportDate);
    const [fullReport, designations, attendance, visitors, incidents, deliveries, prevReport] =
      await Promise.all([
        prisma.dailyReport.findUnique({ where: { id }, include: DAILY_REPORT_FULL_INCLUDE }),
        prisma.designation.findMany({
          where: { contractorId, isActive: true },
          orderBy: { title: 'asc' },
          select: { id: true, title: true, salary: true },
        }),
        prisma.attendance.findMany({
          where: {
            contractorId,
            worker: { siteId: report.siteId },
            date: { gte: dayStart, lte: dayEnd },
            status: 'Present',
          },
          select: { worker: { select: { designation: { select: { title: true } } } } },
        }),
        prisma.visitor.findMany({
          where: {
            siteId: report.siteId,
            checkInTime: { gte: dayStart, lte: dayEnd },
          },
          orderBy: { checkInTime: 'asc' },
        }),
        prisma.safetyIncident.findMany({
          where: {
            siteId: report.siteId,
            incidentDate: { gte: dayStart, lte: dayEnd },
          },
          orderBy: { incidentDate: 'asc' },
        }),
        prisma.purchaseOrder.findMany({
          where: {
            siteId: report.siteId,
            status: { in: ['delivered', 'partially_received'] },
            OR: [
              { receivedInFullDate: { gte: dayStart, lte: dayEnd } },
              { partiallyReceivedDate: { gte: dayStart, lte: dayEnd } },
            ],
          },
          include: {
            supplier: { select: { name: true } },
            items: { select: { description: true, quantity: true, receivedQuantity: true } },
          },
        }),
        prisma.dailyReport.findFirst({
          where: { siteId: report.siteId, reportDate: subDays(report.reportDate, 1) },
          include: { targets: { orderBy: { position: 'asc' as const } } },
        }),
      ]);

    if (!fullReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const workforceMap = new Map<string, number>();
    for (const record of attendance) {
      const category = record.worker?.designation?.title || 'Uncategorised';
      workforceMap.set(category, (workforceMap.get(category) || 0) + 1);
    }

    return NextResponse.json({
      report: fullReport,
      meta: {
        designations,
        workforce: Array.from(workforceMap.entries()).map(([category, count]) => ({
          category,
          count,
        })),
        visitors,
        incidents,
        deliveries: deliveries.map((po) => ({
          id: po.id,
          orderNumber: po.orderNumber,
          supplier: po.supplier.name,
          status: po.status,
          deliveredAt: po.receivedInFullDate || po.partiallyReceivedDate,
          items: po.items.map((item) => ({
            description: item.description,
            quantity: item.receivedQuantity || item.quantity,
          })),
        })),
        prevDayTargets: prevReport
          ? prevReport.targets.map((t) => ({
              id: t.id,
              position: t.position,
              title: t.title,
              description: t.description,
              workforce: Array.isArray(t.workforce) ? (t.workforce as any[]) : [],
              remarks: t.remarks,
            }))
          : [],
      },
    });
  } catch (error) {
    console.error('Failed to fetch daily report:', error);
    return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'reports:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await getOwnReport(contractorId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, uploads, activities, targets, deliveries, materials } = body || {};

    const invalidTitle = [
      ...asArray(activities).map((a) => a?.title),
      ...asArray(targets).map((t) => t?.title),
    ].find(
      (title) =>
        typeof title === 'string' &&
        title.trim() !== '' &&
        !isTitleWithinCharLimit(title)
    );
    if (invalidTitle) {
      return NextResponse.json(
        {
          error: `Activity titles must be ${MAX_TITLE_CHARS} characters or fewer: "${invalidTitle}"`,
        },
        { status: 400 }
      );
    }

    // Labour rates come from the contractor's designations so the cost
    // implication is always derived server-side (never editable).
    const designations = await prisma.designation.findMany({
      where: { contractorId, isActive: true },
      select: { title: true, salary: true },
    });
    const rateByCategory = new Map<string, number>(
      designations.map((d) => [d.title.trim().toLowerCase(), d.salary || 0])
    );
    const computeLabourCost = (workforce: WorkforceEntry[]) =>
      workforce.reduce(
        (sum, entry) =>
          sum + entry.count * (rateByCategory.get(entry.category.trim().toLowerCase()) || 0),
        0
      );

    const activityRows = asArray(activities)
      .filter((a) => a && typeof a === 'object' && String(a.title || '').trim())
      .slice(0, MAX_ACTIVITIES)
      .map((a, index) => {
        const actual = normalizeWorkforce(a.actualWorkforce);
        return {
          position: index + 1,
          title: String(a.title).trim().slice(0, 60),
          description: a.description ? String(a.description).trim() : null,
          plannedWorkforce: normalizeWorkforce(a.plannedWorkforce) as any,
          actualWorkforce: actual as any,
          labourCost: computeLabourCost(actual),
          verdict: VERDICTS.includes(a.verdict) ? a.verdict : null,
          remarks: a.remarks ? String(a.remarks).trim() : null,
          photos: normalizeFiles(a.photos, MAX_PHOTOS) as any,
        };
      });

    const targetRows = asArray(targets)
      .filter((t) => t && typeof t === 'object' && String(t.title || '').trim())
      .slice(0, MAX_TARGETS)
      .map((t, index) => ({
        position: index + 1,
        title: String(t.title).trim().slice(0, 60),
        description: t.description ? String(t.description).trim() : null,
        workforce: normalizeWorkforce(t.workforce) as any,
        remarks: t.remarks ? String(t.remarks).trim() : null,
        uploads: normalizeFiles(t.uploads, MAX_PHOTOS) as any,
      }));

    const deliveryRows = asArray(deliveries)
      .filter((d) => d && typeof d === 'object' && String(d.item || '').trim())
      .map((d, index) => ({
        position: index + 1,
        item: String(d.item).trim(),
        quantity: Number(d.quantity) || 0,
        unit: d.unit ? String(d.unit).trim() : null,
        supplier: d.supplier ? String(d.supplier).trim() : null,
        notes: d.notes ? String(d.notes).trim() : null,
        photos: normalizeFiles(d.photos, MAX_ROW_FILES) as any,
      }));

    const materialRows = asArray(materials)
      .filter((m) => m && typeof m === 'object' && String(m.item || '').trim())
      .map((m, index) => ({
        position: index + 1,
        item: String(m.item).trim(),
        quantity: Number(m.quantity) || 0,
        unit: m.unit ? String(m.unit).trim() : null,
        notes: m.notes ? String(m.notes).trim() : null,
        photos: normalizeFiles(m.photos, MAX_ROW_FILES) as any,
      }));

    const report = await prisma.dailyReport.update({
      where: { id },
      data: {
        status: status === 'Submitted' ? 'Submitted' : 'Draft',
        uploads: normalizeFiles(uploads, 5) as any,
        activities: { deleteMany: {}, create: activityRows },
        targets: { deleteMany: {}, create: targetRows },
        deliveries: { deleteMany: {}, create: deliveryRows },
        materials: { deleteMany: {}, create: materialRows },
      },
      include: DAILY_REPORT_FULL_INCLUDE,
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'UPDATE',
      module: 'REPORTS',
      description: `Updated daily site report for ${format(report.reportDate, 'PPP')}`,
      targetId: report.id,
      details: {
        reportDate: format(report.reportDate, 'yyyy-MM-dd'),
        status: report.status,
        activities: activityRows.length,
        targets: targetRows.length,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to update daily report:', error);
    return NextResponse.json({ error: 'Failed to update daily report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'reports:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await getOwnReport(contractorId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await prisma.dailyReport.delete({ where: { id } });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'DELETE',
      module: 'REPORTS',
      description: `Deleted daily site report for ${format(existing.reportDate, 'PPP')}`,
      targetId: existing.id,
      details: { reportDate: format(existing.reportDate, 'yyyy-MM-dd') },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete daily report:', error);
    return NextResponse.json({ error: 'Failed to delete daily report' }, { status: 500 });
  }
}
