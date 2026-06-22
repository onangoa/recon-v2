import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'safety:read');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json(incident);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'safety:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.safetyIncident.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
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
    return NextResponse.json(incident);
  } catch (error) {
    console.error('Failed to update incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'safety:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.safetyIncident.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    await prisma.safetyIncident.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Incident deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}