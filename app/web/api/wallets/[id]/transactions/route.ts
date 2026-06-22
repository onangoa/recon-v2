import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateSTKPush, initiateB2C, initiateB2B, initiateB2Pochi } from '@/lib/mpesa';
import { WalletService } from '@/lib/wallet-service';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
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

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { type, amount, description, referenceNumber, method, payoutType, accountNumber, requiresApproval } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Standard manual/other method
    if (method !== 'mpesa') {
      if (type === 'debit' && wallet.balance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
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

      return NextResponse.json(transaction);
    }

    // M-Pesa Integration
    if (type === 'credit') {
      // STK Push
      const stkResponse = await initiateSTKPush(
        referenceNumber, // phone number
        amount,
        resolvedParams.id, // Pass wallet ID
        description || 'Deposit to Wallet'
      );

      return NextResponse.json({ mpesaResponse: stkResponse });
    } else {
      // Payout - create pending approval transaction
      if (wallet.balance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
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

      return NextResponse.json({ 
        transaction,
        message: 'Transaction created and pending approval'
      });
    }
  } catch (error: any) {
    console.error('Wallet Transaction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process transaction' },
      { status: 500 }
    );
  }
}