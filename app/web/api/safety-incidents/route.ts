import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'safety:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const where: any = { site: { contractorId } };
    if (siteId) {
      where.siteId = siteId;
    }

    const incidents = await prisma.safetyIncident.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Failed to fetch safety incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch safety incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'safety:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const body = await request.json();

    if (!body.siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: body.siteId } });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 400 });
    }

    if (site.contractorId !== contractorId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const incident = await prisma.safetyIncident.create({
      data: {
        siteId: body.siteId,
        title: body.title || 'Untitled Incident',
        description: body.description || '',
        type: body.type || 'other',
        severity: body.severity || 'low',
        status: body.status || 'Reported',
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : new Date(),
        reportedBy: body.reportedBy || permCheck.userId || 'unknown',
        attachments: body.attachments,
      },
      include: {
        site: {
          include: {
            contractor: true
          }
        },
      },
    });

    // Trigger notification system
    await NotificationService.send({
      userId: incident.site.contractor.userId,
      contractorId: incident.site.contractorId,
      title: `Safety Incident: ${incident.severity} Severity`,
      message: `A new ${incident.type} has been reported at ${incident.site.name}: ${incident.title}`,
      type: 'safety',
      link: '/contractor/safety'
    });

    // Record activity log
    await ActivityLogger.log({
      userId: incident.site.contractor.userId,
      contractorId: incident.site.contractorId,
      action: 'CREATE',
      module: 'SAFETY',
      description: `Reported safety incident: ${incident.title}`,
      targetId: incident.id,
      details: { site: incident.site.name, severity: incident.severity }
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Failed to create safety incident:', error);
    return NextResponse.json({ error: 'Failed to create safety incident' }, { status: 500 });
  }
}
