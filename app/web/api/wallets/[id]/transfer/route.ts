import { NextRequest, NextResponse } from 'next/server';
import { WalletService, WalletTransferError } from '@/lib/wallet-service';
import { requireContractorPermission } from '@/lib/require-permission';

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
    const { destinationWalletId, amount, description } = body;

    if (!destinationWalletId || !amount) {
      return NextResponse.json(
        { error: 'Destination wallet and amount are required' },
        { status: 400 }
      );
    }

    const result = await WalletService.transferBetweenWallets({
      sourceWalletId: resolvedParams.id,
      destinationWalletId,
      amount: typeof amount === 'number' ? amount : parseFloat(amount),
      description,
      contractorId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof WalletTransferError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Wallet transfer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process wallet transfer' },
      { status: 500 }
    );
  }
}
