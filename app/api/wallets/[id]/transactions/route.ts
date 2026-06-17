import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateSTKPush, initiateB2C, initiateB2B, initiateB2Pochi } from '@/lib/mpesa';
import { WalletService } from '@/lib/wallet-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: resolvedParams.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { walletId: resolvedParams.id } }),
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { type, amount, description, referenceNumber, method, payoutType } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: resolvedParams.id },
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
      // Payout
      if (wallet.balance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      let payoutResponse;
      if (payoutType === 'phone') {
        payoutResponse = await initiateB2C(
          referenceNumber, // phone number
          amount,
          'BusinessPayment',
          description || `Payment to ${referenceNumber}`,
          ''
        );
      } else if (payoutType === 'pochi') {
        payoutResponse = await initiateB2Pochi(
          referenceNumber, // phone number
          amount,
          description || `Pochi Payment to ${referenceNumber}`
        );
      } else if (payoutType === 'paybill' || payoutType === 'buygoods') {
        payoutResponse = await initiateB2B(
          referenceNumber, // shortcode
          amount,
          payoutType === 'paybill' ? 'BusinessPayBill' : 'BusinessBuyGoods',
          wallet.name,
          description || `Payment to ${referenceNumber}`
        );
      } else {
        return NextResponse.json({ error: 'Invalid payout type' }, { status: 400 });
      }

      return NextResponse.json({ mpesaResponse: payoutResponse });
    }
  } catch (error: any) {
    console.error('Wallet Transaction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process transaction' },
      { status: 500 }
    );
  }
}