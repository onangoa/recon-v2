import { prisma } from './prisma';

/**
 * Contractor data isolation utilities
 * Ensures users can only access data belonging to their contractor
 */

/**
 * Filter a Prisma query to only include contractor-specific data
 * @param query - The query to modify
 * @param contractorId - The contractor ID to filter by
 * @returns Modified query with contractor filter
 */
export function withContractorFilter<T extends { where?: any }>(
  query: T,
  contractorId: string
): T {
  if (!contractorId) {
    throw new Error('Contractor ID is required for data isolation');
  }

  // Add contractor filter to where clause
  if (!query.where) {
    query.where = {};
  }

  query.where.contractorId = contractorId;
  return query;
}

/**
 * Filter a Prisma query for Site-related data
 * Sites are already linked to contractors, so we filter by site's contractor
 */
export function withSiteContractorFilter<T extends { where?: any }>(
  query: T,
  contractorId: string
): T {
  if (!contractorId) {
    throw new Error('Contractor ID is required for data isolation');
  }

  if (!query.where) {
    query.where = {};
  }

  // For site-related queries, filter through the site relation
  query.where.site = {
    contractorId
  };

  return query;
}

/**
 * Filter a Prisma query for Worker-related data
 * Workers are directly linked to contractors
 */
export function withWorkerContractorFilter<T extends { where?: any }>(
  query: T,
  contractorId: string
): T {
  if (!contractorId) {
    throw new Error('Contractor ID is required for data isolation');
  }

  if (!query.where) {
    query.where = {};
  }

  query.where.contractorId = contractorId;
  return query;
}

/**
 * Verify contractor access to a specific resource
 * @param contractorId - The contractor ID to verify
 * @param resourceType - The type of resource (site, worker, etc.)
 * @param resourceId - The ID of the resource
 * @returns Promise<boolean> - Whether the contractor has access
 */
export async function verifyContractorAccess(
  contractorId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'site': {
        const site = await prisma.site.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return site?.contractorId === contractorId;
      }

      case 'worker': {
        const worker = await prisma.worker.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return worker?.contractorId === contractorId;
      }

      case 'project': {
        const project = await prisma.project.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return project?.contractorId === contractorId;
      }

      case 'attendance': {
        const attendance = await prisma.attendance.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return attendance?.contractorId === contractorId;
      }

      case 'payroll': {
        const payroll = await prisma.payrollPeriod.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return payroll?.contractorId === contractorId;
      }

      case 'salary-slip': {
        const slip = await prisma.salarySlip.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return slip?.contractorId === contractorId;
      }

      case 'equipment': {
        // Equipment is linked to site, so check site's contractor
        const equipment = await prisma.equipment.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return equipment?.site?.contractorId === contractorId;
      }

      case 'inventory': {
        const inventory = await prisma.inventory.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return inventory?.site?.contractorId === contractorId;
      }

      case 'license': {
        const license = await prisma.license.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return license?.site?.contractorId === contractorId;
      }

      case 'document': {
        const document = await prisma.document.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return document?.site?.contractorId === contractorId;
      }

      case 'purchase-order': {
        const order = await prisma.purchaseOrder.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return order?.site?.contractorId === contractorId;
      }

      case 'task': {
        const task = await prisma.task.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return task?.site?.contractorId === contractorId;
      }

      case 'visitor': {
        const visitor = await prisma.visitor.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return visitor?.site?.contractorId === contractorId;
      }

      case 'safety-incident': {
        const incident = await prisma.safetyIncident.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return incident?.site?.contractorId === contractorId;
      }

      case 'safety-log': {
        const safetyLog = await prisma.safetyLog.findUnique({
          where: { id: resourceId },
          select: { site: { select: { contractorId: true } } }
        });
        return safetyLog?.site?.contractorId === contractorId;
      }

      case 'team-member': {
        const teamMember = await prisma.teamMember.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return teamMember?.contractorId === contractorId;
      }

      case 'wallet': {
        const wallet = await prisma.wallet.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return wallet?.contractorId === contractorId;
      }

      case 'notification-preference': {
        const preference = await prisma.notificationPreference.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return preference?.contractorId === contractorId;
      }

      case 'role': {
        const role = await prisma.role.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return role?.contractorId === contractorId;
      }

      case 'designation': {
        const designation = await prisma.designation.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return designation?.contractorId === contractorId;
      }

      case 'shift': {
        const shift = await prisma.shift.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return shift?.contractorId === contractorId;
      }

      case 'salary-component': {
        const component = await prisma.salaryComponent.findUnique({
          where: { id: resourceId },
          select: { contractorId: true }
        });
        return component?.contractorId === contractorId;
      }

      default:
        console.warn(`Unknown resource type: ${resourceType}`);
        return false;
    }
  } catch (error) {
    console.error('Error verifying contractor access:', error);
    return false;
  }
}

/**
 * Get all contractor IDs for verification
 * @param userId - The user ID
 * @returns Promise<string | null> - The contractor ID or null
 */
export async function getUserContractorId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { contractor: { select: { id: true } } }
  });
  return user?.contractor?.id || null;
}

/**
 * Batch verify contractor access for multiple resources
 * @param contractorId - The contractor ID to verify
 * @param resources - Array of { type, id } objects
 * @returns Promise<boolean> - Whether all resources belong to the contractor
 */
export async function verifyBatchContractorAccess(
  contractorId: string,
  resources: Array<{ type: string; id: string }>
): Promise<boolean> {
  const verifications = await Promise.all(
    resources.map(resource => 
      verifyContractorAccess(contractorId, resource.type, resource.id)
    )
  );

  return verifications.every(result => result === true);
}