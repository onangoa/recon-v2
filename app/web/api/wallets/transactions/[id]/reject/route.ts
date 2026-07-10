import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'approve');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { reason } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Transaction is not pending approval' },
        { status: 400 }
      );
    }

    await prisma.transaction.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'CANCELLED',
        resultDesc: reason || 'Transaction rejected by admin'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Transaction rejected successfully'
    });
  } catch (error: any) {
    console.error('Reject Transaction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject transaction' },
      { status: 500 }
    );
  }
}