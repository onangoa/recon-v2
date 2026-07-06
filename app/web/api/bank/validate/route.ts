import { NextRequest, NextResponse } from 'next/server';
import { validateBankAccount } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json();
    const { accountNumber, recipientBankIdentifier, userId } = body;

    if (!accountNumber) {
      return NextResponse.json({ error: 'Account number is required' }, { status: 400 });
    }

    const result = await validateBankAccount({
      accountNumber,
      recipientBankIdentifier,
      userId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bank account validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate bank account' },
      { status: 500 }
    );
  }
}