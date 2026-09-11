# SMS Notifications — ReconSMI

SMS notifications are delivered through the **Celcom Africa ISMS gateway**
(`lib/sms-service.ts`). Domain-specific message builders live in
`lib/sms-notifications.ts` and are best-effort: a failed SMS never breaks a
payment flow.

## Configuration

| Env var | Description |
|---|---|
| `SMS_PARTNER_ID` | Celcom partner ID (e.g. `1559`) |
| `SMS_API_KEY` | Celcom API key |
| `SMS_SHORTCODE` | Sender ID / shortcode (e.g. `RDEMOI`) |
| `SMS_API_BASE_URL` | Optional. Defaults to `https://isms.celcomafrica.com` |

All recipients are normalized to `2547XXXXXXXX` / `2541XXXXXXXX`
(`07..`, `+2547..` and `7..` forms are accepted).

## Catalog

### A. Money movements

| # | Trigger | Recipient | Sample message | Status |
|---|---|---|---|---|
| 1 | Wallet top-up confirmed (M-Pesa STK Push callback or Co-op Bank IPN) | Payer's phone / wallet owner | `ReconSMI: Wallet top-up of KES 5,000 confirmed. New balance KES 12,300. Ref QK7H2X9PLM.` | **IMPLEMENTED** |
| 2 | Bank payout / withdrawal created (`pending_approval`) | Approver (superadmin) | `ReconSMI: Payout of KES 45,000 to J. Wanjiku (Co-op Bank) by BuildRight Ltd needs approval.` | Pending |
| 3 | Payout approved / rejected | Requester (wallet owner) | `ReconSMI: Payout of KES 45,000 to J. Wanjiku via Co-op Bank A/C *8130 approved and processing.` / `...was rejected. Reason: Insufficient balance.` | **IMPLEMENTED** |
| 4 | Payroll disbursement initiated (`pending_approval`) | Approver | `ReconSMI: Oct 2026 payroll for BuildRight Ltd (38 workers, KES 512,400) needs approval.` | Pending |
| 5 | Salary paid to worker (M-Pesa B2C) | Worker (`Worker.phone`) | `ReconSMI: Hi John M, Oct 2026 salary of KES 14,500 sent to your M-Pesa. Payslip in app.` | Pending |
| 6 | Subscription payment confirmed | Contractor | `ReconSMI: KES 10,000 received for Premium plan. Active until 10 Oct 2027.` | Pending |

### B. Compliance & safety

| # | Trigger | Recipient | Sample message | Status |
|---|---|---|---|---|
| 7 | License expiry (30/14/7-day cron) | Contractor | `ReconSMI: License NCA-88321 (Westlands Site) expires in 7 days (21 Oct). Renew to stay compliant.` | Pending |
| 8 | Safety incident reported (high severity) | Site manager / team | `ReconSMI ALERT: Injury reported at Westlands Site (High) — J. Mwangi, 11:40 AM. Review in app.` | Pending |
| 9 | Subscription expiring soon | Contractor | `ReconSMI: Your Premium plan expires 30 Oct 2026. Renew to keep sites & payroll access.` | Pending |

### C. Operations

| # | Trigger | Recipient | Sample message | Status |
|---|---|---|---|---|
| 10 | Purchase order sent to supplier | Supplier (`Supplier.phone`) | `ReconSMI: BuildRight Ltd sent you PO-2043 (KES 88,000, 12 items). Details in your email.` | Pending |
| 11 | Team member added (currently email-only) | Team member (`TeamMember.phone`) | `ReconSMI: You've been added to BuildRight Ltd as Site Engineer. Set your password via email link.` | Pending |
| 12 | Visitor checked in | Host (team member) | `ReconSMI: Your visitor Mary A (Safaricom) checked in at Westlands Site, 10:05 AM.` | Pending |

### D. Auth

| # | Trigger | Recipient | Sample message | Status |
|---|---|---|---|---|
| 13 | Password reset OTP | User | `ReconSMI: Code 482913. Valid 10 min. Never share it.` | Pending |

## Implemented touchpoints

### #1 — Wallet top-up confirmed

| Flow | Hook location | Recipient |
|---|---|---|
| M-Pesa STK Push success (`ResultCode 0`) | `handleSTKPushCallback` in `lib/mpesa-service.ts` | Payer's phone (from callback metadata, falls back to the stored transaction phone). Registration / subscription payments are skipped — they are not wallet top-ups. |
| Co-op Bank funds-transfer callback (credit) | `handleBankFundsTransferCallback` in `lib/bank-service.ts` | Wallet owner (`Contractor.phoneNumber`) |
| Bank IPN matching a pending `BANK_TOPUP` | `handleBankIPN` in `lib/bank-service.ts` | Wallet owner |
| Bank IPN creating a new credit (unmatched) | `handleBankIPN` in `lib/bank-service.ts` | Wallet owner (skipped for system wallets without a contractor phone) |

Helpers: `notifyWalletTopupConfirmed` (payer phone known) and
`notifyBankTopupConfirmedForWallet` (resolves wallet owner + balance).

### #3 — Payout approved / rejected (with destination)

The message states **where the payout is being sent**, derived from the
payout channel (`remarks` / `metadata.payoutChannel`):

| Channel | Destination text |
|---|---|
| `phone` / `mpesa` | `M-Pesa 0712345678` |
| `pochi` | `Pochi la Biashara 0712345678` |
| `paybill` | `Paybill 522833` |
| `till` | `Buy Goods Till 123456` |
| `pesalink` | `{Bank name} A/C *8130` (bank name resolved via `lib/bank-codes.ts`) |
| `ift` | `Co-op Bank A/C *8130` |

Hooks (all send to the wallet owner / requester):

| Flow | Hook location |
|---|---|
| Approve payout (web) | `app/web/api/wallets/transactions/approvals/route.ts` |
| Approve payout (mobile) | `app/mobile/api/wallets/transactions/approvals/route.ts` |
| Reject payout (web) | `app/web/api/wallets/transactions/[id]/reject/route.ts` |
| Reject payout (mobile) | `app/mobile/api/wallets/transactions/[id]/reject/route.ts` |
| Insufficient balance at approval (treated as rejection) | Both approvals routes |

Helpers: `notifyPayoutApproved` and `notifyPayoutRejected`
(reason included when provided).

Sample messages:

- Approved: `ReconSMI: Payout of KES 45,000 to J. Wanjiku via M-Pesa 0712345678 approved and processing.`
- Rejected: `ReconSMI: Payout of KES 45,000 to J. Wanjiku via Co-op Bank A/C *8130 was rejected. Reason: Insufficient balance.`
