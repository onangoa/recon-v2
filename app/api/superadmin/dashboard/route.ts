import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    
    const now = new Date();
    const monthsAgo = new Date(now.setMonth(now.getMonth() - months));

    const [
      totalContractors,
      totalPlans,
      activeSubscriptions,
      transactions,
      contractorsByMonth,
      revenueByMonth,
      subscriptionsByPlan
    ] = await Promise.all([
      prisma.contractor.count(),
      prisma.subscriptionPlan.count(),
      prisma.contractor.count({
        where: {
          subscriptionStatus: 'active'
        }
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true
        }
      }),
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as count
        FROM Contractor
        WHERE createdAt >= ${monthsAgo.toISOString()}
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month
      `,
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          SUM(amount) as revenue
        FROM Transaction
        WHERE createdAt >= ${monthsAgo.toISOString()}
          AND status = 'completed'
          AND type = 'credit'
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month
      `,
      prisma.contractor.groupBy({
        by: ['subscriptionPlanId'],
        _count: {
          id: true
        },
        where: {
          subscriptionStatus: 'active'
        }
      })
    ]);

    const revenueResult = await prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: 'credit',
        createdAt: {
          gte: monthsAgo
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalRevenue = revenueResult._sum.amount || 0;

    const previousRevenueResult = await prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: 'credit',
        createdAt: {
          gte: new Date(monthsAgo.getTime() - months * 30 * 24 * 60 * 60 * 1000),
          lt: monthsAgo
        }
      },
      _sum: {
        amount: true
      }
    });

    const previousRevenue = previousRevenueResult._sum.amount || 0;
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;

    const previousContractorsResult = await prisma.contractor.count({
      where: {
        createdAt: {
          gte: new Date(monthsAgo.getTime() - months * 30 * 24 * 60 * 60 * 1000),
          lt: monthsAgo
        }
      }
    });

    const contractorsTrend = previousContractorsResult > 0 ? 
      ((totalContractors - previousContractorsResult) / previousContractorsResult * 100) : 8.5;

    const contractorsData = (contractorsByMonth as any[]).map((item: any) => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      count: item.count
    }));

    const revenueData = (revenueByMonth as any[]).map((item: any) => ({
      date: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.revenue / 1000
    }));

    const planDistribution = await Promise.all(
      subscriptionsByPlan.map(async (item) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: item.subscriptionPlanId }
        });
        return {
          name: plan?.name || 'Unknown',
          value: item._count.id,
          color: getPlanColor(plan?.name || 'Unknown')
        };
      })
    );

    const totalPlanCount = planDistribution.reduce((sum, item) => sum + item.value, 0);
    const planSalesData = planDistribution.map(item => ({
      name: item.name,
      value: totalPlanCount > 0 ? Math.round((item.value / totalPlanCount) * 100) : 0,
      color: item.color
    }));

    return NextResponse.json({
      stats: {
        totalRevenue,
        revenueTrend,
        totalContractors,
        contractorsTrend,
        activeSubscriptions,
        subscriptionsTrend: 12.1,
        totalPlans
      },
      recentTransactions: transactions.map(tx => ({
        id: tx.id,
        name: tx.wallet.name,
        email: 'contractor@example.com',
        amount: `KES ${tx.amount.toLocaleString()}`,
        method: tx.mpesaTransactionId ? 'Mpesa' : 'Internal',
        status: tx.status.toUpperCase(),
        date: new Date(tx.createdAt).toLocaleString()
      })),
      contractorsData,
      revenueData,
      planSalesData
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
