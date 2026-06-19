import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { getCurrentContractor } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'dashboard:read');
    if (!permCheck.authorized) return permCheck.error;

    const contractor = await getCurrentContractor();
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const where: any = { contractorId: contractor.id };
    const siteWhere: any = { contractorId: contractor.id };
    
    if (siteId) {
      where.siteId = siteId;
      siteWhere.id = siteId;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalWorkers,
      totalEquipment,
      totalInventory,
      totalPurchaseOrders,
      pendingPurchaseOrders,
      activeTasks,
      totalSites,
      recentActivityLogs,
      attendanceData,
      monthlyCredits,
      monthlyDebits
    ] = await Promise.all([
      prisma.worker.count({ where }),
      prisma.equipment.count({ where: siteId ? { siteId } : { site: { contractorId: contractor.id } } }),
      prisma.inventory.count({ where }),
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.count({ where: { ...where, status: 'pending' } }),
      prisma.task.count({ where }),
      prisma.site.count({ where: { contractorId: contractor.id } }),
      prisma.activityLog.findMany({
        where: { contractorId: contractor.id },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.attendance.groupBy({
        by: ['date'],
        where: {
          contractorId: contractor.id,
          date: {
            gte: sevenDaysAgo
          }
        },
        _sum: {
          totalHours: true,
          overtimeHours: true
        },
        _avg: {
          totalHours: true
        }
      }),
      prisma.transaction.aggregate({
        where: {
          wallet: { contractorId: contractor.id },
          type: 'credit',
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.transaction.aggregate({
        where: {
          wallet: { contractorId: contractor.id },
          type: 'debit',
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalWorkers,
        totalEquipment,
        totalInventory,
        totalPurchaseOrders,
        pendingPurchaseOrders,
        activeTasks,
        totalSites,
        monthlyCredits: monthlyCredits._sum.amount || 0,
        monthlyDebits: monthlyDebits._sum.amount || 0
      },
      recentActivityLogs,
      attendanceData: attendanceData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        totalHours: item._sum.totalHours || 0,
        overtimeHours: item._sum.overtimeHours || 0,
        avgHours: item._avg.totalHours || 0
      })),
      siteId
    });
  } catch (error) {
    console.error('Contractor dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}