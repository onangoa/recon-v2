/**
 * Sanity test for the payout SMS changes (run against the local dev DB).
 * The SMS gateway is pointed at a dead URL so nothing is actually sent —
 * the exact message text still appears in the [SMS] OUT log lines.
 * Creates throwaway transactions/beneficiary rows and removes them after.
 */
process.env.SMS_API_BASE_URL = 'http://127.0.0.1:9';
process.env.SMS_PARTNER_ID = process.env.SMS_PARTNER_ID || 'test';
process.env.SMS_API_KEY = process.env.SMS_API_KEY || 'test';
process.env.SMS_SHORTCODE = process.env.SMS_SHORTCODE || 'TEST';

import { prisma } from '../lib/prisma';
import { notifyPayoutSentToRecipient } from '../lib/sms-notifications';
import { savePayoutBeneficiary, getRecentPayoutRecipients } from '../lib/payout-beneficiary-service';

async function main() {
  const wallets = await prisma.wallet.findMany({
    include: { contractor: true },
    take: 50,
  });
  const wallet = wallets.find((w) => w.contractor?.companyName);
  if (!wallet?.contractor?.companyName || !wallet.contractorId) {
    console.log('No wallet with a named contractor found — nothing to test against.');
    return;
  }
  const contractorId: string = wallet.contractorId;
  console.log(`Using wallet of contractor: ${wallet.contractor.companyName}`);

  const created: string[] = [];
  const makeTx = async (data: any) => {
    const tx = await prisma.transaction.create({ data: { walletId: wallet.id, type: 'debit', status: 'completed', ...data } });
    created.push(tx.id);
    return tx;
  };

  console.log('\n--- 1. payroll manual (worker paid in cash, phone on tx) ---');
  const t1 = await makeTx({
    amount: 12500,
    description: 'Payroll: John Doe - Sep 1 - 15',
    reference: 'PAYROLL-3f2a9c1d-8b41e2af',
    transactionType: 'PAYROLL_MANUAL',
    phoneNumber: '0711000002',
    metadata: JSON.stringify({ category: 'payroll', workerPhone: '0711000002' }),
  });
  await notifyPayoutSentToRecipient(t1.id);

  console.log('\n--- 2. payroll till worker (phone only in metadata.workerPhone) ---');
  const t2 = await makeTx({
    amount: 8200,
    description: 'Payroll: Jane Wanjiku - Sep 1 - 15',
    reference: 'PAYROLL-3f2a9c1d-9c31e2af',
    status: 'pending_approval',
    transactionType: 'B2B',
    remarks: 'till',
    accountReference: '123456',
    metadata: JSON.stringify({ category: 'payroll', workerPhone: '+254711000003' }),
  });
  await notifyPayoutSentToRecipient(t2.id);

  console.log('\n--- 3. bank pesalink payout with notification mobile ---');
  const t3 = await makeTx({
    amount: 45000,
    transactionType: 'BANK_PESALINK',
    remarks: 'pesalink',
    accountReference: '01102789645002',
    phoneNumber: '0711000004',
    metadata: JSON.stringify({ bankPayout: true, destinationAccount: '01102789645002', bankCode: '29', mobileNumber: '0711000004', payoutChannel: 'pesalink' }),
  });
  await notifyPayoutSentToRecipient(t3.id);

  console.log('\n--- 4. regular M-Pesa b2c payout (unchanged behavior) ---');
  const t4 = await makeTx({
    amount: 45000,
    transactionType: 'B2C',
    remarks: 'phone',
    phoneNumber: '0711000005',
    mpesaReceiptNumber: 'QK7H2X9PLM',
  });
  await notifyPayoutSentToRecipient(t4.id);

  console.log('\n--- 5. bank ift payout WITHOUT mobile (must stay silent) ---');
  const t5 = await makeTx({
    amount: 20000,
    transactionType: 'BANK_IFT',
    remarks: 'ift',
    accountReference: '01109876543210',
    metadata: JSON.stringify({ bankPayout: true, destinationAccount: '01109876543210', payoutChannel: 'ift' }),
  });
  await notifyPayoutSentToRecipient(t5.id);
  console.log('(no [SMS] OUT line above = correctly skipped)');

  console.log('\n--- 6. beneficiary mobileNumber round-trip + recents ---');
  const beneficiary = await savePayoutBeneficiary(contractorId, {
    channel: 'pesalink',
    destination: '01102789645002',
    label: 'SMS Test KCB',
    bankCode: '29',
    recipientName: 'Test Recipient',
    mobileNumber: '0711000004',
  });
  const readBack = await prisma.payoutBeneficiary.findUnique({ where: { id: beneficiary.id } });
  console.log(`saved beneficiary mobileNumber: ${readBack?.mobileNumber}`);
  const recents = await getRecentPayoutRecipients(contractorId, 20);
  const recentBank = recents.find((r) => r.channel === 'pesalink' && r.destination === '01102789645002');
  console.log(`recent pesalink entry mobileNumber: ${recentBank?.mobileNumber ?? '(none)'}`);
  await prisma.payoutBeneficiary.delete({ where: { id: beneficiary.id } });

  await prisma.transaction.deleteMany({ where: { id: { in: created } } });
  console.log(`\ncleaned up ${created.length} test transactions + beneficiary`);
}

main()
  .catch((e) => { console.error('ERROR:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
