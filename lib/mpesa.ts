// M-Pesa Service Wrapper for backward compatibility
// This file wraps the new mpesa-service module to maintain compatibility with existing code

export {
  // Transaction initiation functions
  initiateSTKPush,
  initiateB2C,
  initiateB2B,
  initiateB2Pochi,
  checkTransactionStatus,
  checkAccountBalance,
  initiateReversal,
  
  // Callback handler functions
  handleSTKPushCallback,
  handleB2CCallback,
  handleB2BCallback,
  handleB2PochiCallback,
  handleC2BConfirmation,
  handleC2BValidation,
  handleTransactionStatusCallback,
  handleAccountBalanceCallback,
  handleReversalCallback,
  
  // Helper functions
  getTransaction,
  getWalletTransactions,
  getTransactionsByStatus,
  getTransactionsByType,
  monitorPendingTransactions,
  
  // Enums
  TransactionStatus,
  TransactionType
} from './mpesa-service';

// Re-export for backward compatibility with old function names
export const mpesa = {
  stkPush: async (data: any) => {
    const { initiateSTKPush } = await import('./mpesa-service');
    return await initiateSTKPush(
      data.phoneNumber,
      data.amount,
      data.walletId,
      data.accountReference,
      data.transactionDesc
    );
  },
  b2c: async (data: any) => {
    const { initiateB2C } = await import('./mpesa-service');
    return await initiateB2C(
      data.partyB,
      data.amount,
      data.walletId,
      data.commandID,
      data.remarks,
      data.occasion
    );
  },
  b2b: async (data: any) => {
    const { initiateB2B } = await import('./mpesa-service');
    return await initiateB2B(
      data.partyB,
      data.amount,
      data.walletId,
      data.accountReference,
      data.commandID,
      data.remarks
    );
  },
  b2pochi: async (data: any) => {
    const { initiateB2Pochi } = await import('./mpesa-service');
    return await initiateB2Pochi(
      data.partyB,
      data.amount,
      data.walletId,
      data.remarks
    );
  },
  transactionStatus: async (data: any) => {
    const { checkTransactionStatus } = await import('./mpesa-service');
    return await checkTransactionStatus(
      data.transactionID,
      data.remarks,
      data.walletId
    );
  },
  accountBalance: async (data: any) => {
    const { checkAccountBalance } = await import('./mpesa-service');
    return await checkAccountBalance(
      data.remarks,
      data.walletId
    );
  },
  reversal: async (data: any) => {
    const { initiateReversal } = await import('./mpesa-service');
    return await initiateReversal(
      data.transactionID,
      data.amount,
      data.walletId,
      data.remarks
    );
  },
  init: async () => {
    // The new service initializes automatically when needed
    return { success: true };
  },
  connectDatabase: async () => {
    // The new service uses the existing prisma connection
    return { success: true };
  }
};
