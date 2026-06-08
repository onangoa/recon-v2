import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { companyName, location, phoneNumber, licenseNo, subscriptionPlanId, name, email } = body;

    const contractor = await prisma.contractor.update({
      where: { id: params.id },
      data: {
        companyName,
        location,
        phoneNumber,
        licenseNo,
        subscriptionPlanId,
        user: {
          update: {
            name,
            email,
          },
        },
      },
    });

    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contractor = await prisma.contractor.findUnique({
      where: { id: params.id },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Delete contractor and user (cascading delete should handle this if set up, 
    // but Prisma's delete on User will handle Contractor because of the relation)
    await prisma.user.delete({
      where: { id: contractor.userId },
    });

    return NextResponse.json({ message: 'Contractor deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
