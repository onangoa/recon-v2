import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateSTKPush } from '@/lib/mpesa';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId }
    });
    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    const whereCondition: any = { walletId: resolvedParams.id };

    if (search) {
      whereCondition.OR = [
        { reference: { contains: search } },
        { receiptNumber: { contains: search } },
        { description: { contains: search } },
        { transactionType: { contains: search } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);

    return mobileList(transactions, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch transactions error:', error);
    return mobileError('Failed to fetch transactions', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { type, amount, description, referenceNumber, method, payoutType, accountNumber, requiresApproval } = body;

    if (!type || !amount) {
      return mobileError('Type and amount are required', 400);
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
    });

    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    if (method !== 'mpesa') {
      if (type === 'debit' && wallet.balance < amount) {
        return mobileError('Insufficient balance', 400);
      }

      const newBalance = type === 'credit' ? wallet.balance + amount : wallet.balance - amount;

      const transaction = await prisma.transaction.create({
        data: {
          walletId: resolvedParams.id,
          type,
          amount,
          description,
          reference: referenceNumber,
          status: 'completed',
        },
      });

      await prisma.wallet.update({
        where: { id: resolvedParams.id },
        data: { balance: newBalance },
      });

      return mobileSuccess(transaction);
    }

    if (type === 'credit') {
      const stkResponse = await initiateSTKPush(
        referenceNumber,
        amount,
        resolvedParams.id,
        description || 'Deposit to Wallet'
      );

      return mobileSuccess({ mpesaResponse: stkResponse }, 'STK Push initiated');
    } else {
      if (wallet.balance < amount) {
        return mobileError('Insufficient balance', 400);
      }

      let transactionType = 'B2C';
      if (payoutType === 'pochi') transactionType = 'B2POCHI';
      else if (payoutType === 'paybill' || payoutType === 'till') transactionType = 'B2B';

      const transaction = await prisma.transaction.create({
        data: {
          walletId: resolvedParams.id,
          type: 'debit',
          amount,
          description,
          reference: referenceNumber,
          status: 'pending_approval',
          transactionType,
          accountReference: accountNumber || referenceNumber,
          transactionDesc: description || `${transactionType} Payment to ${referenceNumber}`,
          remarks: payoutType,
          phoneNumber: payoutType === 'phone' || payoutType === 'pochi' ? referenceNumber : undefined,
        },
      });

      return mobileSuccess({ transaction }, 'Transaction created and pending approval');
    }
  } catch (error: any) {
    console.error('Mobile wallet transaction error:', error);
    return mobileError(error.message || 'Failed to process transaction', 500);
  }
}
