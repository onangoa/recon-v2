import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'reports:read');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const contractorSites = await prisma.site.findMany({
      where: { contractorId },
      select: { id: true },
    });
    const contractorSiteIds = contractorSites.map(s => s.id);

    if (siteId && !contractorSiteIds.includes(siteId)) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const targetSiteIds = siteId ? [siteId] : contractorSiteIds;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const siteWhere = { siteId: { in: targetSiteIds }, ...dateFilter };

    const [
      totalWorkers,
      activeWorkers,
      totalSites,
      totalInventory,
      totalEquipment,
      totalPurchaseOrders,
      pendingPurchaseOrders,
      totalPayrollPeriods,
      totalSafetyIncidents,
      recentTransactions,
      payrollSummary,
      inventorySummary,
      attendanceSummary,
      purchaseOrderSummary,
      walletSummary,
    ] = await Promise.all([
      prisma.worker.count({ where: { contractorId } }),
      prisma.worker.count({ where: { contractorId, status: 'Active' } }),
      contractorSites.length,
      prisma.inventory.count({ where: siteWhere }),
      prisma.equipment.count({ where: siteWhere }),
      prisma.purchaseOrder.count({ where: siteWhere }),
      prisma.purchaseOrder.count({ where: { ...siteWhere, status: 'pending' } }),
      prisma.payrollPeriod.count({ where: { contractorId } }),
      prisma.safetyIncident.count({ where: { siteId: { in: targetSiteIds } } }),
      prisma.transaction.findMany({
        where: { wallet: { contractorId }, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { wallet: { select: { name: true } } },
      }),
      prisma.payrollPeriod.aggregate({
        where: { contractorId, ...dateFilter },
        _sum: { totalGrossPay: true, totalNetPay: true, totalDeductions: true },
        _count: true,
      }),
      prisma.inventory.groupBy({
        by: ['status'],
        where: siteWhere,
        _count: true,
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { contractorId, ...dateFilter },
        _count: true,
      }),
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: siteWhere,
        _count: true,
        _sum: { total: true },
      }),
      prisma.wallet.aggregate({
        where: { contractorId },
        _sum: { balance: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalWorkers,
        activeWorkers,
        totalSites,
        totalInventory,
        totalEquipment,
        totalPurchaseOrders,
        pendingPurchaseOrders,
        totalPayrollPeriods,
        totalSafetyIncidents,
      },
      payroll: {
        totalGrossPay: payrollSummary._sum.totalGrossPay || 0,
        totalNetPay: payrollSummary._sum.totalNetPay || 0,
        totalDeductions: payrollSummary._sum.totalDeductions || 0,
        periodCount: payrollSummary._count,
      },
      inventoryByStatus: inventorySummary.map(s => ({
        status: s.status,
        count: s._count,
      })),
      attendanceByStatus: attendanceSummary.map(a => ({
        status: a.status,
        count: a._count,
      })),
      purchaseOrdersByStatus: purchaseOrderSummary.map(po => ({
        status: po.status,
        count: po._count,
        totalValue: po._sum.total || 0,
      })),
      wallet: {
        totalBalance: walletSummary._sum.balance || 0,
        walletCount: walletSummary._count,
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        walletName: t.wallet.name,
      })),
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}