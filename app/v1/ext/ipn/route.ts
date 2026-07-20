import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const runtime = 'nodejs';

const BANK_IPN_LOG_DIR =
  process.env.BANK_IPN_LOG_DIR || resolve(process.cwd(), 'logs');

function dailyLogFile(receivedAt: Date): string {
  const y = receivedAt.getUTCFullYear();
  const m = String(receivedAt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(receivedAt.getUTCDate()).padStart(2, '0');
  return resolve(BANK_IPN_LOG_DIR, `ipn-${y}-${m}-${d}.log`);
}

function detectSource(req: NextRequest): string {
  const url = new URL(req.url);
  return (
    url.searchParams.get('source') ||
    req.headers.get('x-ipn-source') ||
    req.headers.get('x-source') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const rawBody = await req.text();

    let parsedBody: unknown;
    if (contentType.includes('application/json')) {
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        parsedBody = rawBody;
      }
    } else {
      parsedBody = rawBody;
    }

    const receivedAt = new Date();
    const source = detectSource(req);

    const ipnPayload = {
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      contentType,
      body: parsedBody,
      receivedAt: receivedAt.toISOString(),
      source,
    };

    const header =
      `==== ${receivedAt.toISOString()} | source=${source} ====\n`;
    const logLine =
      header + JSON.stringify(ipnPayload, null, 2) + '\n\n';

    try {
      const logFile = dailyLogFile(receivedAt);
      await mkdir(dirname(logFile), { recursive: true });
      await appendFile(logFile, logLine, 'utf8');
    } catch (logError) {
      console.error('Bank payment IPN log write error:', logError);
    }

    console.log('Bank payment IPN received and logged to file');

    return NextResponse.json({
      status: 'received',
      message: 'Bank payment IPN processed successfully',
    });
  } catch (error: any) {
    console.error('Bank payment IPN error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log('Bank payment IPN GET request received:', req.url);
  return NextResponse.json({
    status: 'ok',
    message: 'Bank payment IPN endpoint is active',
  });
}
