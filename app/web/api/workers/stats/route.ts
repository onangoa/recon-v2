import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { getCurrentContractor } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';
import { getRecords } from '@/lib/biometric-service';
import { transformRecordsToAttendance } from '@/lib/biometric-attendance';

interface DesigStat {
  designationId: string | null;
  title: string;
  count: number;
}

function groupByDesignation(
  workerIds: string[],
  workerDesigIdMap: Map<string, string | null>,
  workerDesigTitleMap: Map<string, string>,
): DesigStat[] {
  const desigCounts = new Map<string | null, { title: string; count: number }>();
  for (const workerId of workerIds) {
    const desigId = workerDesigIdMap.get(workerId) ?? null;
    const title = workerDesigTitleMap.get(workerId) || 'Unassigned';
    if (!desigCounts.has(desigId)) desigCounts.set(desigId, { title, count: 0 });
    desigCounts.get(desigId)!.count++;
  }
  return Array.from(desigCounts.entries())
    .map(([designationId, { title, count }]) => ({ designationId, title, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'workers:read');
  if (!permCheck.authorized) return permCheck.error;

  const contractor = await getCurrentContractor();
  if (!contractor) {
    return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const contractorId = contractor.id;
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // Fetch all workers with designation info (needed for both paths)
  const allWorkers = await prisma.worker.findMany({
    where: { contractorId },
    select: {
      id: true,
      name: true,
      enrollId: true,
      designationId: true,
      designation: { select: { title: true } },
      shift: true,
    },
  });
  const workerDesigIdMap = new Map(allWorkers.map((w) => [w.id, w.designationId]));
  const workerDesigTitleMap = new Map(allWorkers.map((w) => [w.id, w.designation?.title || 'Unassigned']));

  // Try biometric path first (same logic as /web/api/attendance)
  let biometricAttendance: ReturnType<typeof transformRecordsToAttendance> | null = null;

  if (process.env.BIOMETRIC_API_BASE_URL) {
    const devices = await prisma.biometricDevice.findMany({
      where: { contractorId, isActive: true },
      select: { sn: true },
    });

    if (devices.length > 0) {
      const workersForTransform = allWorkers.map((w) => ({
        id: w.id,
        name: w.name,
        enrollId: w.enrollId,
        designation: w.designation,
        shift: (w.shift as any) || null,
      }));

      const pageSize = 500;
      const collected: Awaited<ReturnType<typeof getRecords>>['records'] = [];

      for (const device of devices) {
        let pn = 1;
        for (let i = 0; i < 5; i++) {
          try {
            const page = await getRecords(device.sn, { pn, pageSize });
            if (!page.records || page.records.length === 0) break;
            collected.push(...page.records);
            if (page.records.length < pageSize || collected.length >= page.total) break;
            pn++;
          } catch (err) {
            console.error(`Stats: failed to fetch records from device ${device.sn}:`, err);
            break;
          }
        }
      }

      biometricAttendance = transformRecordsToAttendance(collected, workersForTransform);
    }
  }

  const totalWorkers = allWorkers.length;

  const currentPeriod = await prisma.payrollPeriod.findFirst({
    where: { contractorId, startDate: { lte: today } },
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  let onSiteToday: number;
  let activeInPeriod: number;
  let byDesignation: DesigStat[];
  let byDesignationForDate: DesigStat[] | null = null;

  if (biometricAttendance) {
    // --- Biometric path ---
    const todayRecords = biometricAttendance.filter((a) => {
      const d = new Date(a.date);
      return d >= todayStart && d <= todayEnd;
    });
    onSiteToday = todayRecords.length;

    // Active = distinct workers with at least one attendance record
    const distinctWorkerIds = [...new Set(biometricAttendance.map((a) => a.worker.id))];
    activeInPeriod = distinctWorkerIds.length;

    byDesignation = groupByDesignation(distinctWorkerIds, workerDesigIdMap, workerDesigTitleMap);

    if (dateParam) {
      const date = new Date(dateParam);
      const dateStart = startOfDay(date);
      const dateEnd = endOfDay(date);
      const dayWorkerIds = [
        ...new Set(
          biometricAttendance
            .filter((a) => {
              const d = new Date(a.date);
              return d >= dateStart && d <= dateEnd;
            })
            .map((a) => a.worker.id)
        ),
      ];
      byDesignationForDate = groupByDesignation(dayWorkerIds, workerDesigIdMap, workerDesigTitleMap);
    }
  } else {
    // --- Database fallback ---
    onSiteToday = await prisma.attendance.count({
      where: {
        contractorId,
        date: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['Absent'] },
      },
    });

    const attendanceWithDesignation = await prisma.attendance.findMany({
      where: { contractorId, status: { notIn: ['Absent'] } },
      select: { workerId: true },
      distinct: ['workerId'],
    });

    activeInPeriod = attendanceWithDesignation.length;
    byDesignation = groupByDesignation(
      attendanceWithDesignation.map((r) => r.workerId),
      workerDesigIdMap,
      workerDesigTitleMap,
    );

    if (dateParam) {
      const date = new Date(dateParam);
      const dateStart = startOfDay(date);
      const dateEnd = endOfDay(date);

      const dateRecords = await prisma.attendance.findMany({
        where: {
          contractorId,
          date: { gte: dateStart, lte: dateEnd },
          status: { notIn: ['Absent'] },
        },
        select: { workerId: true },
        distinct: ['workerId'],
      });

      byDesignationForDate = groupByDesignation(
        dateRecords.map((r) => r.workerId),
        workerDesigIdMap,
        workerDesigTitleMap,
      );
    }
  }

  return NextResponse.json({
    totalWorkers,
    activeInPeriod,
    onSiteToday,
    byDesignation,
    currentPeriod,
    byDesignationForDate,
  });
}
