import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const preferences = await prisma.notificationPreference.findMany({
      where: { contractorId: id },
    });
    
    // Default preferences if none exist
    const defaultTypes = ['payroll', 'safety', 'inventory', 'team', 'license', 'orders'];
    const mergedPreferences = defaultTypes.map(type => {
      const existing = preferences.find(p => p.type === type);
      return existing || { type, emailEnabled: true, pushEnabled: true };
    });

    return NextResponse.json(mergedPreferences);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const { preferences } = await request.json();
    
    // Upsert each preference
    const operations = preferences.map((pref: any) => 
      prisma.notificationPreference.upsert({
        where: {
          contractorId_type: {
            contractorId: id,
            type: pref.type,
          }
        },
        update: {
          emailEnabled: pref.emailEnabled,
          pushEnabled: pref.pushEnabled,
        },
        create: {
          contractorId: id,
          type: pref.type,
          emailEnabled: pref.emailEnabled,
          pushEnabled: pref.pushEnabled,
        }
      })
    );

    await Promise.all(operations);

    return NextResponse.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
