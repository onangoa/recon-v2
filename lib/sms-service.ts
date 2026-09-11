/**
 * SMS gateway service — Celcom Africa ISMS
 * (POST /api/services/sendsms/).
 *
 * Configuration is read from env:
 *  - SMS_PARTNER_ID   e.g. 1559
 *  - SMS_API_KEY      e.g. f156f77870ebaf2
 *  - SMS_SHORTCODE    e.g. RDEMOI
 *  - SMS_API_BASE_URL optional, defaults to https://isms.celcomafrica.com
 */

const DEFAULT_SMS_API_BASE_URL = 'https://isms.celcomafrica.com';

interface SmsConfig {
  partnerId: string;
  apiKey: string;
  shortcode: string;
  baseUrl: string;
}

export interface SmsSendResult {
  mobile: string;
  success: boolean;
  code?: string;
  status?: string;
  description?: string;
  messageId?: string;
}

export interface SendSmsResponse {
  success: boolean;
  results: SmsSendResult[];
}

interface CelcomResponseItem {
  rescode?: string | number;
  'response-status'?: string;
  'response-description'?: string;
  mobile?: string;
  messageid?: string;
  [key: string]: unknown;
}

interface CelcomSendResponse {
  responses?: CelcomResponseItem[];
  [key: string]: unknown;
}

function getSmsConfig(): SmsConfig {
  const partnerId = process.env.SMS_PARTNER_ID || '';
  const apiKey = process.env.SMS_API_KEY || '';
  const shortcode = process.env.SMS_SHORTCODE || '';
  const baseUrl = (process.env.SMS_API_BASE_URL || DEFAULT_SMS_API_BASE_URL).replace(/\/+$/, '');

  if (!partnerId || !apiKey || !shortcode) {
    throw new Error(
      'SMS gateway is not configured. Set SMS_PARTNER_ID, SMS_API_KEY and SMS_SHORTCODE in your environment.'
    );
  }

  return { partnerId, apiKey, shortcode, baseUrl };
}

/** Normalize a Kenyan mobile number to the 2547XXXXXXXX / 2541XXXXXXXX format
 *  required by the gateway. Accepts 07.., +2547.., 2547.. and 7.. forms.
 *  Numbers (e.g. Daraja callback metadata phones) are coerced to strings. */
export function normalizeKenyanMobile(input: string | number): string {
  const digits = String(input).replace(/[\s\-()+]/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  throw new Error(`Invalid Kenyan mobile number: ${input}`);
}

/** Send an SMS to one or many mobile numbers (comma-separated string or
 *  array; numeric values, e.g. from payment callbacks, are coerced). */
export async function sendSms(
  mobile: string | number | (string | number)[],
  message: string
): Promise<SendSmsResponse> {
  const config = getSmsConfig();

  const recipients = (Array.isArray(mobile) ? mobile.map(String) : String(mobile).split(','))
    .map((m) => m.trim())
    .filter(Boolean)
    .map(normalizeKenyanMobile);

  if (recipients.length === 0) {
    throw new Error('No mobile number(s) provided.');
  }

  if (!message.trim()) {
    throw new Error('Message body is empty.');
  }

  console.log(`[SMS] OUT -> to=${recipients.join(',')} from=${config.shortcode}: ${message}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/api/services/sendsms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerID: config.partnerId,
        apikey: config.apiKey,
        mobile: recipients.join(','),
        message,
        shortcode: config.shortcode,
        pass_type: 'plain',
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SMS gateway error (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as CelcomSendResponse;
  const items = json.responses || [];

  const results: SmsSendResult[] = recipients.map((dest, i) => {
    const item = items[i];
    const code = item?.rescode !== undefined ? String(item.rescode) : undefined;
    return {
      mobile: item?.mobile || dest,
      success: code === '200',
      code,
      status: item?.['response-status'],
      description: item?.['response-description'],
      messageId: item?.messageid,
    };
  });

  for (const r of results) {
    console.log(
      `[SMS] RESULT ${r.success ? 'OK' : 'FAIL'} to=${r.mobile} code=${r.code ?? 'n/a'}` +
        `${r.status ? ` status=${r.status}` : ''}${r.description ? ` desc="${r.description}"` : ''}` +
        `${r.messageId ? ` id=${r.messageId}` : ''}`
    );
  }

  return { success: results.every((r) => r.success), results };
}

/** Never-throwing variant for fire-and-forget notifications. */
export async function sendSmsSafe(
  mobile: string | number | (string | number)[],
  message: string
): Promise<SendSmsResponse & { error?: string }> {
  try {
    return await sendSms(mobile, message);
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}
