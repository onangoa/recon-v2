# M-Pesa Service API

A comprehensive M-Pesa payment service with API integration. This package provides service APIs and callbacks for consuming projects to implement their own database integration.

## Features

- **STK Push** - Customer-initiated payments via mobile prompts
- **B2C** - Business to Customer payments
- **B2B** - Business to Business transfers
- **C2B** - Customer to Business payments
- **B2Pochi** - Payments to Pochi La Biashara wallets
- **Account Balance** - Query M-Pesa account balance
- **Transaction Status** - Check transaction status
- **Reversal** - Reverse completed transactions
- **Certificate-based Security** - Enhanced encryption and validation
- **Comprehensive Callback Handling** - All M-Pesa callbacks supported

## Installation

```bash
npm install mpesa-servc
```

## Configuration

Set up your environment variables:

```bash
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_HEAD_OFFICE=your_head_office
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_INITIATOR_PASSWORD=your_initiator_password
MPESA_SECURITY_CREDENTIAL=your_security_credential
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/mpesa/timeout
MPESA_RESULT_URL=https://yourdomain.com/api/mpesa/result
MPESA_B2B_RESULT_URL=https://yourdomain.com/api/mpesa/b2b/result
MPESA_B2POCHI_RESULT_URL=https://yourdomain.com/api/mpesa/b2pochi/result
MPESA_ACCOUNT_BALANCE_RESULT_URL=https://yourdomain.com/api/mpesa/account-balance/result
MPESA_TRANSACTION_STATUS_RESULT_URL=https://yourdomain.com/api/mpesa/transaction-status/result
MPESA_REVERSAL_RESULT_URL=https://yourdomain.com/api/mpesa/reversal/result
MPESA_QUEUE_TIMEOUT_URL=https://yourdomain.com/api/mpesa/queue-timeout
MPESA_ENVIRONMENT=sandbox # or production

# Server Configuration
PORT=3000
MPESA_JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## Quick Start

```javascript
const mpesa = require('mpesa-servc');

// Start the service
mpesa.start();

// The server will be available at http://localhost:3000
```

## API Endpoints

### STK Push
```bash
POST /api/mpesa/stkpush/initiate
Content-Type: application/json

{
  "phoneNumber": "254700000000",
  "amount": "100",
  "accountReference": "Payment",
  "transactionDesc": "Payment for services"
}
```

### B2C Payment
```bash
POST /api/mpesa/b2c/payment
Content-Type: application/json

{
  "initiatorName": "testapi",
  "securityCredential": "encrypted_credential",
  "commandID": "BusinessPayment",
  "amount": "1000",
  "partyA": "174379",
  "partyB": "254700000000",
  "remarks": "Payment to customer",
  "occasion": "Salary"
}
```

### B2B Transfer
```bash
POST /api/mpesa/b2b/transfer
Content-Type: application/json

{
  "initiatorName": "testapi",
  "securityCredential": "encrypted_credential",
  "commandID": "BusinessPayBill",
  "senderIdentifierType": "4",
  "receiverIdentifierType": "4",
  "amount": "5000",
  "partyA": "174379",
  "partyB": "174379",
  "accountReference": "Business Transfer",
  "remarks": "Payment to supplier"
}
```

### C2B Registration
```bash
POST /api/mpesa/c2b/register
Content-Type: application/json

{
  "shortCode": "174379",
  "responseType": "Completed",
  "confirmationURL": "https://yourdomain.com/api/mpesa/c2b/confirmation",
  "validationURL": "https://yourdomain.com/api/mpesa/c2b/validation"
}
```

### B2Pochi Payment
```bash
POST /api/mpesa/b2pochi/payment
Content-Type: application/json

{
  "initiatorName": "testapi",
  "securityCredential": "encrypted_credential",
  "amount": "500",
  "partyA": "174379",
  "partyB": "254700000000",
  "remarks": "Payment to Pochi wallet",
  "occasion": "Wallet top-up"
}
```

### Account Balance
```bash
POST /api/mpesa/account/balance
Content-Type: application/json

{
  "partyA": "174379",
  "identifierType": "4",
  "remarks": "Balance query"
}
```

### Transaction Status
```bash
POST /api/mpesa/transaction/status
Content-Type: application/json

{
  "initiatorName": "testapi",
  "securityCredential": "encrypted_credential",
  "transactionID": "ABC123XYZ",
  "partyA": "174379",
  "identifierType": "4",
  "remarks": "Status query"
}
```

### Reversal
```bash
POST /api/mpesa/reversal
Content-Type: application/json

{
  "initiatorName": "testapi",
  "securityCredential": "encrypted_credential",
  "transactionID": "ABC123XYZ",
  "amount": "100",
  "receiverParty": "174379",
  "receiverIdentifierType": "4",
  "remarks": "Transaction reversal"
}
```

## Callback Endpoints

The service provides the following callback endpoints that should be configured in your M-Pesa dashboard:

```
POST /api/mpesa/callback/stkpush
POST /api/mpesa/callback/c2b/confirmation
POST /api/mpesa/callback/c2b/validation
POST /api/mpesa/callback/b2c
POST /api/mpesa/callback/b2b
POST /api/mpesa/callback/b2pochi
POST /api/mpesa/callback/account-balance
POST /api/mpesa/callback/transaction-status
POST /api/mpesa/callback/reversal
POST /api/mpesa/callback/timeout
```

## Database Integration

**Important**: This package no longer includes built-in database functionality. The consuming project must implement database operations for both service API requests and callback handling.

### Database Integration Guide

See [DATABASE_INTEGRATION_GUIDE.md](./DATABASE_INTEGRATION_GUIDE.md) for comprehensive documentation on:
- Recommended database schema
- Service API transaction storage patterns
- Callback handling implementation
- Error handling strategies
- Monitoring and maintenance queries
- Best practices and testing examples

## Certificate Management

The package supports certificate-based security for enhanced encryption:

```bash
# Validate certificates
npm run cert:validate

# Test encryption
npm run cert:test

# Encrypt password for credentials
npm run encrypt:password
```

### Certificate Files
- `cert/production.cer` - Production environment certificate
- `cert/sandbox.cer` - Sandbox environment certificate

## Security Features

- **Certificate-based encryption** for sensitive operations
- **Helmet.js** for HTTP header security
- **CORS** configuration
- **Rate limiting** to prevent abuse
- **Request validation** and error handling

## Error Handling

The service provides comprehensive error handling:

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Development mode
npm run dev
```

## Monitoring

### Health Check
```bash
GET /health
```

### Certificate Info
```bash
GET /api/certificate/info
```

### Certificate Validation
```bash
GET /api/certificate/validate
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MPESA_CONSUMER_KEY` | M-Pesa API consumer key | `your_key_here` |
| `MPESA_CONSUMER_SECRET` | M-Pesa API consumer secret | `your_secret_here` |
| `MPESA_PASSKEY` | STK Push passkey | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` |
| `MPESA_SHORTCODE` | Business short code | `174379` |
| `MPESA_ENVIRONMENT` | Environment | `sandbox` or `production` |
| `MPESA_CALLBACK_URL` | Base callback URL | `https://yourdomain.com/api/mpesa/callback` |
| `PORT` | Server port | `3000` |

## Transaction Types

| Type | Description |
|------|-------------|
| STK_PUSH | Customer initiated payments via STK Push |
| B2C | Business to Customer payments |
| B2B | Business to Business transfers |
| C2B | Customer to Business payments |
| B2POCHI | Business to Pochi wallet payments |
| REVERSAL | Transaction reversals |
| ACCOUNT_BALANCE | Balance queries |
| TRANSACTION_STATUS | Transaction status queries |

## Response Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Internal server error |
| 1032 | Request cancelled by user (STK Push) |
| 1037 | Timeout |
| 2001 | Duplicate request |
| 2002 | Insufficient balance |

## Best Practices

1. **Database Integration**: Implement proper transaction storage as per the integration guide
2. **Error Handling**: Always handle errors gracefully and provide meaningful feedback
3. **Security**: Use certificate-based encryption for production environments
4. **Testing**: Test thoroughly in sandbox before moving to production
5. **Monitoring**: Set up proper monitoring for failed transactions
6. **Rate Limiting**: Respect M-Pesa API rate limits
7. **Idempotency**: Handle duplicate requests and callbacks appropriately

## Troubleshooting

### Common Issues

1. **Certificate Validation Failed**
   - Ensure certificate files are in the `cert/` directory
   - Run `npm run cert:validate` to diagnose issues

2. **Invalid Credentials**
   - Verify consumer key and secret are correct
   - Check environment is set correctly (sandbox/production)

3. **Timeout Errors**
   - Increase timeout values in your M-Pesa dashboard
   - Check network connectivity

4. **Callback Not Received**
   - Verify callback URLs are publicly accessible
   - Check firewall settings
   - Ensure URLs are correctly configured in M-Pesa dashboard

## Support

For issues and questions:
- Check the [Database Integration Guide](./DATABASE_INTEGRATION_GUIDE.md)
- Review M-Pesa API documentation
- Check package repository issues

## License

ISC

## Changelog

### Version 2.0.0
- Removed built-in database functionality
- Added comprehensive database integration guide
- Simplified package dependencies
- Enhanced callback handling
- Improved error handling and logging

### Version 1.1.0
- Added B2Pochi support
- Enhanced certificate validation
- Improved error handling
- Added comprehensive logging

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- Proper error handling is implemented
- Database operations follow the integration guide
- Tests are included where applicable
- Documentation is updated