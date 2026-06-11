import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const siteId = searchParams.get('siteId');

    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    } else if (contractorId) {
      where.site = { contractorId: contractorId };
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
  try {
    const body = await request.json();
    const incident = await prisma.safetyIncident.create({
      data: {
        siteId: body.siteId,
        title: body.title,
        description: body.description,
        type: body.type,
        severity: body.severity,
        status: body.status || 'Reported',
        incidentDate: new Date(body.incidentDate),
        reportedBy: body.reportedBy,
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
