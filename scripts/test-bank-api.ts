/**
 * Co-op Bank OpenAPI integration test runner.
 *
 * Tests every endpoint defined in RECON ENGINEERING.postman_collection.json:
 *   1. Generate Token            POST /token
 *   2. Account Validation        POST /Enquiry/Validation/IPSL/1.0.0/
 *   3. PesaLink Send to Account  POST /FundsTransfer/External/A2A/PesaLink_v2/2.0.0/
 *   4. IFT Send to Account       POST /FundsTransfer/Internal/A2A_v3/3.0.0
 *   5. B2C M-Pesa                POST /FundsTransfer/External/A2M/Mpesa_v2/2.0.0
 *   6. Transaction Status Check  POST /Enquiry/TransactionStatus_V3/3.0.0/
 *   7. Account Balance           POST /Enquiry/AccountBalance_v2/2.0.0/
 *   8. Account Mini-statement    POST /Enquiry/MiniStatement/Account_v2/2.0.0/
 *   9. Account Statement         POST /Enquiry/AccountFullStatementPaginated/1.0.0/
 *
 * It logs the full request payload, response status, response body, errors and
 * timing for every call, writes a timestamped log file, and prints a summary.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 *   tsx scripts/test-bank-api.ts                 # safe mode (no real transfers)
 *   tsx scripts/test-bank-api.ts --live          # execute real funds transfers
 *   tsx scripts/test-bank-api.ts --only token,balance   # run a subset
 *   tsx scripts/test-bank-api.ts --skip transfer.*      # skip by pattern
 *   tsx scripts/test-bank-api.ts --account 01192588813000 --user RECON
 *   tsx scripts/test-bank-api.ts --interactive --live   # prompt for values, then transfer
 *
 * ENV VARS (override defaults from the Postman collection)
 *   COOP_BANK_BASE_URL        default https://openapi.co-opbank.co.ke
 *   COOP_BANK_CONSUMER_KEY
 *   COOP_BANK_CONSUMER_SECRET
 *   COOP_BANK_USER_ID         default RECON
 *   COOP_BANK_SOURCE_ACCOUNT  default 01192588813000
 *   COOP_BANK_CALLBACK_URL    default https://yourdomain.com/web/api/callbacks/bank/funds-transfer
 *   COOP_BANK_TEST_ACCOUNT    destination account for transfers (default 01102789645002)
 *   COOP_BANK_TEST_BANK_CODE  default 11
 *   COOP_BANK_TEST_MOBILE     default 254707919065
 *   COOP_BANK_TEST_AMOUNT     transfer amount in KES (default 100)
 * ---------------------------------------------------------------------------
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// ============================================================================
// Configuration
// ============================================================================
const BASE_URL = (process.env.COOP_BANK_BASE_URL || 'https://openapi.co-opbank.co.ke').replace(/\/$/, '');

// Default credentials extracted from the Postman collection Basic auth header.
// Override these with your own via env vars before going live.

const AUTH_KEY = "MFZPeWMwWFpFdFdncTFRaFQyanBVWUZhQ0cwYTpBTlhmMklXSFk2Ym9idURXYWZGdHl2ZGJHd0Fh";
const USER_ID = 'RECON';
const SOURCE_ACCOUNT = '01192588813000';
let CALLBACK_URL = 'https://reconsmi.com/v1/ext/ipn';
let TEST_DEST_ACCOUNT = '01100006870001';
let TEST_BANK_CODE = '11';
let TEST_MOBILE = '254796504484';
let AMOUNT = 50;

// CLI flags
const args = process.argv.slice(2);
let LIVE_MODE = args.includes('--live');
const INTERACTIVE = args.includes('--interactive') || args.includes('-i');
const ONLY = parseListFlag('--only');
const SKIP = parseListFlag('--skip');
const cliAccount = parseValueFlag('--account');
const cliUser = parseValueFlag('--user');
if (cliAccount) process.env.COOP_BANK_SOURCE_ACCOUNT_OVERRIDE = cliAccount;
if (cliUser) process.env.COOP_BANK_USER_ID_OVERRIDE = cliUser;

let ACCOUNT = cliAccount || SOURCE_ACCOUNT;
let USER = cliUser || USER_ID;

// ============================================================================
// Logging
// ============================================================================
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, 'logs');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = join(LOG_DIR, `bank-api-test-${stamp}.log`);

type LogLevel = 'INFO' | 'REQ' | 'RES' | 'ERR' | 'OK' | 'WARN' | 'SEP';
const COLORS: Record<LogLevel, string> = {
  INFO: '\x1b[36m',
  REQ: '\x1b[34m',
  RES: '\x1b[35m',
  ERR: '\x1b[31m',
  OK: '\x1b[32m',
  WARN: '\x1b[33m',
  SEP: '\x1b[90m',
};
const RESET = '\x1b[0m';

const logLines: string[] = [];

function log(level: LogLevel, msg: string, data?: unknown) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.padEnd(4)} ${msg}`;
  const dataStr = data !== undefined ? '\n' + pretty(data) : '';
  logLines.push(line + dataStr);
  console.log(`${COLORS[level]}${level.padEnd(4)}${RESET} ${msg}${dataStr ? COLORS[level] + dataStr + RESET : ''}`);
}

function pretty(data: unknown): string {
  if (typeof data === 'string') {
    try { return JSON.stringify(JSON.parse(data), null, 2); } catch { return data; }
  }
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}

function sep(title: string) {
  const bar = '═'.repeat(Math.max(60, title.length + 4));
  log('SEP', '');
  console.log(`${COLORS.SEP}${bar}${RESET}`);
  console.log(`${COLORS.SEP}  ${title}${RESET}`);
  console.log(`${COLORS.SEP}${bar}${RESET}`);
  logLines.push(`\n${bar}\n  ${title}\n${bar}`);
}

function flushLog() {
  writeFileSync(LOG_FILE, logLines.join('\n') + '\n');
}

// ============================================================================
// Result tracking
// ============================================================================
interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'skip';
  httpStatus?: number;
  durationMs?: number;
  error?: string;
  messageReference?: string;
}
const results: TestResult[] = [];

function record(r: TestResult) { results.push(r); }

// ============================================================================
// CLI helpers
// ============================================================================
function parseListFlag(flag: string): string[] {
  const idx = args.indexOf(flag);
  if (idx === -1) return [];
  const val = args[idx + 1];
  if (!val || val.startsWith('--')) return [];
  return val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function parseValueFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function shouldRun(key: string): boolean {
  const lk = key.toLowerCase();
  if (ONLY.length > 0 && !ONLY.some((o) => lk === o || lk.startsWith(o))) return false;
  if (SKIP.some((s) => lk === s || lk.startsWith(s))) return false;
  return true;
}

// ============================================================================
// Interactive prompts
// ============================================================================
const rl = readline.createInterface({ input, output });

async function ask(question: string, fallback?: string): Promise<string> {
  const suffix = fallback !== undefined && fallback !== '' ? ` [${fallback}]` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || (fallback ?? '');
}

async function promptForValues(): Promise<void> {
  sep('Interactive input');
  log('INFO', 'Press Enter to accept the default shown in brackets.');

  ACCOUNT = await ask('Source account number', ACCOUNT);
  USER = await ask('User ID', USER);

  if (shouldRun('transfer.pesalink') || shouldRun('transfer.ift')) {
    TEST_DEST_ACCOUNT = await ask('Destination account number (PesaLink / IFT)', TEST_DEST_ACCOUNT);
  }
  if (shouldRun('transfer.pesalink')) {
    TEST_BANK_CODE = await ask('Destination bank code (PesaLink)', TEST_BANK_CODE);
  }
  if (shouldRun('transfer.mpesa')) {
    TEST_MOBILE = await ask('Mobile number for B2C M-Pesa (e.g. 2547XXXXXXXX)', TEST_MOBILE);
  }

  const amtStr = await ask('Amount (KES)', String(AMOUNT));
  const parsed = Number(amtStr);
  if (!Number.isNaN(parsed) && parsed > 0) AMOUNT = parsed;
  else if (amtStr) log('WARN', `Invalid amount "${amtStr}" — keeping default ${AMOUNT}`);

  CALLBACK_URL = await ask('Callback URL', CALLBACK_URL);
}

// ============================================================================
// HTTP client
// ============================================================================
function basicAuthHeader(): string {
  return 'Basic ' + AUTH_KEY;
}

let cachedToken: string | null = null;

interface CallOptions {
  method: string;
  path: string;
  body?: unknown;
  auth?: 'basic' | 'bearer' | 'none';
  contentType?: string;
  label: string;
  key: string;
}

interface CallOutcome {
  ok: boolean;
  httpStatus: number;
  statusText: string;
  body: any;
  rawText: string;
  durationMs: number;
  error?: string;
}

async function callBank(opts: CallOptions): Promise<CallOutcome> {
  const url = opts.path.endsWith('/') || opts.path === '/token'
    ? `${BASE_URL}${opts.path}`
    : `${BASE_URL}${opts.path}`;

  const headers: Record<string, string> = {};
  if (opts.auth === 'basic') headers['Authorization'] = basicAuthHeader();
  else if (opts.auth === 'bearer') headers['Authorization'] = `Bearer ${cachedToken}`;
  headers['Content-Type'] = opts.contentType || 'application/json';

  const start = Date.now();
  log('REQ', `${opts.method} ${url}`);
  log('REQ', 'Headers', redactHeaders(headers));
  if (opts.body !== undefined) log('REQ', 'Request body', opts.body);

  try {
    const response = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? (opts.contentType === 'application/x-www-form-urlencoded'
        ? String(opts.body)
        : JSON.stringify(opts.body)) : undefined,
    });

    const rawText = await response.text();
    const durationMs = Date.now() - start;

    let parsed: any = null;
    try { parsed = rawText ? JSON.parse(rawText) : null; } catch { parsed = { rawResponse: rawText }; }

    log('RES', `HTTP ${response.status} ${response.statusText}  (${durationMs}ms)`);
    log('RES', 'Response body', parsed);

    return {
      ok: response.ok,
      httpStatus: response.status,
      statusText: response.statusText,
      body: parsed,
      rawText,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    log('ERR', `Network/transport error after ${durationMs}ms: ${error}`);
    if (err?.cause) log('ERR', 'Underlying cause', { code: err.cause.code, message: err.cause.message });
    return {
      ok: false,
      httpStatus: 0,
      statusText: 'NETWORK_ERROR',
      body: null,
      rawText: '',
      durationMs,
      error,
    };
  }
}

function redactHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === 'authorization') {
      out[k] = v.length > 20 ? `${v.slice(0, 14)}…<redacted (${v.length} chars)>` : '<redacted>';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function genRef(): string {
  return Math.random().toString(16).slice(2, 12) + Date.now().toString(16).slice(-4);
}

// ============================================================================
// Endpoint tests
// ============================================================================

// 1. Generate Token
async function testGenerateToken(): Promise<boolean> {
  sep('1. Generate Token  —  POST /token');
  const key = 'token';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Generate Token', endpoint: '/token', method: 'POST', status: 'skip' }); return false; }

  const out = await callBank({
    method: 'POST',
    path: '/token',
    auth: 'basic',
    contentType: 'application/x-www-form-urlencoded',
    body: 'grant_type=client_credentials',
    label: 'Generate Token',
    key,
  });

  const token = out.body?.access_token;
  if (out.ok && token) {
    cachedToken = token;
    const expiresIn = out.body?.expires_in;
    log('OK', `Token acquired. expires_in=${expiresIn}s`);
    record({ name: 'Generate Token', endpoint: '/token', method: 'POST', status: 'pass', httpStatus: out.httpStatus, durationMs: out.durationMs });
    return true;
  }
  log('ERR', `Token generation failed: ${out.error || out.statusText}`);
  record({ name: 'Generate Token', endpoint: '/token', method: 'POST', status: 'fail', httpStatus: out.httpStatus, durationMs: out.durationMs, error: out.error || out.statusText });
  return false;
}

// 2. Account Validation
async function testAccountValidation(): Promise<void> {
  sep('2. Account Validation  —  POST /Enquiry/Validation/IPSL/1.0.0/');
  const key = 'validate';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Account Validation', endpoint: '/Enquiry/Validation/IPSL/1.0.0/', method: 'POST', status: 'skip' }); return; }
  if (!requireToken()) return;

  const messageReference = genRef();
  const body = {
    MessageReference: messageReference,
    UserId: USER,
    AccountNumber: ACCOUNT,
    RecipientBankIdentifier: '0011',
  };

  const out = await callBank({ method: 'POST', path: '/Enquiry/Validation/IPSL/1.0.0/', auth: 'bearer', body, label: 'Account Validation', key });

  recordResult('Account Validation', '/Enquiry/Validation/IPSL/1.0.0/', out, messageReference);
}

// 3. PesaLink Send to Account
async function testPesalinkSend(): Promise<string | null> {
  sep('3. PesaLink Send to Account  —  POST /FundsTransfer/External/A2A/PesaLink_v2/2.0.0/');
  const key = 'transfer.pesalink';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'PesaLink Send', endpoint: '/FundsTransfer/External/A2A/PesaLink_v2/2.0.0/', method: 'POST', status: 'skip' }); return null; }
  if (!requireToken()) return null;

  if (!LIVE_MODE) {
    log('WARN', 'DRY RUN — pass --live to execute a real PesaLink transfer. Skipping actual submission.');
    record({ name: 'PesaLink Send', endpoint: '/FundsTransfer/External/A2A/PesaLink_v2/2.0.0/', method: 'POST', status: 'skip', error: 'dry-run' });
    return null;
  }

  const messageReference = genRef();
  const amount = AMOUNT;
  const body = {
    MessageReference: messageReference,
    UserId: USER,
    CallBackUrl: CALLBACK_URL,
    ISO2CountryCode: 'KE',
    Source: {
      AccountNumber: ACCOUNT,
      Amount: amount,
      TransactionCurrency: 'KES',
      Narration: 'RECONSMI TEST PESALINK',
    },
    Destinations: [
      {
        ReferenceNumber: `${messageReference}_1`,
        AccountNumber: TEST_DEST_ACCOUNT,
        BankCode: TEST_BANK_CODE,
        Amount: String(amount),
        TransactionCurrency: 'KES',
        Narration: 'RECONSMI TEST PESALINK',
      },
    ],
  };

  log('WARN', `Submitting REAL transfer: KES ${amount} from ${ACCOUNT} to ${TEST_DEST_ACCOUNT} (bank ${TEST_BANK_CODE})`);
  const out = await callBank({ method: 'POST', path: '/FundsTransfer/External/A2A/PesaLink_v2/2.0.0/', auth: 'bearer', body, label: 'PesaLink Send', key });
  recordResult('PesaLink Send', '/FundsTransfer/External/A2A/PesaLink_v2/2.0.0/', out, messageReference);
  return messageReference;
}

// 4. IFT Send to Account
async function testIftSend(): Promise<string | null> {
  sep('4. IFT Send to Account  —  POST /FundsTransfer/Internal/A2A_v3/3.0.0');
  const key = 'transfer.ift';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'IFT Send', endpoint: '/FundsTransfer/Internal/A2A_v3/3.0.0', method: 'POST', status: 'skip' }); return null; }
  if (!requireToken()) return null;

  if (!LIVE_MODE) {
    log('WARN', 'DRY RUN — pass --live to execute a real IFT transfer. Skipping actual submission.');
    record({ name: 'IFT Send', endpoint: '/FundsTransfer/Internal/A2A_v3/3.0.0', method: 'POST', status: 'skip', error: 'dry-run' });
    return null;
  }

  const messageReference = genRef();
  const amount = AMOUNT;
  const body = {
    MessageReference: messageReference,
    UserId: USER,
    ISO2CountryCode: 'KE',
    CallBackUrl: CALLBACK_URL,
    Source: {
      AccountNumber: ACCOUNT,
      Amount: amount,
      TransactionCurrency: 'KES',
      Narration: 'RECONSMI TEST IFT',
    },
    Destinations: [
      {
        ReferenceNumber: `${messageReference}_1`,
        AccountNumber: TEST_DEST_ACCOUNT,
        Amount: amount,
        TransactionCurrency: 'KES',
        Narration: 'RECONSMI TEST IFT',
      },
    ],
  };

  log('WARN', `Submitting REAL IFT: KES ${amount} from ${ACCOUNT} to ${TEST_DEST_ACCOUNT}`);
  const out = await callBank({ method: 'POST', path: '/FundsTransfer/Internal/A2A_v3/3.0.0', auth: 'bearer', body, label: 'IFT Send', key });
  recordResult('IFT Send', '/FundsTransfer/Internal/A2A_v3/3.0.0', out, messageReference);
  return messageReference;
}

// 5. B2C M-Pesa
async function testB2CMpesa(): Promise<string | null> {
  sep('5. B2C M-Pesa  —  POST /FundsTransfer/External/A2M/Mpesa_v2/2.0.0');
  const key = 'transfer.mpesa';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'B2C M-Pesa', endpoint: '/FundsTransfer/External/A2M/Mpesa_v2/2.0.0', method: 'POST', status: 'skip' }); return null; }
  if (!requireToken()) return null;

  if (!LIVE_MODE) {
    log('WARN', 'DRY RUN — pass --live to execute a real B2C M-Pesa transfer. Skipping actual submission.');
    record({ name: 'B2C M-Pesa', endpoint: '/FundsTransfer/External/A2M/Mpesa_v2/2.0.0', method: 'POST', status: 'skip', error: 'dry-run' });
    return null;
  }

  const messageReference = genRef();
  const amount = AMOUNT;
  const body = {
    MessageReference: messageReference,
    UserId: USER,
    ISO2CountryCode: 'KE',
    CallBackUrl: CALLBACK_URL,
    Source: {
      AccountNumber: ACCOUNT,
      Amount: String(amount),
      TransactionCurrency: 'KES',
      Narration: 'RECONSMI TEST B2C MPESA',
    },
    Destinations: [
      {
        ReferenceNumber: `${messageReference}_1`,
        MobileNumber: TEST_MOBILE,
        Amount: String(amount),
        Narration: 'RECONSMI TEST B2C MPESA',
      },
    ],
  };

  log('WARN', `Submitting REAL B2C M-Pesa: KES ${amount} from ${ACCOUNT} to ${TEST_MOBILE}`);
  const out = await callBank({ method: 'POST', path: '/FundsTransfer/External/A2M/Mpesa_v2/2.0.0', auth: 'bearer', body, label: 'B2C M-Pesa', key });
  recordResult('B2C M-Pesa', '/FundsTransfer/External/A2M/Mpesa_v2/2.0.0', out, messageReference);
  return messageReference;
}

// 6. Transaction Status Check
async function testTransactionStatus(messageReference?: string): Promise<void> {
  sep('6. Transaction Status Check  —  POST /Enquiry/TransactionStatus_V3/3.0.0/');
  const key = 'transaction-status';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Transaction Status', endpoint: '/Enquiry/TransactionStatus_V3/3.0.0/', method: 'POST', status: 'skip' }); return; }
  if (!requireToken()) return;

  const ref = messageReference || genRef();
  const body = { MessageReference: ref, UserId: USER };
  if (!messageReference) log('INFO', `No transfer ref supplied — using synthetic ref ${ref} (expect a "not found" style response)`);

  const out = await callBank({ method: 'POST', path: '/Enquiry/TransactionStatus_V3/3.0.0/', auth: 'bearer', body, label: 'Transaction Status', key });
  recordResult('Transaction Status', '/Enquiry/TransactionStatus_V3/3.0.0/', out, ref);
}

// 7. Account Balance
async function testAccountBalance(): Promise<void> {
  sep('7. Account Balance  —  POST /Enquiry/AccountBalance_v2/2.0.0/');
  const key = 'balance';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Account Balance', endpoint: '/Enquiry/AccountBalance_v2/2.0.0/', method: 'POST', status: 'skip' }); return; }
  if (!requireToken()) return;

  const messageReference = genRef();
  const body = { MessageReference: messageReference, UserId: USER, AccountNumber: ACCOUNT };

  const out = await callBank({ method: 'POST', path: '/Enquiry/AccountBalance_v2/2.0.0/', auth: 'bearer', body, label: 'Account Balance', key });
  recordResult('Account Balance', '/Enquiry/AccountBalance_v2/2.0.0/', out, messageReference);
}

// 8. Account Mini-statement
async function testMiniStatement(): Promise<void> {
  sep('8. Account Mini-statement  —  POST /Enquiry/MiniStatement/Account_v2/2.0.0/');
  const key = 'statement.mini';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Mini Statement', endpoint: '/Enquiry/MiniStatement/Account_v2/2.0.0/', method: 'POST', status: 'skip' }); return; }
  if (!requireToken()) return;

  const messageReference = genRef();
  const body = { MessageReference: messageReference, AccountNumber: ACCOUNT };

  const out = await callBank({ method: 'POST', path: '/Enquiry/MiniStatement/Account_v2/2.0.0/', auth: 'bearer', body, label: 'Mini Statement', key });
  recordResult('Mini Statement', '/Enquiry/MiniStatement/Account_v2/2.0.0/', out, messageReference);
}

// 9. Account Statement (paginated)
async function testFullStatement(): Promise<void> {
  sep('9. Account Statement  —  POST /Enquiry/AccountFullStatementPaginated/1.0.0/');
  const key = 'statement.full';
  if (!shouldRun(key)) { log('WARN', 'Skipped by filter'); record({ name: 'Account Statement', endpoint: '/Enquiry/AccountFullStatementPaginated/1.0.0/', method: 'POST', status: 'skip' }); return; }
  if (!requireToken()) return;

  const messageReference = genRef();
  const end = new Date();
  const start = new Date(end.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const body = {
    MessageReference: messageReference,
    UserId: USER,
    ISO2CountryCode: 'KE',
    AccountNumber: ACCOUNT,
    StartDate: fmt(start),
    EndDate: fmt(end),
  };

  const out = await callBank({ method: 'POST', path: '/Enquiry/AccountFullStatementPaginated/1.0.0/', auth: 'bearer', body, label: 'Account Statement', key });
  recordResult('Account Statement', '/Enquiry/AccountFullStatementPaginated/1.0.0/', out, messageReference);
}

// ============================================================================
// Helpers
// ============================================================================
function requireToken(): boolean {
  if (cachedToken) return true;
  log('ERR', 'No bearer token available — token generation failed or was skipped. Aborting.');
  record({ name: 'Bearer-required test', endpoint: '-', method: 'POST', status: 'fail', error: 'no token' });
  return false;
}

function recordResult(name: string, endpoint: string, out: CallOutcome, messageReference?: string) {
  if (out.ok) {
    log('OK', `${name} completed (HTTP ${out.httpStatus})`);
    record({ name, endpoint, method: 'POST', status: 'pass', httpStatus: out.httpStatus, durationMs: out.durationMs, messageReference });
  } else {
    const errMsg = out.error || (out.body?.fault?.message) || (out.body?.ErrorDescription) || (out.body?.message) || out.statusText;
    log('ERR', `${name} failed (HTTP ${out.httpStatus}): ${errMsg}`);
    if (out.body) log('ERR', 'Error payload', out.body);
    record({ name, endpoint, method: 'POST', status: 'fail', httpStatus: out.httpStatus, durationMs: out.durationMs, error: errMsg, messageReference });
  }
}

function printSummary() {
  sep('SUMMARY');
  const pass = results.filter((r) => r.status === 'pass').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  const skip = results.filter((r) => r.status === 'skip').length;

  const rows = results.map((r) => ({
    Endpoint: r.name,
    Status: r.status.toUpperCase(),
    HTTP: r.httpStatus ?? '-',
    'Time(ms)': r.durationMs ?? '-',
    Ref: r.messageReference ?? '-',
    Error: r.error ?? '',
  }));

  console.table(rows);
  log('INFO', `Totals → pass=${pass}  fail=${fail}  skip=${skip}  (mode=${LIVE_MODE ? 'LIVE' : 'DRY-RUN'})`);
  log('INFO', `Log file written to: ${LOG_FILE}`);
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  if (INTERACTIVE) await promptForValues();

  sep('Co-op Bank OpenAPI — Integration Test Runner');
  log('INFO', `Base URL   : ${BASE_URL}`);
  log('INFO', `Mode       : ${LIVE_MODE ? 'LIVE (real transfers WILL be submitted)' : 'DRY-RUN (transfers skipped)'}`);
  log('INFO', `Interactive: ${INTERACTIVE ? 'ON (values prompted)' : 'off'}`);
  log('INFO', `User ID    : ${USER}`);
  log('INFO', `Account    : ${ACCOUNT}`);
  log('INFO', `Dest Acct  : ${TEST_DEST_ACCOUNT} (bank ${TEST_BANK_CODE})`);
  log('INFO', `Mobile     : ${TEST_MOBILE}`);
  log('INFO', `Amount     : KES ${AMOUNT}`);
  log('INFO', `Callback   : ${CALLBACK_URL}`);
  log('INFO', `AUTH_KEY   : ${AUTH_KEY.slice(0, 6)}…<redacted>`);
  log('INFO', `Filters    : only=${ONLY.length ? ONLY.join(',') : 'all'}  skip=${SKIP.length ? SKIP.join(',') : 'none'}`);

  if (INTERACTIVE && LIVE_MODE) {
    const confirmed = await ask(`Confirm: submit REAL transfers of KES ${AMOUNT}? (type yes to proceed)`, 'no');
    if (confirmed.toLowerCase() !== 'yes') {
      log('WARN', 'Cancelled — downgrading to DRY-RUN.');
      LIVE_MODE = false;
    }
  }
  rl.close();

  // 1. Token (required first)
  const gotToken = await testGenerateToken();

  // 2. Account validation
  await testAccountValidation();

  // 3-5. Funds transfers (collect a message reference for the status check)
  let transferRef: string | null = null;
  transferRef = (await testPesalinkSend()) || transferRef;
  transferRef = (await testIftSend()) || transferRef;
  transferRef = (await testB2CMpesa()) || transferRef;

  // 6. Transaction status (use the latest transfer ref if we have one)
  await testTransactionStatus(transferRef || undefined);

  // 7. Account balance
  await testAccountBalance();

  // 8. Mini statement
  await testMiniStatement();

  // 9. Full statement
  await testFullStatement();

  printSummary();
  flushLog();

  const fail = results.filter((r) => r.status === 'fail').length;
  process.exitCode = fail > 0 ? 1 : 0;
  if (fail > 0) log('WARN', `${fail} test(s) failed — review the log file and error payloads above.`);
  if (!gotToken) log('WARN', 'Token generation failed; all bearer tests would have been skipped or failed. Check COOP_BANK_CONSUMER_KEY/SECRET.');
}

main().catch((err) => {
  log('ERR', 'Fatal runner error: ' + (err?.message || err));
  flushLog();
  process.exitCode = 2;
});