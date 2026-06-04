import { prisma } from './prisma';

export const WalletService = {
  /**
   * Create a pending transaction
   */
  async createPendingTransaction(data: {
    walletId: string;
    amount: number;
    type: 'credit' | 'debit';
    description?: string;
    referenceNumber?: string;
    externalId?: string;
  }) {
    return await prisma.transaction.create({
      data: {
        ...data,
        status: 'pending',
      },
    });
  },

  /**
   * Complete a transaction and update wallet balance
   */
  async completeTransaction(externalId: string, receiptNumber?: string) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { externalId, status: 'pending' },
      });

      if (!transaction) {
        throw new Error(`Pending transaction with externalId ${externalId} not found`);
      }

      // Update transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          receiptNumber,
          updatedAt: new Date(),
        },
      });

      // Update wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { id: transaction.walletId },
      });

      if (!wallet) {
        throw new Error(`Wallet ${transaction.walletId} not found`);
      }

      const newBalance = transaction.type === 'credit'
        ? wallet.balance + transaction.amount
        : wallet.balance - transaction.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return updatedTransaction;
    });
  },

  /**
   * Mark a transaction as failed
   */
  async failTransaction(externalId: string, description?: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { externalId, status: 'pending' },
    });

    if (!transaction) return null;

    return await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'failed',
        description: description ? `${transaction.description} (Failed: ${description})` : transaction.description,
        updatedAt: new Date(),
      },
    });
  }
};
