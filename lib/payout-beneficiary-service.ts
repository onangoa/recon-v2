/**
 * Saved payout destinations (beneficiary address book) + recent-recipient
 * derivation from transaction history (see saved-payments.md).
 *
 * Channels: phone | pochi | paybill | till | pesalink | ift | mpesa (bank-to-M-Pesa)
 *  - destination: mobile number / paybill shortcode / till number / bank account
 *  - accountRef:  secondary reference (paybill account number)
 *  - bankCode:    destination bank for PesaLink
 */
import { prisma } from './prisma';

export const PAYOUT_CHANNELS = ['phone', 'pochi', 'paybill', 'till', 'pesalink', 'ift', 'mpesa'] as const;
export type PayoutChannel = (typeof PAYOUT_CHANNELS)[number];

export interface SavePayoutBeneficiaryInput {
  channel: string;
  destination: string;
  label?: string | null;
  accountRef?: string | null;
  bankCode?: string | null;
  recipientName?: string | null;
  isFavorite?: boolean;
}

export interface RecentPayoutRecipient {
  channel: string;
  destination: string;
  accountRef: string | null;
  bankCode: string | null;
  recipientName: string | null;
  usageCount: number;
  lastUsedAt: Date;
}

function beneficiaryKey(channel: string, destination: string): string {
  return `${channel}|${destination.replace(/\s/g, '')}`;
}

/**
 * Save (or refresh) a payout destination for a contractor. Deduplicates on
 * channel + destination: an existing entry gets its usage count bumped and
 * its label/recipient details refreshed instead of being duplicated.
 */
export async function savePayoutBeneficiary(
  contractorId: string,
  input: SavePayoutBeneficiaryInput
) {
  const channel = String(input.channel || '').trim();
  const destination = String(input.destination || '').trim();

  if (!PAYOUT_CHANNELS.includes(channel as PayoutChannel)) {
    throw new Error(`Invalid payout channel: ${channel}`);
  }
  if (!destination) {
    throw new Error('Destination is required');
  }

  const existing = await prisma.payoutBeneficiary.findFirst({
    where: { contractorId, channel, destination },
  });

  if (existing) {
    return prisma.payoutBeneficiary.update({
      where: { id: existing.id },
      data: {
        label: input.label?.trim() || existing.label,
        accountRef: input.accountRef ?? existing.accountRef,
        bankCode: input.bankCode ?? existing.bankCode,
        recipientName: input.recipientName ?? existing.recipientName,
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  return prisma.payoutBeneficiary.create({
    data: {
      contractorId,
      label: input.label?.trim() || input.recipientName?.trim() || destination,
      channel,
      destination,
      accountRef: input.accountRef || null,
      bankCode: input.bankCode || null,
      recipientName: input.recipientName || null,
      isFavorite: input.isFavorite ?? false,
      usageCount: 1,
      lastUsedAt: new Date(),
    },
  });
}

const INCLUDED_STATUSES = ['pending_approval', 'pending', 'completed', 'SUCCESS', 'PENDING'];

function channelFromTransaction(tx: { remarks: string | null; transactionType: string | null }): string {
  const remarks = tx.remarks || '';
  if (PAYOUT_CHANNELS.includes(remarks as PayoutChannel)) return remarks;
  switch (tx.transactionType) {
    case 'B2C': return 'phone';
    case 'B2POCHI': return 'pochi';
    case 'B2B': return 'till';
    case 'BANK_PESALINK': return 'pesalink';
    case 'BANK_IFT': return 'ift';
    case 'BANK_MPESA': return 'mpesa';
    default: return '';
  }
}

function destinationFromTransaction(
  channel: string,
  tx: { phoneNumber: string | null; accountReference: string | null }
): string {
  switch (channel) {
    case 'phone':
    case 'pochi':
    case 'mpesa':
      return tx.phoneNumber || '';
    case 'paybill':
    case 'till':
    case 'pesalink':
    case 'ift':
      return tx.accountReference || '';
    default:
      return '';
  }
}

/**
 * Derive "recent recipients" from the contractor's payout history — distinct
 * destinations actually paid before, most-used first. No schema change: this
 * reads the existing Transaction table.
 *
 * Caveat: for paybill payouts made with an account number, the transaction
 * stores the account (not the shortcode) in accountReference, so the recent
 * entry shows the account value as best effort.
 */
export async function getRecentPayoutRecipients(
  contractorId: string,
  limit = 10
): Promise<RecentPayoutRecipient[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'debit',
      status: { in: INCLUDED_STATUSES },
      wallet: { contractorId },
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      remarks: true,
      transactionType: true,
      phoneNumber: true,
      accountReference: true,
      recipientName: true,
      metadata: true,
      createdAt: true,
    },
  });

  const grouped = new Map<string, RecentPayoutRecipient & { bankCodeRaw?: string | null }>();

  for (const tx of transactions) {
    const channel = channelFromTransaction(tx);
    if (!channel) continue;
    const destination = destinationFromTransaction(channel, tx).trim();
    if (!destination) continue;

    let bankCode: string | null = null;
    if (channel === 'pesalink' && tx.metadata) {
      try {
        const meta = JSON.parse(tx.metadata);
        bankCode = meta.bankCode || null;
      } catch {
        bankCode = null;
      }
    }

    const key = beneficiaryKey(channel, destination);
    const existing = grouped.get(key);
    if (existing) {
      existing.usageCount += 1;
      existing.recipientName = existing.recipientName || tx.recipientName;
      existing.bankCode = existing.bankCode || bankCode;
    } else {
      grouped.set(key, {
        channel,
        destination,
        accountRef: null,
        bankCode,
        recipientName: tx.recipientName,
        usageCount: 1,
        lastUsedAt: tx.createdAt,
      });
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.usageCount - a.usageCount || b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .slice(0, limit);
}
