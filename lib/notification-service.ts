import { prisma } from './prisma';
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      const smtpHost = process.env.SMTP_HOST || 'smtp.purelymail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '465');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpFrom = process.env.SMTP_FROM || 'notifications@reconsmi.com';

      if (!smtpUser || !smtpPassword) {
        throw new Error('SMTP_USER and SMTP_PASSWORD environment variables are required');
      }

      const secure = smtpPort === 465;

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: secure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server is ready to send emails');
        }
      });
    }

    return this.transporter;
  }

  static async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.getTransporter();
      const smtpFrom = process.env.SMTP_FROM || 'notifications@reconsmi.com';

      await transporter.sendMail({
        from: `"ReconSMI" <${smtpFrom}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
  }
}

export type NotificationType = 'payroll' | 'safety' | 'inventory' | 'team' | 'license' | 'system';

interface SendNotificationOptions {
  userId: string;
  contractorId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  html?: string;
}

export class NotificationService {
  /**
   * Sends a notification to a user, respecting their preferences.
   */
  static async send(options: SendNotificationOptions) {
    const { userId, contractorId, title, message, type, link, html } = options;

    try {
      // 1. Fetch user preferences
      const preference = await prisma.notificationPreference.findUnique({
        where: {
          contractorId_type: {
            contractorId,
            type,
          }
        }
      });

      // Default to enabled if no preference set
      const emailEnabled = preference ? preference.emailEnabled : true;
      const pushEnabled = preference ? preference.pushEnabled : true;

      // 2. Create in-app notification (if push/in-app enabled)
      if (pushEnabled) {
        await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link,
            isRead: false,
          }
        });
      }

      // 3. Send email (if email enabled)
      if (emailEnabled) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
          await EmailService.send({
            to: user.email,
            subject: title,
            html: html || `<p>${message}</p>`,
            text: message,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Notification Service Error:', error);
      return { success: false, error };
    }
  }
}
