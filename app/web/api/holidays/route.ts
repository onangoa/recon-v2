import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';

/**
 * Minimal public-holiday management (see overtime.md "Lean plan for #3"):
 * a seeded, editable list per contractor used to bucket overtime hours
 * into the public_holiday band at payroll time. No dedicated CRUD UI —
 * list, add and remove via this endpoint.
 */
export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'payroll:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateFilter: any = {};
    if (from || to) {
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
    } else if (year) {
      const y = parseInt(year, 10);
      dateFilter.gte = new Date(y, 0, 1);
      dateFilter.lte = new Date(y, 11, 31, 23, 59, 59);
    }

    const where: any = { contractorId };
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'payroll:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const body = await request.json();

    if (!body.name || !body.date) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 });
    }

    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    // Normalise to local midnight so day-key matching is stable.
    date.setHours(0, 0, 0, 0);

    const holiday = await prisma.holiday.create({
      data: {
        contractorId,
        name: String(body.name),
        date,
      },
    });
    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error('Failed to create holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'payroll:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Holiday id is required' }, { status: 400 });
    }

    const existing = await prisma.holiday.findFirst({
      where: { id, contractorId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ message: 'Holiday deleted' });
  } catch (error) {
    console.error('Failed to delete holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
