import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const [
      totalContractors,
      totalPlans,
      activeSubscriptions,
      transactions,
    ] = await Promise.all([
      prisma.contractor.count(),
      prisma.subscriptionPlan.count(),
      prisma.contractor.count({
        where: {
          subscriptionPlan: {
            price: { gt: 0 }
          }
        }
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true
        }
      })
    ]);

    // Calculate total revenue from completed transactions
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: 'credit', // Assuming credits to platform wallets are revenue
        description: { contains: 'Subscription' } // Filtering for subscription revenue
      },
      _sum: {
        amount: true
      }
    });

    const totalRevenue = revenueResult._sum.amount || 0;

    return NextResponse.json({
      stats: {
        totalRevenue,
        revenueTrend: 15.2, // Placeholder trend
        totalContractors,
        contractorsTrend: 8.5, // Placeholder trend
        activeSubscriptions,
        subscriptionsTrend: 12.1, // Placeholder trend
        totalPlans
      },
      recentTransactions: transactions.map(tx => ({
        id: tx.id,
        name: tx.wallet.name,
        email: 'contractor@example.com', // Placeholder as Transaction doesn't link to User directly
        amount: `KES ${tx.amount.toLocaleString()}`,
        method: tx.referenceNumber?.startsWith('MP') ? 'Mpesa' : 'Internal',
        status: tx.status.toUpperCase(),
        date: new Date(tx.createdAt).toLocaleString()
      }))
    });
  } catch (error) {
    console.error('Superadmin dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
