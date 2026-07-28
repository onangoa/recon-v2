import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashPassword } from '@/lib/jwt';
import { requireSuperadmin } from '@/lib/require-permission';
import { EmailService } from '@/lib/notification-service';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const plainPassword = password || crypto.randomBytes(8).toString('hex');

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(plainPassword),
        role: 'superadmin',
      },
    });

    try {
      await EmailService.send({
        to: email,
        subject: 'Welcome to ReconSMI - Your Admin Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to ReconSMI!</h2>
            <p>Hello ${name},</p>
            <p>Your super administrator account has been created successfully.</p>
            <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Login Credentials:</strong></p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0;"><strong>Password:</strong> ${plainPassword}</p>
            </div>
            <p>Please log in and change your password as soon as possible.</p>
            <p style="margin-top: 24px; color: #888;">ReconSMI Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
    }

    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
