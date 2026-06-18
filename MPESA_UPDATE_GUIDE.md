# M-Pesa Integration Update

## Overview
The M-Pesa service has been completely updated to work with the new `mpesa-servc` package that no longer includes built-in database functionality. This update implements comprehensive callback handling and database integration.

## Changes Made

### 1. Updated Prisma Schema
- Enhanced `Transaction` model with M-Pesa specific fields
- Added fields for tracking M-Pesa transaction identifiers (checkoutRequestId, merchantRequestId, conversationId, etc.)
- Added callback tracking fields (rawCallbackData, callbackReceivedAt)
- Added appropriate indexes for efficient querying

### 2. Created New M-Pesa Service (`lib/mpesa-service.ts`)
A comprehensive service that handles:
- **STK Push Operations**: Initiate payments and handle callbacks
- **B2C Operations**: Send payments to customers with callback handling
- **B2B Operations**: Transfer funds between businesses with callback handling
- **B2Pochi Operations**: Pay to Pochi wallets with callback handling
- **C2B Operations**: Receive payments with validation and confirmation
- **Transaction Status Queries**: Check M-Pesa transaction status
- **Account Balance Queries**: Query M-Pesa account balance
- **Reversal Operations**: Reverse completed transactions
- **Timeout Monitoring**: Monitor and mark timed-out transactions

### 3. Created Callback API Routes
Implemented callback handlers for all M-Pesa transaction types:
- `app/api/callbacks/mpesa/stkpush/route.ts` - STK Push callbacks
- `app/api/callbacks/mpesa/b2c/route.ts` - B2C callbacks
- `app/api/callbacks/mpesa/b2b/route.ts` - B2B callbacks
- `app/api/callbacks/mpesa/b2pochi/route.ts` - B2Pochi callbacks
- `app/api/callbacks/mpesa/c2b/confirmation/route.ts` - C2B confirmation
- `app/api/callbacks/mpesa/c2b/validation/route.ts` - C2B validation
- `app/api/callbacks/mpesa/transaction-status/route.ts` - Transaction status callbacks
- `app/api/callbacks/mpesa/account-balance/route.ts` - Account balance callbacks
- `app/api/callbacks/mpesa/reversal/route.ts` - Reversal callbacks

### 4. Created M-Pesa Operation API Routes
Implemented API endpoints for initiating M-Pesa transactions:
- `app/api/mpesa/stkpush/route.ts` - Initiate STK Push
- `app/api/mpesa/b2c/route.ts` - Initiate B2C payments
- `app/api/mpesa/b2b/route.ts` - Initiate B2B transfers
- `app/api/mpesa/b2pochi/route.ts` - Initiate B2Pochi payments
- `app/api/mpesa/transaction-status/route.ts` - Check transaction status
- `app/api/mpesa/account-balance/route.ts` - Query account balance
- `app/api/mpesa/reversal/route.ts` - Initiate reversal
- `app/api/mpesa/transactions/route.ts` - Query transactions

### 5. Updated Environment Variables
Enhanced `.env.example` with all necessary M-Pesa configuration variables.

### 6. Maintained Backward Compatibility
Updated `lib/mpesa.ts` to wrap the new service and maintain compatibility with existing code.

## Features Implemented

### Transaction Management
- ✅ Automatic transaction creation on initiation
- ✅ Transaction status updates based on callbacks
- ✅ Duplicate transaction detection
- ✅ Transaction timeout monitoring
- ✅ Comprehensive transaction logging

### Callback Handling
- ✅ STK Push callback processing with success/failure/cancellation handling
- ✅ B2C/B2B/B2Pochi callback processing with receipt number extraction
- ✅ C2B validation and confirmation callbacks
- ✅ Account balance callback processing
- ✅ Transaction status callback processing
- ✅ Reversal callback processing
- ✅ Orphaned callback handling

### Database Operations
- ✅ Transaction creation with M-Pesa identifiers
- ✅ Transaction updates from callbacks
- ✅ Wallet balance updates on successful transactions
- ✅ Raw callback data storage for debugging
- ✅ Transaction history tracking

### Error Handling
- ✅ Comprehensive error handling for all operations
- ✅ Appropriate HTTP status codes
- ✅ Detailed error messages
- ✅ Graceful failure responses to prevent M-Pesa retries

## Transaction Status Flow

### STK Push
1. `PENDING` → Transaction initiated
2. `SUCCESS` → Payment completed successfully
3. `FAILED` → Payment failed
4. `CANCELLED` → User cancelled the prompt
5. `TIMEOUT` → Transaction timed out (30 minutes default)

### B2C/B2B/B2Pochi
1. `PENDING` → Transfer initiated
2. `SUCCESS` → Transfer completed successfully
3. `FAILED` → Transfer failed

### C2B
- `SUCCESS` → Payment received (no pending state for C2B)

## API Usage Examples

### STK Push Payment
```javascript
POST /api/mpesa/stkpush
{
  "phoneNumber": "254700000000",
  "amount": 100,
  "walletId": "wallet_123",
  "accountReference": "Order #456",
  "transactionDesc": "Payment for services"
}
```

### B2C Payment
```javascript
POST /api/mpesa/b2c
{
  "phoneNumber": "254700000000",
  "amount": 1000,
  "walletId": "wallet_123",
  "commandID": "BusinessPayment",
  "remarks": "Salary Payment",
  "occasion": "Monthly Salary"
}
```

### Query Transactions
```javascript
GET /api/mpesa/transactions?walletId=wallet_123&limit=10&offset=0
GET /api/mpesa/transactions?status=SUCCESS&limit=20
GET /api/mpesa/transactions?transactionId=txn_123
```

## Environment Configuration

Ensure these variables are set in your `.env` file:

```bash
# M-Pesa API Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_ENVIRONMENT=sandbox
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey

# Callback URLs
MPESA_CALLBACK_URL=https://your-domain.com/api/callbacks/mpesa
```

## Callback URL Configuration

Configure these callback URLs in your M-Pesa dashboard:

- STK Push: `https://your-domain.com/api/callbacks/mpesa/stkpush`
- B2C: `https://your-domain.com/api/callbacks/mpesa/b2c`
- B2B: `https://your-domain.com/api/callbacks/mpesa/b2b`
- B2Pochi: `https://your-domain.com/api/callbacks/mpesa/b2pochi`
- C2B Confirmation: `https://your-domain.com/api/callbacks/mpesa/c2b/confirmation`
- C2B Validation: `https://your-domain.com/api/callbacks/mpesa/c2b/validation`
- Account Balance: `https://your-domain.com/api/callbacks/mpesa/account-balance`
- Transaction Status: `https://your-domain.com/api/callbacks/mpesa/transaction-status`
- Reversal: `https://your-domain.com/api/callbacks/mpesa/reversal`

## Database Schema

The updated Transaction model includes:

```prisma
model Transaction {
  // Standard fields
  id                        String   @id @default(cuid())
  walletId                  String
  amount                    Float
  type                      String
  description               String?
  status                    String   @default("completed")
  reference                 String?
  receiptNumber             String?
  externalId                String?
  metadata                  String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  // M-Pesa specific fields
  mpesaTransactionId        String?
  merchantRequestId         String?
  checkoutRequestId         String?
  originatorConversationId  String?
  conversationId            String?
  transactionType           String?
  resultCode                Int?
  resultDesc                String?
  mpesaReceiptNumber        String?
  accountReference          String?
  transactionDesc           String?
  remarks                   String?
  phoneNumber               String?
  rawCallbackData           String?
  rawApiResponse            String?
  callbackReceivedAt        DateTime?
  
  wallet                    Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
}
```

## Monitoring and Maintenance

### Timeout Monitoring
Run the timeout monitor to mark transactions as timed out:

```typescript
import { monitorPendingTransactions } from '@/lib/mpesa-service';

// Monitor transactions pending for more than 30 minutes
await monitorPendingTransactions(30);
```

### Query Failed Transactions
```typescript
import { getTransactionsByStatus, TransactionStatus } from '@/lib/mpesa-service';

const failedTransactions = await getTransactionsByStatus(TransactionStatus.FAILED, 100);
```

## Security Considerations

- ✅ Input validation for all API requests
- ✅ Phone number format validation
- ✅ Wallet balance verification before debiting
- ✅ Error messages that don't expose sensitive information
- ✅ Proper HTTP status codes

## Next Steps

1. **Configure M-Pesa Dashboard**: Update callback URLs in your M-Pesa dashboard
2. **Test in Sandbox**: Test all transaction types in sandbox environment
3. **Monitor Callbacks**: Set up monitoring for callback reception and processing
4. **Set Up Alerts**: Configure alerts for failed transactions
5. **Update Production Credentials**: Update environment variables for production use

## Troubleshooting

### Callbacks Not Received
- Verify callback URLs are publicly accessible
- Check firewall settings
- Ensure URLs are correctly configured in M-Pesa dashboard

### Transaction Status Not Updating
- Check callback logs in console
- Verify transaction records are being created
- Check for duplicate callback handling

### Database Issues
- Run `npx prisma db push` to sync schema
- Check database connection
- Verify indexes are created properly

## Support

For issues and questions:
- Check the RESPONSE_CALLBACK_DATABASE_GUIDE.md for detailed callback patterns
- Review M-Pesa API documentation
- Check console logs for detailed error information