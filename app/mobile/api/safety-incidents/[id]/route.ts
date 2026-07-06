import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'safety:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const incident = await prisma.safetyIncident.findFirst({
      where: { id, site: { contractorId } },
      include: {
        site: true,
      },
    });
    if (!incident) {
      return mobileError('Incident not found', 404);
    }
    return mobileSuccess(incident);
  } catch (error) {
    return mobileError('Failed to fetch incident', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'safety:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.safetyIncident.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Incident not found', 404);
    }

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        severity: body.severity,
        status: body.status,
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
        reportedBy: body.reportedBy,
        attachments: body.attachments,
      },
      include: {
        site: true,
      },
    });
    return mobileSuccess(incident, 'Incident updated');
  } catch (error) {
    console.error('Failed to update incident:', error);
    return mobileError('Failed to update incident', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'safety:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.safetyIncident.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Incident not found', 404);
    }
    await prisma.safetyIncident.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Incident deleted');
  } catch (error) {
    return mobileError('Failed to delete incident', 500);
  }
}
