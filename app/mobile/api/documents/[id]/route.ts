import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'documents:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!document) {
      return mobileError('Document not found', 404);
    }

    return mobileSuccess(document);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return mobileError('Failed to fetch document', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'documents:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Document not found', 404);
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

    return mobileSuccess(document, 'Document updated');
  } catch (error) {
    console.error('Failed to update document:', error);
    return mobileError('Failed to update document', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'documents:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!document) {
      return mobileError('Document not found', 404);
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

    return mobileSuccess(null, 'Document deleted');
  } catch (error) {
    console.error('Failed to delete document:', error);
    return mobileError('Failed to delete document', 500);
  }
}
