import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { getCurrentContractor } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

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

  const [
    totalWorkers,
    onSiteToday,
    currentPeriod,
    attendanceWithDesignation,
  ] = await Promise.all([
    prisma.worker.count({ where: { contractorId } }),
    prisma.attendance.count({
      where: {
        contractorId,
        date: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['Absent'] },
      },
    }),
    prisma.payrollPeriod.findFirst({
      where: { contractorId, startDate: { lte: today } },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    // Fetch all attendance records (non-Absent) with worker designation for attendance-based stats
    prisma.attendance.findMany({
      where: {
        contractorId,
        status: { notIn: ['Absent'] },
      },
      select: {
        workerId: true,
        worker: {
          select: {
            designationId: true,
            designation: { select: { title: true } },
          },
        },
      },
      distinct: ['workerId'],
    }),
  ]);

  // "Active" = distinct workers with at least one attendance record
  const activeInPeriod = attendanceWithDesignation.length;

  // "Workers per Category" (Total view) = attendance-based: distinct workers grouped by designation
  const desigCounts = new Map<string | null, { title: string; count: number }>();
  for (const r of attendanceWithDesignation) {
    const desigId = r.worker.designationId;
    const title = r.worker.designation?.title || 'Unassigned';
    if (!desigCounts.has(desigId)) {
      desigCounts.set(desigId, { title, count: 0 });
    }
    desigCounts.get(desigId)!.count++;
  }
  const byDesignation = Array.from(desigCounts.entries())
    .map(([designationId, { title, count }]) => ({
      designationId,
      title,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  let byDesignationForDate: Array<{
    designationId: string | null;
    title: string;
    count: number;
  }> | null = null;

  if (dateParam) {
    const date = new Date(dateParam);
    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        contractorId,
        date: { gte: dateStart, lte: dateEnd },
        status: { notIn: ['Absent'] },
      },
      include: {
        worker: {
          select: {
            designationId: true,
            designation: { select: { title: true } },
          },
        },
      },
    });

    const desigCounts = new Map<string | null, { title: string; count: number }>();
    for (const r of attendanceRecords) {
      const desigId = r.worker.designationId;
      const title = r.worker.designation?.title || 'Unassigned';
      if (!desigCounts.has(desigId)) {
        desigCounts.set(desigId, { title, count: 0 });
      }
      desigCounts.get(desigId)!.count++;
    }
    byDesignationForDate = Array.from(desigCounts.entries())
      .map(([designationId, { title, count }]) => ({
        designationId,
        title,
        count,
      }))
      .sort((a, b) => b.count - a.count);
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
