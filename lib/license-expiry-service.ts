import { prisma } from './prisma';
import { NotificationService } from './notification-service';

// Days before expiry at which to send a "expiring soon" alert.
const EXPIRY_WARNING_DAYS = [30, 14, 7];

export interface LicenseExpiryResult {
  scanned: number;
  notified: number;
  skipped: number;
  errors: number;
  details: Array<{ licenseId: string; licenseName: string; tier: string; sent: boolean; reason?: string }>;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExpiry(days: number): string {
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function buildEmailHtml(
  licenseName: string,
  licenseNumber: string,
  siteName: string | null,
  expiryDate: Date,
  daysUntilExpiry: number,
  isExpired: boolean,
): string {
  const headline = isExpired
    ? 'A license has expired'
    : 'A license is expiring soon';
  const expiryText = isExpired
    ? `This license expired on ${expiryDate.toLocaleDateString()}.`
    : `This license expires on ${expiryDate.toLocaleDateString()} (${formatExpiry(daysUntilExpiry)}).`;

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 560px; margin: 0 auto;">
      <h2 style="margin-bottom: 8px;">${headline}</h2>
      <p style="margin: 0 0 16px; color: #4b5563;">${expiryText}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #6b7280;">License</td><td style="padding: 6px 0; font-weight: 600;">${licenseName}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">License No.</td><td style="padding: 6px 0;">${licenseNumber}</td></tr>
        ${siteName ? `<tr><td style="padding: 6px 0; color: #6b7280;">Site</td><td style="padding: 6px 0;">${siteName}</td></tr>` : ''}
        <tr><td style="padding: 6px 0; color: #6b7280;">Expiry</td><td style="padding: 6px 0;">${expiryDate.toLocaleDateString()}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
        Please review and renew this license to keep your records and operations compliant.
      </p>
      <p style="margin-top: 8px; font-size: 12px; color: #9ca3af;">ReconSMI License Compliance Alerts</p>
    </div>
  `;
}

interface ScanResult {
  sent: boolean;
  reason?: string;
}

async function notifyForLicense(
  license: {
    id: string;
    name: string;
    licenseNumber: string;
    expiryDate: Date | null;
    siteId: string | null;
    site?: { id: string; name: string; contractorId: string; contractor: { id: string; userId: string } } | null;
  },
  tier: 'expired' | '30' | '14' | '7',
): Promise<ScanResult> {
  if (!license.expiryDate) return { sent: false, reason: 'no expiry date' };
  if (!license.site || !license.site.contractor) return { sent: false, reason: 'no contractor owner' };

  const now = new Date();
  const link = `/contractor/licenses/edit/${license.id}`;

  // De-dupe: each tier fires at most once per license. Skip if a notification
  // for this exact tier already exists.
  const tierTag = `[${tier}]`;
  const existing = await prisma.notification.findFirst({
    where: {
      type: 'license',
      link,
      message: { contains: tierTag },
    },
    select: { id: true },
  });
  if (existing) return { sent: false, reason: 'already notified for this tier' };

  const daysUntilExpiry = daysBetween(now, license.expiryDate);
  const isExpired = daysUntilExpiry < 0;
  const expiryPhrase = isExpired
    ? `expired on ${license.expiryDate.toLocaleDateString()}`
    : `expires ${formatExpiry(daysUntilExpiry)} (${license.expiryDate.toLocaleDateString()})`;

  const title = isExpired
    ? `License expired: ${license.name} ${tierTag}`
    : `License expiring soon: ${license.name} ${tierTag}`;
  const message = `License "${license.name}" (${license.licenseNumber})${license.site ? ` at site "${license.site.name}"` : ''} ${expiryPhrase}. Please take action. ${tierTag}`;
  const html = buildEmailHtml(license.name, license.licenseNumber, license.site.name, license.expiryDate, daysUntilExpiry, isExpired);

  await NotificationService.send({
    userId: license.site.contractor.userId,
    contractorId: license.site.contractorId,
    title,
    message,
    type: 'license',
    link,
    html,
  });

  return { sent: true };
}

export class LicenseExpiryService {
  /**
   * Scans all licenses for expiry state and fires in-app + email alerts.
   * Safe to run repeatedly (de-dupes per tier within RE_NOTIFY_WINDOW_HOURS).
   */
  static async run(): Promise<LicenseExpiryResult> {
    const result: LicenseExpiryResult = {
      scanned: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    const now = new Date();
    const horizonDays = Math.max(...EXPIRY_WARNING_DAYS);
    const horizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    const licenses = await prisma.license.findMany({
      where: {
        expiryDate: { lte: horizon },
      },
      include: {
        site: {
          include: {
            contractor: { select: { id: true, userId: true } },
          },
        },
      },
    });

    result.scanned = licenses.length;

    for (const license of licenses) {
      if (!license.expiryDate) {
        result.skipped++;
        result.details.push({ licenseId: license.id, licenseName: license.name, tier: '-', sent: false, reason: 'no expiry' });
        continue;
      }

      const daysUntilExpiry = daysBetween(now, license.expiryDate);
      let tier: 'expired' | '30' | '14' | '7' | null = null;
      if (daysUntilExpiry < 0) {
        tier = 'expired';
      } else {
        // Pick the smallest warning threshold that has not yet been crossed,
        // i.e. the closest upcoming tier. Each tier fires at most once
        // (notifyForLicense de-dupes by tier tag on the notification).
        const candidates = EXPIRY_WARNING_DAYS.filter(d => daysUntilExpiry <= d);
        if (candidates.length > 0) {
          tier = String(Math.min(...candidates)) as '30' | '14' | '7';
        }
      }

      if (!tier) {
        result.skipped++;
        continue;
      }

      try {
        const res = await notifyForLicense(license, tier);
        if (res.sent) {
          result.notified++;
        } else {
          result.skipped++;
        }
        result.details.push({ licenseId: license.id, licenseName: license.name, tier, sent: res.sent, reason: res.reason });
      } catch (err) {
        result.errors++;
        result.details.push({ licenseId: license.id, licenseName: license.name, tier, sent: false, reason: err instanceof Error ? err.message : 'error' });
      }
    }

    return result;
  }

  /**
   * Inspect a single license and fire an immediate alert if it is already
   * expired or within EXPIRY_WARNING_DAYS of expiring. Used when a license is
   * created or updated.
   */
  static async checkOne(licenseId: string): Promise<ScanResult> {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        site: {
          include: {
            contractor: { select: { id: true, userId: true } },
          },
        },
      },
    });
    if (!license) return { sent: false, reason: 'not found' };
    if (!license.expiryDate) return { sent: false, reason: 'no expiry date' };

    const now = new Date();
    const daysUntilExpiry = daysBetween(now, license.expiryDate);

    if (daysUntilExpiry < 0) {
      return notifyForLicense(license as any, 'expired');
    }
    for (const d of EXPIRY_WARNING_DAYS) {
      if (daysUntilExpiry <= d) {
        return notifyForLicense(license as any, String(d) as '30' | '14' | '7');
      }
    }
    return { sent: false, reason: 'not yet within warning window' };
  }
}