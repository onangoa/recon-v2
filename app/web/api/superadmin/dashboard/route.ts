import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');

    const now = new Date();
    const monthsAgo = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);

    const [
      totalContractors,
      totalPlans,
      activeSubscriptions,
      totalWorkers,
      totalSites,
      transactions,
      subscriptionsByPlan,
    ] = await Promise.all([
      prisma.contractor.count(),
      prisma.subscriptionPlan.count(),
      prisma.contractor.count({
        where: { subscriptionStatus: 'active' },
      }),
      prisma.worker.count(),
      prisma.site.count(),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { wallet: { select: { name: true, contractor: { select: { companyName: true } } } } },
      }),
      prisma.contractor.groupBy({
        by: ['subscriptionPlanId'],
        _count: { id: true },
        where: { subscriptionStatus: 'active' },
      }),
    ]);

    const revenueResult = await prisma.transaction.aggregate({
      where: { status: 'completed', type: 'credit', createdAt: { gte: monthsAgo } },
      _sum: { amount: true },
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    const previousRevenueResult = await prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: 'credit',
        createdAt: {
          gte: new Date(monthsAgo.getTime() - months * 30 * 24 * 60 * 60 * 1000),
          lt: monthsAgo,
        },
      },
      _sum: { amount: true },
    });
    const previousRevenue = previousRevenueResult._sum.amount || 0;
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;

    const previousContractorsResult = await prisma.contractor.count({
      where: {
        createdAt: {
          gte: new Date(monthsAgo.getTime() - months * 30 * 24 * 60 * 60 * 1000),
          lt: monthsAgo,
        },
      },
    });
    const contractorsTrend = previousContractorsResult > 0
      ? ((totalContractors - previousContractorsResult) / previousContractorsResult * 100)
      : 0;

    const planDistribution = await Promise.all(
      subscriptionsByPlan.map(async (item) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: item.subscriptionPlanId },
        });
        return {
          name: plan?.name || 'Unknown',
          value: item._count.id,
          color: getPlanColor(plan?.name || 'Unknown'),
        };
      })
    );

    const totalPlanCount = planDistribution.reduce((sum, item) => sum + item.value, 0);
    const planSalesData = planDistribution.map(item => ({
      name: item.name,
      value: totalPlanCount > 0 ? Math.round((item.value / totalPlanCount) * 100) : 0,
      color: item.color,
    }));

    return NextResponse.json({
      stats: {
        totalRevenue,
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        totalContractors,
        contractorsTrend: Math.round(contractorsTrend * 10) / 10,
        activeSubscriptions,
        subscriptionsTrend: 12.1,
        totalPlans,
        totalWorkers,
        totalSites,
      },
      recentTransactions: transactions.map(tx => ({
        id: tx.id,
        name: tx.wallet?.contractor?.companyName || tx.wallet?.name || 'Unknown',
        amount: `KES ${Number(tx.amount).toLocaleString()}`,
        method: tx.mpesaTransactionId ? 'M-Pesa' : 'Internal',
        status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase(),
        date: new Date(tx.createdAt).toLocaleDateString(),
      })),
      planSalesData,
    });
  } catch (error) {
    console.error('Superadmin dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

function getPlanColor(planName: string): string {
  const name = planName.toLowerCase();
  if (name.includes('basic')) return '#10b981';
  if (name.includes('professional') || name.includes('pro')) return '#3b82f6';
  if (name.includes('enterprise')) return '#8b5cf6';
  return '#f59e0b';
}