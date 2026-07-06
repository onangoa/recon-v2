import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'dashboard:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const contractorSites = await prisma.site.findMany({
      where: { contractorId },
      select: { id: true },
    });
    const contractorSiteIds = contractorSites.map(s => s.id);

    if (siteId && !contractorSiteIds.includes(siteId)) {
      return mobileError('Site not found', 404);
    }

    const targetSiteIds = siteId ? [siteId] : contractorSiteIds;
    const siteFilter: any = { siteId: { in: targetSiteIds } };
    const contractorFilter: any = { contractorId };
    const combinedFilter: any = { ...contractorFilter, ...siteFilter };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalWorkers,
      workersPresentToday,
      totalEquipment,
      totalInventory,
      totalPurchaseOrders,
      pendingPurchaseOrders,
      activeTasks,
      totalSites,
      safetyIncidents,
      recentActivityLogs,
      attendanceData,
      monthlyCredits,
      monthlyDebits,
      poSummary,
      inventoryByStatus,
      walletBalance,
    ] = await Promise.all([
      prisma.worker.count({ where: contractorFilter }),
      prisma.attendance.count({
        where: {
          ...contractorFilter,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { notIn: ['Absent'] },
        },
      }),
      prisma.equipment.count({ where: siteFilter }),
      prisma.inventory.count({ where: { ...contractorFilter, ...siteFilter } }),
      prisma.purchaseOrder.count({ where: siteFilter }),
      prisma.purchaseOrder.count({ where: { ...siteFilter, status: 'pending' } }),
      prisma.task.count({ where: { ...siteFilter, status: 'in-progress' } }),
      contractorSiteIds.length,
      prisma.safetyIncident.count({ where: { siteId: { in: targetSiteIds } } }),
      prisma.activityLog.findMany({
        where: { contractorId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.attendance.groupBy({
        by: ['date'],
        where: { ...contractorFilter, date: { gte: sevenDaysAgo } },
        _sum: { totalHours: true, overtimeHours: true },
        _avg: { totalHours: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { wallet: { contractorId }, type: 'credit', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { wallet: { contractorId }, type: 'debit', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: siteFilter,
        _count: true,
        _sum: { total: true },
      }),
      prisma.inventory.groupBy({
        by: ['status'],
        where: { ...contractorFilter, ...siteFilter },
        _count: true,
      }),
      prisma.wallet.aggregate({
        where: { contractorId },
        _sum: { balance: true },
      }),
    ]);

    return mobileSuccess({
      stats: {
        totalWorkers,
        workersPresentToday,
        totalEquipment,
        totalInventory,
        totalPurchaseOrders,
        pendingPurchaseOrders,
        activeTasks,
        totalSites,
        safetyIncidents,
        monthlyCredits: monthlyCredits._sum.amount || 0,
        monthlyDebits: monthlyDebits._sum.amount || 0,
        walletBalance: walletBalance._sum.balance || 0,
      },
      recentActivityLogs,
      attendanceData: attendanceData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        totalHours: item._sum.totalHours || 0,
        overtimeHours: item._sum.overtimeHours || 0,
        avgHours: item._avg.totalHours || 0,
        workersPresent: item._count,
      })),
      poSummary: poSummary.map(po => ({
        status: po.status,
        count: po._count,
        totalValue: po._sum.total || 0,
      })),
      inventoryByStatus: inventoryByStatus.map(inv => ({
        status: inv.status,
        count: inv._count,
      })),
      siteId,
    });
  } catch (error) {
    console.error('Contractor dashboard API error:', error);
    return mobileError('Failed to fetch dashboard data', 500);
  }
}
