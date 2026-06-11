import { prisma } from './prisma';

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PROCESS' | 'APPROVE' | 'CANCEL';

export type ActivityModule = 
  | 'WORKERS' 
  | 'DESIGNATIONS' 
  | 'PAYROLL' 
  | 'SITES' 
  | 'INVENTORY' 
  | 'EQUIPMENT' 
  | 'PURCHASE_ORDERS' 
  | 'MATERIALS' 
  | 'VISITORS' 
  | 'DOCUMENTS' 
  | 'SAFETY'
  | 'TEAM'
  | 'SETTINGS';

interface LogActivityOptions {
  userId: string;
  contractorId: string;
  action: ActivityAction;
  module: ActivityModule;
  description: string;
  details?: any;
  targetId?: string;
  ipAddress?: string;
}

export class ActivityLogger {
  /**
   * Records an activity log entry.
   */
  static async log(options: LogActivityOptions) {
    const { 
      userId, 
      contractorId, 
      action, 
      module, 
      description, 
      details, 
      targetId, 
      ipAddress 
    } = options;

    try {
      await prisma.activityLog.create({
        data: {
          userId,
          contractorId,
          action,
          module,
          description,
          details: details ? JSON.stringify(details) : null,
          targetId,
          ipAddress,
        }
      });
    } catch (error) {
      console.error('Failed to record activity log:', error);
    }
  }

  /**
   * Helper to automatically find contractorId if not provided
   */
  static async logAuto(userId: string, options: Omit<LogActivityOptions, 'userId' | 'contractorId'>) {
    try {
      // Find contractor associated with user
      const contractor = await prisma.contractor.findUnique({
        where: { userId }
      });

      if (!contractor) {
        // Fallback to first contractor for demo/dev
        const first = await prisma.contractor.findFirst();
        if (first) {
          return this.log({ ...options, userId, contractorId: first.id });
        }
        return;
      }

      return this.log({ ...options, userId, contractorId: contractor.id });
    } catch (err) {
      console.error('ActivityLogger.logAuto error:', err);
    }
  }
}
