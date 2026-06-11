import { prisma } from './prisma';

// In a real app, use nodemailer or a service like SendGrid/Postmark
// import nodemailer from 'nodemailer';

export type NotificationType = 'payroll' | 'safety' | 'inventory' | 'team' | 'system';

interface SendNotificationOptions {
  userId: string;
  contractorId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export class NotificationService {
  /**
   * Sends a notification to a user, respecting their preferences.
   */
  static async send(options: SendNotificationOptions) {
    const { userId, contractorId, title, message, type, link } = options;

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
          await this.sendEmail(user.email, title, message);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Notification Service Error:', error);
      return { success: false, error };
    }
  }

  /**
   * Internal method to simulate/send email
   */
  private static async sendEmail(to: string, subject: string, body: string) {
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    // console.log(`Body: ${body}`);
    
    // Placeholder for actual SMTP logic:
    /*
    const transporter = nodemailer.createTransport({ ... });
    await transporter.sendMail({
      from: '"ReconSMI" <notifications@reconsmi.com>',
      to,
      subject,
      text: body,
      html: `<p>${body}</p>`,
    });
    */
  }
}
