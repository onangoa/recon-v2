/**
 * M-Pesa account operations CLI (working <-> utility).
 *
 * Commands:
 *   balance                                     Query working + utility account balances
 *                                              (Daraja AccountBalance API — the actual
 *                                              balances arrive via the result callback,
 *                                              so the app must be reachable at
 *                                              MPESA_ACCOUNT_BALANCE_RESULT_URL).
 *   transfer to-utility --amount N              BusinessTransferFromMMFToUtility
 *   transfer to-working --amount N              BusinessTransferFromUtilityToMMF
 *
 * Options:
 *   --amount N        Transfer amount in KES (required for transfer)
 *   --remarks TEXT    Remarks sent to M-Pesa (max 100 chars)
 *   --wallet ID       Record transactions against this wallet instead of the
 *                     system "M-Pesa Operating" wallet
 *   --wait SECONDS    How long to wait for the result callback (default 60, 0 = no wait)
 *   --yes, -y         Skip the confirmation prompt on transfers
 *
 * Examples:
 *   tsx scripts/mpesa-accounts.ts balance
 *   tsx scripts/mpesa-accounts.ts transfer to-utility --amount 5000
 *   tsx scripts/mpesa-accounts.ts transfer to-working --amount 2000 --yes --wait 0
 */
import * as readline from 'readline';
import { prisma } from '../lib/prisma';
import {
  checkAccountBalance,
  initiateWorkingToUtilityTransfer,
  initiateUtilityToWorkingTransfer,
  resolveMpesaSystemWallet,
} from '../lib/mpesa-service';

const POLL_INTERVAL_MS = 3000;

type CliOptions = {
  amount?: number;
  remarks?: string;
  walletId?: string;
  waitSeconds: number;
  yes: boolean;
};

const usage = () => {
  console.log(`
Usage:
  tsx scripts/mpesa-accounts.ts balance [--wait SECONDS] [--wallet ID]
  tsx scripts/mpesa-accounts.ts transfer <to-utility|to-working> --amount N
                                       [--remarks TEXT] [--wallet ID]
                                       [--wait SECONDS] [--yes]

Commands:
  balance           Query the working + utility M-Pesa account balances.
  transfer          Move funds between the org's own M-Pesa accounts:
                      to-utility  -> BusinessTransferFromMMFToUtility (working -> utility)
                      to-working  -> BusinessTransferFromUtilityToMMF  (utility -> working)

Options:
  --amount N        Transfer amount in KES (required for transfer)
  --remarks TEXT    Remarks sent to M-Pesa (max 100 chars)
  --wallet ID       Wallet to record the transaction against (default: system wallet)
  --wait SECONDS    Seconds to wait for the result callback (default 60, 0 = don't wait)
  --yes, -y         Skip the confirmation prompt on transfers
`);
};

const parseArgs = (args: string[]) => {
  const options: CliOptions = { waitSeconds: 60, yes: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--amount':
        options.amount = parseFloat(args[++i]);
        break;
      case '--remarks':
        options.remarks = args[++i];
        break;
      case '--wallet':
      case '--wallet-id':
        options.walletId = args[++i];
        break;
      case '--wait':
        options.waitSeconds = parseInt(args[++i]);
        break;
      case '--yes':
      case '-y':
        options.yes = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
};

const checkEnvironment = () => {
  const required = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_INITIATOR_NAME',
    'MPESA_INITIATOR_PASSWORD',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')} — check your .env file`
    );
  }
  console.log(`M-Pesa environment : ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
  console.log(`M-Pesa shortcode   : ${process.env.MPESA_SHORTCODE}`);
};

// Transactions need a wallet; use (or create) the shared system-level wallet
// for platform M-Pesa account operations (same one the superadmin page uses).
const resolveWalletId = async (walletIdOverride?: string): Promise<string> => {
  if (walletIdOverride) {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletIdOverride } });
    if (!wallet) throw new Error(`Wallet not found: ${walletIdOverride}`);
    console.log(`Recording against wallet: ${wallet.name} (${wallet.id})`);
    return wallet.id;
  }

  const wallet = await resolveMpesaSystemWallet();
  console.log(`Recording against wallet: ${wallet.name} (${wallet.id})`);
  return wallet.id;
};

const confirm = (question: string): Promise<boolean> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Poll a transaction row until the callback lands (or we stop waiting).
const waitForTransaction = async (transactionId: string, waitSeconds: number) => {
  if (!waitSeconds || waitSeconds <= 0) return null;
  const deadline = Date.now() + waitSeconds * 1000;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return null;
    if (tx.callbackReceivedAt || tx.status !== 'PENDING') return tx;
    process.stdout.write('.');
  }
  return null;
};

const fmtBalance = (value: unknown) =>
  value == null || value === '' ? '(not reported)' : `KES ${value}`;

// Pull the raw AccountBalance value(s) straight out of a stored callback.
const extractRawAccountBalanceValues = (parameters: any[]): string | null => {
  const values = (parameters || [])
    .filter((p: any) => p.Key === 'AccountBalance' || p.Name === 'AccountBalance')
    .map((p: any) => String(p.Value));
  return values.length ? values.join(' & ') : null;
};

// ============ BALANCE ============

const runBalance = async (options: CliOptions) => {
  const walletId = await resolveWalletId(options.walletId);

  console.log('\nQuerying M-Pesa account balances (working + utility)...');
  const response = await checkAccountBalance('M-Pesa account balance query', walletId);

  if (!response.success) {
    console.error('Balance query REJECTED by Daraja:', response.responseDescription);
    if (response.transactionId) console.error(`Transaction record: ${response.transactionId}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Request accepted: ${response.responseDescription}`);
  console.log(`Transaction record: ${response.transactionId}`);

  const tx = await waitForTransaction(response.transactionId!, options.waitSeconds);
  console.log('');

  if (!tx || (!tx.callbackReceivedAt && tx.status === 'PENDING')) {
    console.log(
      `No result callback received within ${options.waitSeconds}s.\n` +
        `The balances arrive asynchronously at MPESA_ACCOUNT_BALANCE_RESULT_URL\n` +
        `(currently ${process.env.MPESA_ACCOUNT_BALANCE_RESULT_URL || 'unset'}) — make sure the\n` +
        `app is deployed/reachable there. Once it lands, the balances are stored on\n` +
        `transaction ${response.transactionId} (metadata field).`
    );
    return;
  }

  if (tx.status !== 'SUCCESS') {
    console.error(`Balance query FAILED: [${tx.resultCode}] ${tx.resultDesc}`);
    process.exitCode = 1;
    return;
  }

  let balanceInfo: any = null;
  try {
    balanceInfo = tx.metadata ? JSON.parse(tx.metadata) : null;
  } catch {
    balanceInfo = null;
  }

  console.log('\n=== M-PESA ACCOUNT BALANCES ===');
  const accounts: any[] = balanceInfo?.accounts?.length ? balanceInfo.accounts : [];
  if (accounts.length) {
    for (const account of accounts) {
      console.log(`${account.name.padEnd(20)} ${account.balance == null ? account.raw : `KES ${account.balance}`}`);
    }
  } else {
    console.log(`Working Account : ${fmtBalance(balanceInfo?.workingAccountBalance)}`);
    console.log(`Utility Account : ${fmtBalance(balanceInfo?.utilityAccountBalance)}`);
  }
  if (balanceInfo?.accountStatus) {
    console.log(`Account status  : ${balanceInfo.accountStatus}`);
  }
  console.log(`M-Pesa Ref      : ${tx.mpesaTransactionId || '(none)'}`);

  if (!accounts.some((a) => /utility/i.test(a.name)) && balanceInfo?.utilityAccountBalance == null) {
    // Surface exactly what Daraja sent so missing accounts are obvious.
    let rawBalance: string | null = null;
    try {
      const raw = tx.rawCallbackData ? JSON.parse(tx.rawCallbackData) : null;
      rawBalance = extractRawAccountBalanceValues(raw?.Result?.ResultParameters?.ResultParameter);
    } catch {
      rawBalance = null;
    }
    console.log('\nNOTE: Daraja did NOT report a utility account for this shortcode.');
    if (rawBalance) console.log(`Raw AccountBalance value: ${rawBalance}`);
    console.log(
      'Some shortcodes (e.g. tills) only expose the working account via the AccountBalance API.\n' +
        'Confirm the account structure on the M-Pesa business portal or with apisupport@safaricom.co.ke.'
    );
  }
};

// ============ TRANSFER ============

const runTransfer = async (direction: string, options: CliOptions) => {
  if (direction !== 'to-utility' && direction !== 'to-working') {
    throw new Error(`Unknown transfer direction "${direction}" — use to-utility or to-working`);
  }
  if (!options.amount || isNaN(options.amount) || options.amount <= 0) {
    throw new Error('A positive --amount is required (KES)');
  }
  const amount = Math.round(options.amount);
  const remarks = (options.remarks || (direction === 'to-utility'
    ? 'Transfer from working to utility account'
    : 'Transfer from utility to working account')).slice(0, 100);

  const commandID =
    direction === 'to-utility'
      ? 'BusinessTransferFromMMFToUtility'
      : 'BusinessTransferFromUtilityToMMF';
  const fromAccount = direction === 'to-utility' ? 'WORKING' : 'UTILITY';
  const toAccount = direction === 'to-utility' ? 'UTILITY' : 'WORKING';

  console.log('\n=== M-PESA ACCOUNT TRANSFER ===');
  console.log(`CommandID : ${commandID}`);
  console.log(`Direction : ${fromAccount} -> ${toAccount}`);
  console.log(`Amount    : KES ${amount}`);
  console.log(`Remarks   : ${remarks}`);

  const isProduction = (process.env.MPESA_ENVIRONMENT || 'sandbox') === 'production';
  if (!options.yes) {
    if (!process.stdin.isTTY) {
      throw new Error('Refusing to move money non-interactively without --yes');
    }
    const ok = await confirm(`Transfer KES ${amount} from ${fromAccount} to ${toAccount}? (yes/no): `);
    if (!ok) {
      console.log('Cancelled.');
      return;
    }
  } else if (isProduction) {
    console.log('(--yes supplied — skipping confirmation)');
  }

  const walletId = await resolveWalletId(options.walletId);

  const response =
    direction === 'to-utility'
      ? await initiateWorkingToUtilityTransfer(amount, walletId, remarks)
      : await initiateUtilityToWorkingTransfer(amount, walletId, remarks);

  if (!response.success) {
    console.error('Transfer REJECTED by Daraja:', response.error);
    console.error(`Transaction record: ${response.transactionId}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nRequest accepted: ${response.responseDescription || 'Accepting the request'}`);
  console.log(`ConversationID         : ${response.conversationId}`);
  console.log(`OriginatorConversation : ${response.originatorConversationId}`);
  console.log(`Transaction record     : ${response.transactionId}`);

  const tx = await waitForTransaction(response.transactionId!, options.waitSeconds);
  console.log('');

  if (!tx || (!tx.callbackReceivedAt && tx.status === 'PENDING')) {
    console.log(
      `No result callback received within ${options.waitSeconds}s — the transfer result arrives\n` +
        `asynchronously at MPESA_B2B_RESULT_URL (currently ${process.env.MPESA_B2B_RESULT_URL || 'unset'}).\n` +
        `Check transaction ${response.transactionId} later for the final status.`
    );
    return;
  }

  if (tx.status === 'SUCCESS') {
    console.log(`Transfer SUCCESSFUL — KES ${amount} moved ${fromAccount} -> ${toAccount}`);
    console.log(`M-Pesa receipt: ${tx.mpesaReceiptNumber || tx.mpesaTransactionId || '(none)'}`);
  } else {
    console.error(`Transfer FAILED: [${tx.resultCode}] ${tx.resultDesc}`);
    process.exitCode = 1;
  }
};

// ============ MAIN ============

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'balance': {
      const options = parseArgs(rest);
      checkEnvironment();
      await runBalance(options);
      break;
    }
    case 'transfer': {
      const [direction, ...transferRest] = rest;
      if (!direction) {
        usage();
        throw new Error('transfer requires a direction: to-utility | to-working');
      }
      const options = parseArgs(transferRest);
      checkEnvironment();
      await runTransfer(direction, options);
      break;
    }
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      usage();
      break;
    default:
      usage();
      throw new Error(`Unknown command: ${command}`);
  }
};

main()
  .catch((e) => {
    console.error(`ERROR: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
