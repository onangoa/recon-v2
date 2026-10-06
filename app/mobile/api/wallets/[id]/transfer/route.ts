import { NextRequest } from 'next/server';
import { WalletService, WalletTransferError } from '@/lib/wallet-service';
import { mobileRequireContractorPermission, mobileSuccess, mobileError } from '@/lib/mobile-auth';

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
    const { destinationWalletId, amount, description } = body;

    if (!destinationWalletId || !amount) {
      return mobileError('Destination wallet and amount are required', 400);
    }

    const result = await WalletService.transferBetweenWallets({
      sourceWalletId: resolvedParams.id,
      destinationWalletId,
      amount: typeof amount === 'number' ? amount : parseFloat(amount),
      description,
      contractorId,
    });

    return mobileSuccess(result, 'Internal wallet transfer completed');
  } catch (error: any) {
    if (error instanceof WalletTransferError) {
      return mobileError(error.message, error.status);
    }
    console.error('Mobile wallet transfer error:', error);
    return mobileError(error.message || 'Failed to process wallet transfer', 500);
  }
}
