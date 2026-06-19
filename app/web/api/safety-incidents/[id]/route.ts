import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'safety:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
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
  const permCheck = await requirePermission(request, 'safety:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        siteId: body.siteId,
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
  const permCheck = await requirePermission(request, 'safety:delete');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    await prisma.safetyIncident.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Incident deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}
