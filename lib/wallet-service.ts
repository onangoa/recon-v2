import { prisma } from './prisma';

export class WalletTransferError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'WalletTransferError';
    this.status = status;
  }
}

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
    metadata?: any;
  }) {
    return await prisma.transaction.create({
      data: {
        walletId: data.walletId,
        amount: data.amount,
        type: data.type,
        description: data.description,
        reference: data.referenceNumber,
        externalId: data.externalId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: 'pending',
      },
    });
  },

  /**
   * Complete a transaction and update wallet balance
   */
  async completeTransaction(externalId: string, receiptNumber?: string, metadata?: any) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { externalId, status: 'pending' },
      });

      if (!transaction) {
        throw new Error(`Pending transaction with externalId ${externalId} not found`);
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          receiptNumber,
          metadata: metadata ? JSON.stringify(metadata) : transaction.metadata,
          updatedAt: new Date(),
        },
      });

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
  },

  /**
   * Move funds between two wallets inside the platform. Creates a linked
   * debit/credit pair settled immediately, and updates both balances
   * atomically. No payout fee is charged because no money leaves the
   * platform. When `contractorId` is provided both wallets must belong to
   * that contractor.
   */
  async transferBetweenWallets(data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    description?: string;
    contractorId?: string;
  }) {
    const { sourceWalletId, destinationWalletId, amount, description, contractorId } = data;

    if (sourceWalletId === destinationWalletId) {
      throw new WalletTransferError('Source and destination wallets must be different');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new WalletTransferError('Transfer amount must be greater than zero');
    }

    return await prisma.$transaction(async (tx) => {
      const [source, destination] = await Promise.all([
        tx.wallet.findUnique({ where: { id: sourceWalletId } }),
        tx.wallet.findUnique({ where: { id: destinationWalletId } }),
      ]);

      if (!source) throw new WalletTransferError('Source wallet not found', 404);
      if (!destination) throw new WalletTransferError('Destination wallet not found', 404);

      if (contractorId) {
        if (source.contractorId !== contractorId) {
          throw new WalletTransferError('Source wallet not found', 404);
        }
        if (destination.contractorId !== contractorId) {
          throw new WalletTransferError('Destination wallet not found', 404);
        }
      }

      if (source.status !== 'active') {
        throw new WalletTransferError(`Source wallet is ${source.status}`);
      }
      if (destination.status !== 'active') {
        throw new WalletTransferError(`Destination wallet is ${destination.status}`);
      }
      if (source.currency !== destination.currency) {
        throw new WalletTransferError(
          `Currency mismatch: ${source.name} uses ${source.currency} but ${destination.name} uses ${destination.currency}`
        );
      }

      const transferRef = `ITR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;
      const baseMetadata = {
        internalTransfer: true,
        transferRef,
        sourceWalletId: source.id,
        destinationWalletId: destination.id,
      };

      const debit = await tx.transaction.create({
        data: {
          walletId: source.id,
          type: 'debit',
          amount,
          status: 'completed',
          transactionType: 'INTERNAL_TRANSFER',
          reference: transferRef,
          description: description || `Internal transfer to ${destination.name}`,
          recipientName: destination.name,
          metadata: JSON.stringify({ ...baseMetadata, direction: 'out' }),
        },
      });

      const credit = await tx.transaction.create({
        data: {
          walletId: destination.id,
          type: 'credit',
          amount,
          status: 'completed',
          transactionType: 'INTERNAL_TRANSFER',
          reference: transferRef,
          description: description || `Internal transfer from ${source.name}`,
          recipientName: source.name,
          metadata: JSON.stringify({ ...baseMetadata, direction: 'in' }),
        },
      });

      // Conditional decrement so concurrent transfers can never push the
      // source balance below zero.
      const debited = await tx.wallet.updateMany({
        where: { id: source.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debited.count === 0) {
        throw new WalletTransferError('Insufficient balance in source wallet');
      }

      await tx.wallet.update({
        where: { id: destination.id },
        data: { balance: { increment: amount } },
      });

      const [updatedSource, updatedDestination] = await Promise.all([
        tx.wallet.findUnique({ where: { id: source.id } }),
        tx.wallet.findUnique({ where: { id: destination.id } }),
      ]);

      return {
        transferRef,
        sourceTransaction: debit,
        destinationTransaction: credit,
        sourceBalance: updatedSource?.balance ?? source.balance - amount,
        destinationBalance: updatedDestination?.balance ?? destination.balance + amount,
      };
    });
  },
};
