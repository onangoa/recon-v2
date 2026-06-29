import { NextRequest, NextResponse } from 'next/server';

const BANK_IPN_WEBHOOK_URL =
  process.env.BANK_IPN_WEBHOOK_URL ||
  'https://webhook.site/726a1ee2-7300-46e6-bad5-145b6c6138d8';

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

    const ipnPayload = {
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      contentType,
      body: parsedBody,
      receivedAt: new Date().toISOString(),
    };

    console.log(
      'Bank payment IPN received:',
      JSON.stringify(ipnPayload, null, 2)
    );

    try {
      const forwardResponse = await fetch(BANK_IPN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ipnPayload),
      });

      if (!forwardResponse.ok) {
        console.error(
          'Bank payment IPN webhook forward failed:',
          forwardResponse.status,
          forwardResponse.statusText
        );
      }
    } catch (forwardError) {
      console.error('Bank payment IPN webhook forward error:', forwardError);
    }

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
