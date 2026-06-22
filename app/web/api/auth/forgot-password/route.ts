import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: true, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid leaking user existence
    if (!user) {
      return NextResponse.json(
        { error: false, message: 'Reset password instructions sent to your email.' },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const resetTokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3010'}/reset-password?token=${resetToken}`;

    // Try to send email, but don't fail the request if email is not configured
    try {
      const { EmailService } = await import('@/lib/notification-service');
      const emailResult = await EmailService.send({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B4513;">Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your password. Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #8B4513, #A0522D); color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #8B4513;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p style="margin-top: 32px; color: #666; font-size: 12px;">ReconSMI - Construction Management System</p>
          </div>
        `,
        text: `Hi ${user.name},\n\nWe received a request to reset your password. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.\n\nReconSMI - Construction Management System`,
      });

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        console.log('Reset URL (for development):', resetUrl);
      }
    } catch (emailError: any) {
      console.error('Email service not available:', emailError.message);
      console.log('Reset URL (for development):', resetUrl);
      // Still return success to avoid leaking user existence
    }

    return NextResponse.json(
      { error: false, message: 'Reset password instructions sent to your email.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: true, message: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}