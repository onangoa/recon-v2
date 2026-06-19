import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  const siteId = auth.siteId;

  if (!contractorId) return mobileError('No company associated', 403);

  const siteFilter = siteId ? { id: siteId } : {};
  const sites = siteId
    ? await prisma.site.findMany({ where: { id: siteId, contractorId } })
    : await prisma.site.findMany({ where: { contractorId } });

  const siteIds = sites.map(s => s.id);

  const [walletBalance, totalWorkers, activeVisitors, pendingPOs, lowStockItems] = await Promise.all([
    prisma.wallet.aggregate({ where: { contractorId }, _sum: { balance: true } }),
    prisma.worker.count({ where: { contractorId, status: 'Active' } }),
    prisma.visitor.count({
      where: siteIds.length > 0 ? {
        siteId: { in: siteIds },
        checkOutTime: null,
      } : { checkOutTime: null },
    }),
    prisma.purchaseOrder.count({
      where: siteIds.length > 0 ? {
        siteId: { in: siteIds },
        status: 'pending',
      } : { status: 'pending' },
    }),
    prisma.inventory.count({
      where: siteIds.length > 0 ? {
        siteId: { in: siteIds },
        quantity: { lte: prisma.inventory.fields.minStock },
      } : { quantity: { lte: 0 } },
    }),
  ]);

  return mobileSuccess({
    wallet_balance: walletBalance._sum.balance || 0,
    total_workers: totalWorkers,
    active_visitors: activeVisitors,
    pending_purchase_orders: pendingPOs,
    low_stock_items_count: lowStockItems,
  });
}