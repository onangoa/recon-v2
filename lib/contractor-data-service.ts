import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { withContractorFilter, withSiteContractorFilter } from '@/lib/contractor-isolation';
import { prisma } from '@/lib/prisma';

/**
 * Helper function to extract contractor ID from request
 */
export async function getContractorIdFromRequest(request: NextRequest): Promise<string | null> {
  const auth = await verifyAuth(request);
  return auth.contractorId;
}

/**
 * Get contractor-specific sites
 */
export async function getContractorSites(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.site.findMany(query);
}

/**
 * Get contractor-specific workers
 */
export async function getContractorWorkers(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.worker.findMany(query);
}

/**
 * Get contractor-specific projects
 */
export async function getContractorProjects(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.project.findMany(query);
}

/**
 * Get contractor-specific payroll periods
 */
export async function getContractorPayrollPeriods(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.payrollPeriod.findMany(query);
}

/**
 * Get site-specific equipment (filtered by contractor)
 */
export async function getSiteEquipment(request: NextRequest, siteId: string, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // First verify site belongs to contractor
  const query = withContractorFilter({ where: { id: siteId } }, contractorId);
  const site = await prisma.site.findFirst(query);

  if (!site) {
    throw new Error('Site not found or access denied');
  }

  const equipmentQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId
    }
  };

  return prisma.equipment.findMany(equipmentQuery);
}

/**
 * Get site-specific inventory (filtered by contractor)
 */
export async function getSiteInventory(request: NextRequest, siteId: string, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // First verify site belongs to contractor
  const query = withContractorFilter({ where: { id: siteId } }, contractorId);
  const site = await prisma.site.findFirst(query);

  if (!site) {
    throw new Error('Site not found or access denied');
  }

  const inventoryQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId
    }
  };

  return prisma.inventory.findMany(inventoryQuery);
}

/**
 * Get contractor-specific attendance records
 */
export async function getContractorAttendance(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.attendance.findMany(query);
}

/**
 * Get contractor-specific team members
 */
export async function getContractorTeamMembers(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.teamMember.findMany(query);
}

/**
 * Get contractor-specific wallets
 */
export async function getContractorWallets(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.wallet.findMany(query);
}

/**
 * Get contractor-specific purchase orders (through sites)
 */
export async function getContractorPurchaseOrders(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // Purchase orders are linked to sites, so we need to filter by site's contractor
  const siteQuery = withContractorFilter({ select: { id: true } }, contractorId);
  const sites = await prisma.site.findMany(siteQuery);

  const siteIds = sites.map(site => site.id);

  const purchaseOrderQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId: {
        in: siteIds
      }
    }
  };

  return prisma.purchaseOrder.findMany(purchaseOrderQuery);
}

/**
 * Get contractor-specific safety incidents (through sites)
 */
export async function getContractorSafetyIncidents(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // Safety incidents are linked to sites, so we need to filter by site's contractor
  const siteQuery = withContractorFilter({ select: { id: true } }, contractorId);
  const sites = await prisma.site.findMany(siteQuery);

  const siteIds = sites.map(site => site.id);

  const incidentQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId: {
        in: siteIds
      }
    }
  };

  return prisma.safetyIncident.findMany(incidentQuery);
}

/**
 * Get contractor-specific tasks (through sites)
 */
export async function getContractorTasks(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // Tasks are linked to sites, so we need to filter by site's contractor
  const siteQuery = withContractorFilter({ select: { id: true } }, contractorId);
  const sites = await prisma.site.findMany(siteQuery);

  const siteIds = sites.map(site => site.id);

  const taskQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId: {
        in: siteIds
      }
    }
  };

  return prisma.task.findMany(taskQuery);
}

/**
 * Get contractor-specific visitors (through sites)
 */
export async function getContractorVisitors(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // Visitors are linked to sites, so we need to filter by site's contractor
  const siteQuery = withContractorFilter({ select: { id: true } }, contractorId);
  const sites = await prisma.site.findMany(siteQuery);

  const siteIds = sites.map(site => site.id);

  const visitorQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId: {
        in: siteIds
      }
    }
  };

  return prisma.visitor.findMany(visitorQuery);
}

/**
 * Get contractor-specific documents (through sites)
 */
export async function getContractorDocuments(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  // Documents are linked to sites, so we need to filter by site's contractor
  const siteQuery = withContractorFilter({ select: { id: true } }, contractorId);
  const sites = await prisma.site.findMany(siteQuery);

  const siteIds = sites.map(site => site.id);

  const documentQuery = {
    ...options,
    where: {
      ...options?.where,
      siteId: {
        in: siteIds
      }
    }
  };

  return prisma.document.findMany(documentQuery);
}

/**
 * Get contractor-specific salary slips
 */
export async function getContractorSalarySlips(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.salarySlip.findMany(query);
}

/**
 * Get contractor-specific designations
 */
export async function getContractorDesignations(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.designation.findMany(query);
}

/**
 * Get contractor-specific shifts
 */
export async function getContractorShifts(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.shift.findMany(query);
}

/**
 * Get contractor-specific salary components
 */
export async function getContractorSalaryComponents(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.salaryComponent.findMany(query);
}

/**
 * Get contractor-specific notification preferences
 */
export async function getContractorNotificationPreferences(request: NextRequest, options?: any) {
  const contractorId = await getContractorIdFromRequest(request);
  if (!contractorId) {
    throw new Error('Unauthorized - No contractor found');
  }

  const query = withContractorFilter(options || {}, contractorId);
  return prisma.notificationPreference.findMany(query);
}