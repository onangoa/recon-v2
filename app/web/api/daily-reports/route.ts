import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, endOfDay, subDays, format, isBefore, isAfter } from 'date-fns';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

// ---------------------------------------------------------------------------
// Daily Site Progress & Next-Day Planning Report API
// (see flutter/NEW PROPOSAL.docx for the report template)
//
// GET  ?siteId=&date=            -> single-day payload: { report, meta }
// GET  ?siteId=&from=&to=        -> merged range payload: { reports }
// GET  ?siteId=&page=&limit=     -> paginated list (report summaries)
// POST                             -> create a report for a site + day
// ---------------------------------------------------------------------------

const VERDICTS = ['achieved', 'partially_achieved', 'not_achieved'];
// The form lets the user add as many activities / next-day targets as the
// day needs - these caps are only defensive payload limits.
const MAX_ACTIVITIES = 50;
const MAX_TARGETS = 50;
const MAX_PHOTOS = 2;

type WorkforceEntry = { category: string; count: number };
type FileEntry = { url: string; name?: string };

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

/** Parse a YYYY-MM-DD string as local-midnight so day grouping is stable. */
function parseDay(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
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

const FULL_INCLUDE = {
  activities: { orderBy: { position: 'asc' as const } },
  targets: { orderBy: { position: 'asc' as const } },
  deliveries: { orderBy: { position: 'asc' as const } },
  materials: { orderBy: { position: 'asc' as const } },
  site: {
    select: {
      id: true,
      name: true,
      location: true,
      contractor: { select: { companyName: true, logo: true } },
    },
  },
};

/**
 * Form/print meta for a given day: labour categories (designations), total
 * workforce on site from attendance records (grouped per category), the
 * previous day's targets (activity title dropdown + planned workforce
 * source), the day's visitors, safety incidents and material deliveries.
 */
async function buildDayMeta(contractorId: string, siteId: string, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const prevDay = subDays(day, 1);

  const [designations, attendance, visitors, incidents, deliveries, prevReport] =
    await Promise.all([
      prisma.designation.findMany({
        where: { contractorId, isActive: true },
        orderBy: { title: 'asc' },
        select: { id: true, title: true, salary: true },
      }),
      prisma.attendance.findMany({
        where: {
          contractorId,
          worker: { siteId },
          date: { gte: dayStart, lte: dayEnd },
          status: 'Present',
        },
        select: { worker: { select: { designation: { select: { title: true } } } } },
      }),
      prisma.visitor.findMany({
        where: { siteId, checkInTime: { gte: dayStart, lte: dayEnd } },
        orderBy: { checkInTime: 'asc' },
      }),
      prisma.safetyIncident.findMany({
        where: { siteId, incidentDate: { gte: dayStart, lte: dayEnd } },
        orderBy: { incidentDate: 'asc' },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          siteId,
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
        where: { siteId, reportDate: prevDay },
        include: { targets: { orderBy: { position: 'asc' as const } } },
      }),
    ]);

  const workforceMap = new Map<string, number>();
  for (const record of attendance) {
    const category = record.worker?.designation?.title || 'Uncategorised';
    workforceMap.set(category, (workforceMap.get(category) || 0) + 1);
  }

  return {
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
          workforce: normalizeWorkforce(t.workforce),
          remarks: t.remarks,
        }))
      : [],
  };
}

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'reports:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }
    const owns = await verifySiteOwnership(contractorId, siteId);
    if (!owns) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // ---- Single day: full report (or null) + form meta ----
    if (date) {
      const day = parseDay(date);
      if (!day) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      }
      const [report, meta] = await Promise.all([
        prisma.dailyReport.findUnique({
          where: { siteId_reportDate: { siteId, reportDate: day } },
          include: FULL_INCLUDE,
        }),
        buildDayMeta(contractorId, siteId, day),
      ]);
      return NextResponse.json({ report, meta });
    }

    // ---- Merged range (printing one day, a week or several weeks) ----
    if (from && to) {
      const fromDay = parseDay(from);
      const toDay = parseDay(to);
      if (!fromDay || !toDay || isAfter(fromDay, toDay)) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
      }
      const reports = await prisma.dailyReport.findMany({
        where: { siteId, reportDate: { gte: fromDay, lte: toDay } },
        orderBy: { reportDate: 'asc' },
        include: FULL_INCLUDE,
      });
      if (reports.length === 0) {
        return NextResponse.json({ reports: [] });
      }

      const rangeStart = startOfDay(fromDay);
      const rangeEnd = endOfDay(toDay);
      const [attendance, visitors, incidents, deliveries] = await Promise.all([
        prisma.attendance.findMany({
          where: {
            contractorId,
            worker: { siteId },
            date: { gte: rangeStart, lte: rangeEnd },
            status: 'Present',
          },
          select: {
            date: true,
            worker: { select: { designation: { select: { title: true } } } },
          },
        }),
        prisma.visitor.findMany({
          where: { siteId, checkInTime: { gte: rangeStart, lte: rangeEnd } },
          orderBy: { checkInTime: 'asc' },
        }),
        prisma.safetyIncident.findMany({
          where: { siteId, incidentDate: { gte: rangeStart, lte: rangeEnd } },
          orderBy: { incidentDate: 'asc' },
        }),
        prisma.purchaseOrder.findMany({
          where: {
            siteId,
            status: { in: ['delivered', 'partially_received'] },
            OR: [
              { receivedInFullDate: { gte: rangeStart, lte: rangeEnd } },
              { partiallyReceivedDate: { gte: rangeStart, lte: rangeEnd } },
            ],
          },
          include: {
            supplier: { select: { name: true } },
            items: { select: { description: true, quantity: true, receivedQuantity: true } },
          },
        }),
      ]);

      const workforceByDay = new Map<string, Map<string, number>>();
      for (const record of attendance) {
        const key = format(record.date, 'yyyy-MM-dd');
        const category = record.worker?.designation?.title || 'Uncategorised';
        let dayMap = workforceByDay.get(key);
        if (!dayMap) {
          dayMap = new Map<string, number>();
          workforceByDay.set(key, dayMap);
        }
        dayMap.set(category, (dayMap.get(category) || 0) + 1);
      }

      const groupVisitors = new Map<string, any[]>();
      for (const visitor of visitors) {
        const key = format(visitor.checkInTime, 'yyyy-MM-dd');
        const list = groupVisitors.get(key) || [];
        list.push(visitor);
        groupVisitors.set(key, list);
      }
      const groupIncidents = new Map<string, any[]>();
      for (const incident of incidents) {
        const key = format(incident.incidentDate, 'yyyy-MM-dd');
        const list = groupIncidents.get(key) || [];
        list.push(incident);
        groupIncidents.set(key, list);
      }
      const groupDeliveries = new Map<string, any[]>();
      for (const po of deliveries) {
        const deliveredAt = po.receivedInFullDate || po.partiallyReceivedDate;
        if (!deliveredAt || isBefore(deliveredAt, rangeStart) || isAfter(deliveredAt, rangeEnd)) {
          continue;
        }
        const key = format(deliveredAt, 'yyyy-MM-dd');
        const list = groupDeliveries.get(key) || [];
        list.push({
          id: po.id,
          orderNumber: po.orderNumber,
          supplier: po.supplier.name,
          status: po.status,
          deliveredAt,
          items: po.items.map((item) => ({
            description: item.description,
            quantity: item.receivedQuantity || item.quantity,
          })),
        });
        groupDeliveries.set(key, list);
      }

      return NextResponse.json({
        reports: reports.map((report) => {
          const key = format(report.reportDate, 'yyyy-MM-dd');
          const dayMap = workforceByDay.get(key) || new Map<string, number>();
          return {
            ...report,
            dayWorkforce: Array.from(dayMap.entries()).map(([category, count]) => ({
              category,
              count,
            })),
            dayVisitors: groupVisitors.get(key) || [],
            dayIncidents: groupIncidents.get(key) || [],
            dayDeliveries: groupDeliveries.get(key) || [],
          };
        }),
      });
    }

    // ---- Paginated list (report summaries) ----
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get('limit') || '31', 10) || 31)
    );
    const skip = (page - 1) * limit;

    const where: any = { siteId };
    const listFrom = searchParams.get('listFrom');
    const listTo = searchParams.get('listTo');
    if (listFrom && listTo) {
      const fromDay = parseDay(listFrom);
      const toDay = parseDay(listTo);
      if (fromDay && toDay && !isAfter(fromDay, toDay)) {
        where.reportDate = { gte: fromDay, lte: toDay };
      }
    }

    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit,
        include: {
          activities: {
            orderBy: { position: 'asc' as const },
            select: { title: true, verdict: true, labourCost: true },
          },
          targets: { select: { title: true } },
          _count: { select: { deliveries: true, materials: true } },
        },
      }),
      prisma.dailyReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { total, pages: Math.ceil(total / limit), page, limit },
    });
  } catch (error) {
    console.error('Failed to fetch daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'reports:create');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();
    const { siteId, reportDate, status, uploads, activities, targets, deliveries, materials } =
      body || {};

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }
    const owns = await verifySiteOwnership(contractorId, siteId);
    if (!owns) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const day = parseDay(reportDate);
    if (!day) {
      return NextResponse.json(
        { error: 'A valid report date (YYYY-MM-DD) is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.dailyReport.findUnique({
      where: { siteId_reportDate: { siteId, reportDate: day } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: 'A report already exists for this date',
          existingId: existing.id,
        },
        { status: 409 }
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
      }));

    const materialRows = asArray(materials)
      .filter((m) => m && typeof m === 'object' && String(m.item || '').trim())
      .map((m, index) => ({
        position: index + 1,
        item: String(m.item).trim(),
        quantity: Number(m.quantity) || 0,
        unit: m.unit ? String(m.unit).trim() : null,
        notes: m.notes ? String(m.notes).trim() : null,
      }));

    const report = await prisma.dailyReport.create({
      data: {
        siteId,
        reportDate: day,
        status: status === 'Submitted' ? 'Submitted' : 'Draft',
        uploads: normalizeFiles(uploads, 5) as any,
        createdBy: permCheck.userId,
        activities: { create: activityRows },
        targets: { create: targetRows },
        deliveries: { create: deliveryRows },
        materials: { create: materialRows },
      },
      include: FULL_INCLUDE,
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'REPORTS',
      description: `Created daily site report for ${format(day, 'PPP')}`,
      targetId: report.id,
      details: {
        reportDate: format(day, 'yyyy-MM-dd'),
        status: report.status,
        activities: activityRows.length,
        targets: targetRows.length,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to create daily report:', error);
    return NextResponse.json({ error: 'Failed to create daily report' }, { status: 500 });
  }
}
