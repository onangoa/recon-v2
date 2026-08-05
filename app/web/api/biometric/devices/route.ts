import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';
import { checkDeviceStatus } from '@/lib/biometric-service';

/**
 * GET /web/api/biometric/devices?status=1&siteId=<id>
 *
 * Lists the contractor's configured biometric devices. When `status=1` is
 * passed, each device is pinged via the device API and an `online` flag is
 * included (slower — only request when you need live status). When `siteId`
 * is supplied the list is narrowed to devices linked to that site (after the
 * caller's ownership of the site is verified).
 */
export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  const { searchParams } = new URL(request.url);
  const withStatus = searchParams.get('status') === '1';
  const siteId = searchParams.get('siteId');

  try {
    const where: any = { contractorId };
    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }
      where.siteId = siteId;
    }

    const devices = await prisma.biometricDevice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let rows = devices.map((d) => ({
      id: d.id,
      name: d.name,
      sn: d.sn,
      location: d.location,
      isActive: d.isActive,
      siteId: d.siteId,
      createdAt: d.createdAt,
    }));

    if (withStatus) {
      const statuses = await Promise.all(rows.map((d) => checkDeviceStatus(d.sn)));
      const map = new Map(statuses.map((s) => [s.sn, s]));
      rows = rows.map((d) => ({
        ...d,
        online: map.get(d.sn)?.online ?? false,
        userCount: map.get(d.sn)?.userCount,
      }));
    }

    return NextResponse.json({ devices: rows });
  } catch (error) {
    console.error('Failed to fetch biometric devices:', error);
    return NextResponse.json({ error: 'Failed to fetch biometric devices' }, { status: 500 });
  }
}

/**
 * POST /web/api/biometric/devices
 * Body: { name, sn, location?, isActive? }
 */
export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  try {
    const body = await request.json();
    const { name, sn, location, siteId } = body;

    if (!name || !sn) {
      return NextResponse.json({ error: 'Device name and serial number (sn) are required' }, { status: 400 });
    }

    // When a site is supplied it must belong to the contractor.
    const resolvedSiteId = siteId
      ? ((await verifySiteOwnership(contractorId, siteId)) ? siteId : null)
      : null;
    if (siteId && !resolvedSiteId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const exists = await prisma.biometricDevice.findUnique({
      where: { contractorId_sn: { contractorId, sn: String(sn).trim() } },
    });
    if (exists) {
      return NextResponse.json({ error: 'A device with this serial number already exists' }, { status: 409 });
    }

    const device = await prisma.biometricDevice.create({
      data: {
        contractorId,
        siteId: resolvedSiteId,
        name: String(name).trim(),
        sn: String(sn).trim(),
        location: location ? String(location).trim() : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'SETTINGS',
      description: `Added biometric device "${device.name}" (sn: ${device.sn})`,
      targetId: device.id,
      details: { name: device.name, sn: device.sn },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Failed to create biometric device:', error);
    return NextResponse.json({ error: 'Failed to create biometric device' }, { status: 500 });
  }
}