import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileStatusSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  const siteId = auth.siteId;

  if (!contractorId) {
    return Response.json({
      status: 'success',
      data: {
        purchase_orders_count: 0,
        machines_count: 0,
        inventories_count: 0,
        material_deliveries_count: 0,
        licenses_count: 0,
        suppliers_count: 0,
        attendance_chart: [],
        wallet_chart: [],
      },
    });
  }

  const siteFilter = siteId ? { id: siteId } : {};
  const sites = siteId
    ? await prisma.site.findMany({ where: { id: siteId, contractorId } })
    : await prisma.site.findMany({ where: { contractorId } });

  const siteIds = sites.map(s => s.id);

  const [walletBalance, totalWorkers, activeVisitors, pendingPOs, lowStockItems, machinesCount, licensesCount, suppliersCount, materialDeliveriesCount] = await Promise.all([
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
    prisma.equipment.count({
      where: siteIds.length > 0 ? { siteId: { in: siteIds } } : {},
    }),
    prisma.license.count({
      where: siteIds.length > 0 ? { siteId: { in: siteIds } } : {},
    }),
    prisma.supplier.count(),
    prisma.purchaseOrder.count({
      where: siteIds.length > 0 ? {
        siteId: { in: siteIds },
        status: 'delivered',
      } : { status: 'delivered' },
    }),
  ]);

  return mobileStatusSuccess({
    purchase_orders_count: pendingPOs,
    machines_count: machinesCount,
    inventories_count: lowStockItems,
    material_deliveries_count: materialDeliveriesCount,
    licenses_count: licensesCount,
    suppliers_count: suppliersCount,
    attendance_chart: [],
    wallet_chart: [],
  });
}