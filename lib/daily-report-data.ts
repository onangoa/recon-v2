import { prisma } from './prisma';
import { format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

// Shared relation include for a full DailyReport payload. Used by the CRUD
// routes and the PDF export route.
export const DAILY_REPORT_FULL_INCLUDE = {
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
 * Full daily reports for a date range (ascending), each enriched with the
 * day's context pulled from live records: workforce on site (attendance
 * grouped per labour category), visitors, safety incidents and received
 * purchase orders. Shared by the merged JSON range endpoint and the PDF
 * export so both always render the same data.
 */
export async function getRangeReports(siteId: string, fromDay: Date, toDay: Date) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { contractorId: true },
  });
  if (!site) {
    return [];
  }
  const contractorId = site.contractorId;

  const reports = await prisma.dailyReport.findMany({
    where: { siteId, reportDate: { gte: fromDay, lte: toDay } },
    orderBy: { reportDate: 'asc' },
    include: DAILY_REPORT_FULL_INCLUDE,
  });
  if (reports.length === 0) {
    return [];
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

  return reports.map((report) => {
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
  });
}
