import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { handleBankIPN } from '@/lib/bank-service';

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
  const receivedAt = new Date();
  const source = detectSource(req);

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

    // ----------------------------------------------------------
    // 1. Persist the raw IPN payload to a daily log file
    // ----------------------------------------------------------
    const ipnPayload = {
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      contentType,
      body: parsedBody,
      receivedAt: receivedAt.toISOString(),
      source,
    };

    const header = `==== ${receivedAt.toISOString()} | source=${source} ====\n`;
    const logLine = header + JSON.stringify(ipnPayload, null, 2) + '\n\n';

    try {
      const logFile = dailyLogFile(receivedAt);
      await mkdir(dirname(logFile), { recursive: true });
      await appendFile(logFile, logLine, 'utf8');
    } catch (logError) {
      console.error('Bank payment IPN log write error:', logError);
    }

    // ----------------------------------------------------------
    // 2. Process the payment (only when we have a JSON object
    //    with the expected bank IPN fields)
    // ----------------------------------------------------------
    let processingResult: { processed: boolean; result?: any; error?: string } = {
      processed: false,
    };

    if (
      parsedBody &&
      typeof parsedBody === 'object' &&
      !Array.isArray(parsedBody) &&
      'TransactionId' in (parsedBody as Record<string, unknown>)
    ) {
      try {
        const result = await handleBankIPN(parsedBody);
        processingResult = { processed: true, result };
        console.log('Bank payment IPN processed:', JSON.stringify(result));
      } catch (processingError: any) {
        console.error('Bank payment IPN processing error:', processingError);
        processingResult = { processed: true, error: processingError.message };
      }
    } else {
      console.log('Bank payment IPN received and logged (no payment processing – not a bank transaction payload)');
    }

    // ----------------------------------------------------------
    // 3. Always acknowledge to the bank to prevent retries
    // ----------------------------------------------------------
    return NextResponse.json({
      status: 'received',
      message: 'Bank payment IPN processed successfully',
      transactionId: (parsedBody as any)?.TransactionId || undefined,
      processing: processingResult,
    });
  } catch (error: any) {
    console.error('Bank payment IPN error:', error);

    // Still try to log the error to the daily file
    try {
      const errorLog =
        `==== ${receivedAt.toISOString()} | source=${source} | ERROR ====\n` +
        `${error?.stack || error?.message || String(error)}\n\n`;
      const logFile = dailyLogFile(receivedAt);
      await mkdir(dirname(logFile), { recursive: true });
      await appendFile(logFile, errorLog, 'utf8');
    } catch {
      // best-effort
    }

    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 },
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