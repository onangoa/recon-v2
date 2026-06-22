import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request as any, 'documents:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request as any, 'documents:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        fileUrl: body.fileUrl,
        notes: body.notes || null,
      },
      include: { site: true }
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: document.site.contractorId,
      action: 'UPDATE',
      module: 'DOCUMENTS',
      description: `Updated document: ${document.name}`,
      targetId: document.id,
      details: { name: document.name, type: document.type }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request as any, 'documents:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.site) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId: document.site.contractorId,
        action: 'DELETE',
        module: 'DOCUMENTS',
        description: `Deleted document: ${document.name}`,
        targetId: document.id,
        details: { name: document.name, type: document.type }
      });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}