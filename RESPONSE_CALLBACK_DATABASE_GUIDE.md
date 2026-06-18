# M-Pesa Service Integration Guide - Response, Callback & Database Handling

## Complete Implementation Guide

This guide provides comprehensive information on handling M-Pesa service responses, callbacks, and database integration for consuming projects.

---

## Table of Contents

1. [Service API Responses](#service-api-responses)
2. [Callback Handling](#callback-handling)
3. [Database Integration](#database-integration)
4. [Complete Integration Examples](#complete-integration-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## Service API Responses

### Response Structure

All M-Pesa service API calls follow this response pattern:

```javascript
{
  success: true|false,
  data: { /* M-Pesa response data */ },
  error: "Error message if failed"
}
```

### Success Response Patterns

#### 1. STK Push Success Response

```json
{
  "success": true,
  "data": {
    "MerchantRequestID": "29115-34620561-1",
    "CheckoutRequestID": "ws_CO_1712345678_12345678",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing"
  }
}
```

#### 2. B2C Success Response

```json
{
  "success": true,
  "data": {
    "ConversationID": "AG_20230612_12345678abc123456",
    "OriginatorConversationID": "29115-34620561-1",
    "ResponseCode": "0",
    "ResponseDescription": "Accept the service request successfully."
  }
}
```

#### 3. B2B Success Response

```json
{
  "success": true,
  "data": {
    "ConversationID": "AG_20230612_12345678abc123456",
    "OriginatorConversationID": "29115-34620561-1",
    "ResponseCode": "0",
    "ResponseDescription": "Accept the B2B service request successfully."
  }
}
```

#### 4. Account Balance Success Response

```json
{
  "success": true,
  "data": {
    "ConversationID": "AG_20230612_12345678abc123456",
    "OriginatorConversationID": "29115-34620561-1",
    "ResponseCode": "0",
    "ResponseDescription": "Accept the service request successfully."
  }
}
```

#### 5. Transaction Status Success Response

```json
{
  "success": true,
  "data": {
    "ConversationID": "AG_20230612_12345678abc123456",
    "OriginatorConversationID": "29115-34620561-1",
    "ResponseCode": "0",
    "ResponseDescription": "Accept the service request successfully."
  }
}
```

#### 6. Reversal Success Response

```json
{
  "success": true,
  "data": {
    "ConversationID": "AG_20230612_12345678abc123456",
    "OriginatorConversationID": "29115-34620561-1",
    "ResponseCode": "0",
    "ResponseDescription": "Accept the service request successfully."
  }
}
```

### Failure Response Patterns

#### 1. Invalid Credentials

```json
{
  "success": false,
  "error": "Failed to get access token",
  "data": {
    "requestId": "12345",
    "errorCode": "401.002.01",
    "errorMessage": "Invalid Consumer Key"
  }
}
```

#### 2. Invalid Phone Number

```json
{
  "success": false,
  "error": "STK Push error: Invalid phone number format"
}
```

#### 3. Insufficient Balance

```json
{
  "success": false,
  "error": "STK Push error",
  "data": {
    "requestId": "12345",
    "errorCode": "2001",
    "errorMessage": "Insufficient balance"
  }
}
```

#### 4. Timeout Errors

```json
{
  "success": false,
  "error": "Request timeout after 30000ms"
}
```

#### 5. Network Errors

```json
{
  "success": false,
  "error": "Network error: ECONNREFUSED",
  "message": "Failed to connect to M-Pesa API"
}
```

### M-Pesa Response Codes Reference

| Response Code | Description | Action Required |
|---------------|-------------|-----------------|
| 0 | Success | Request accepted for processing |
| 1 | Internal Server Error | Retry after delay |
| 1032 | Request Cancelled by User | Update transaction as cancelled |
| 1037 | Timeout | Update transaction as timeout |
| 2001 | Duplicate Request | Check existing transaction |
| 2002 | Insufficient Balance | Notify user |
| 2003 | Invalid Amount | Validate input |
| 2004 | Invalid Phone Number | Validate input |
| 2005 | Invalid Shortcode | Check configuration |
| 2006 | Invalid Security Credential | Regenerate credentials |
| 2007 | Invalid Initiator | Check initiator configuration |
| 2008 | Invalid Transaction ID | Verify transaction ID |
| 2009 | Invalid Party | Validate phone number/short code |
| 2010 | Invalid Command ID | Check command ID |
| 2011 | Invalid Identifier Type | Use correct identifier type (1, 2, 4) |
| 2012 | Invalid Security Credential | Regenerate credentials |
| 2013 | Invalid Account Reference | Validate account reference |

---

## Callback Handling

### Callback Overview

M-Pesa sends callbacks to inform your application about the status of transactions. These callbacks are crucial for updating your database and notifying users.

### Callback Endpoints

Set these URLs in your M-Pesa dashboard and environment variables:

```
STK Push Callback:           /api/mpesa/callback/stkpush
C2B Confirmation Callback:  /api/mpesa/callback/c2b/confirmation
C2B Validation Callback:    /api/mpesa/callback/c2b/validation
B2C Callback:               /api/mpesa/callback/b2c
B2B Callback:               /api/mpesa/callback/b2b
B2Pochi Callback:           /api/mpesa/callback/b2pochi
Account Balance Callback:   /api/mpesa/callback/account-balance
Transaction Status Callback:/api/mpesa/callback/transaction-status
Reversal Callback:          /api/mpesa/callback/reversal
Timeout Callback:           /api/mpesa/callback/timeout
```

### Callback Data Structures

#### 1. STK Push Callback

**Success Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_1712345678_12345678",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 100
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "LGR8OWQX7Q"
          },
          {
            "Name": "TransactionDate",
            "Value": "20230612153015"
          },
          {
            "Name": "PhoneNumber",
            "Value": "254700000000"
          }
        ]
      }
    }
  }
}
```

**Failed Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_1712345678_12345678",
      "ResultCode": 1032,
      "ResultDesc": "Request cancelled by user"
    }
  }
}
```

#### 2. B2C/B2B/B2Pochi Callback

**Success Callback:**
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20230612_12345678abc123456",
    "TransactionID": "LGR8OWQX7Q",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "TransactionAmount",
          "Value": 100.00
        },
        {
          "Key": "TransactionReceipt",
          "Value": "LGR8OWQX7Q"
        },
        {
          "Key": "ReceiverPartyPublicName",
          "Value": "254700000000 - John Doe"
        },
        {
          "Key": "TransactionCompletedDateTime",
          "Value": "12.06.2023 15:30:15"
        },
        {
          "Key": "B2CUtilityAccountAvailableFunds",
          "Value": 100000.00
        },
        {
          "Key": "B2CWorkingAccountAvailableFunds",
          "Value": 100000.00
        }
      ]
    },
    "ReferenceData": {
      "ReferenceItem": []
    }
  }
}
```

**Failed Callback:**
```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 2001,
    "ResultDesc": "The balance is insufficient for the transaction",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20230612_12345678abc123456"
  }
}
```

#### 3. C2B Confirmation Callback

```json
{
  "TransactionType": "CustomerPayBillOnline",
  "TransID": "LGR8OWQX7Q",
  "TransTime": "20230612153015",
  "TransAmount": "100.00",
  "BusinessShortCode": "174379",
  "BillRefNumber": "123456",
  "InvoiceNumber": "",
  "OrgAccountBalance": "100000.00",
  "ThirdPartyTransID": "1234567890",
  "MSISDN": "254700000000",
  "FirstName": "John",
  "MiddleName": "",
  "LastName": "Doe"
}
```

#### 4. Account Balance Callback

```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20230612_12345678abc123456",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "AccountStatus",
          "Value": "Active"
        },
        {
          "Key": "WorkingAccountBalance",
          "Value": 100000.00
        },
        {
          "Key": "UtilityAccountBalance",
          "Value": 50000.00
        }
      ]
    }
  }
}
```

#### 5. Transaction Status Callback

```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20230612_12345678abc123456",
    "TransactionID": "LGR8OWQX7Q",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "ReceiptNo",
          "Value": "LGR8OWQX7Q"
        },
        {
          "Key": "TransactionDate",
          "Value": "12.06.2023 15:30:15"
        },
        {
          "Key": "TransactionStatus",
          "Value": "Completed"
        }
      ]
    }
  }
}
```

#### 6. Reversal Callback

```json
{
  "Result": {
    "ResultType": 0,
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "29115-34620561-1",
    "ConversationID": "AG_20230612_12345678abc123456",
    "TransactionID": "LGR8OWQX7Q",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "ReversalAmount",
          "Value": 100.00
        },
        {
          "Key": "ReversedTransactionID",
          "Value": "LGR8OWQX7Q"
        },
        {
          "Key": "ReversalReceipt",
          "Value": "REV123456"
        }
      ]
    }
  }
}
```

### Callback Implementation Patterns

#### 1. STK Push Callback Handler

```javascript
async function handleSTKPushCallback(req, res) {
  try {
    const { Body } = req.body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;

    logger.info('STK Push callback received:', { CheckoutRequestID, ResultCode, ResultDesc });

    // Step 1: Find transaction by CheckoutRequestID
    const transaction = await Transaction.findOne({
      where: { checkoutRequestId: CheckoutRequestID }
    });

    if (!transaction) {
      logger.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      
      // Handle orphaned callback - create new transaction or notify admin
      await handleOrphanedCallback(Body.stkCallback);
      
      return res.json({
        ResultCode: 0,
        ResultDesc: 'Processed'
      });
    }

    // Step 2: Process based on result code
    let updateData = {
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: req.body
    };

    if (ResultCode === 0) {
      // Success case
      const metadata = Body.stkCallback.CallbackMetadata.Item;
      
      updateData.status = 'SUCCESS';
      updateData.mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
      
      // Extract additional metadata
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate').Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber').Value;
      
      logger.info('STK Push successful:', {
        transactionId: transaction.id,
        mpesaReceiptNumber: updateData.mpesaReceiptNumber,
        phoneNumber: phoneNumber
      });
      
      // Trigger success notifications
      await notifyTransactionSuccess(transaction, updateData);
      
    } else if (ResultCode === 1032) {
      // User cancelled
      updateData.status = 'CANCELLED';
      logger.info('STK Push cancelled by user:', { transactionId: transaction.id });
      
      // Trigger cancellation notifications
      await notifyTransactionCancelled(transaction);
      
    } else {
      // Failed case
      updateData.status = 'FAILED';
      logger.error('STK Push failed:', { 
        transactionId: transaction.id, 
        ResultCode, 
        ResultDesc 
      });
      
      // Trigger failure notifications
      await notifyTransactionFailed(transaction, ResultCode, ResultDesc);
    }

    // Step 3: Update transaction
    await transaction.update(updateData);

    // Step 4: Return success response to M-Pesa
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Success',
      ThirdPartyTransID: MerchantRequestID
    });
    
  } catch (error) {
    logger.error('STK Push callback processing error:', error);
    
    // Always return success to M-Pesa to prevent retries
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Processed'
    });
  }
}
```

#### 2. B2B Callback Handler

```javascript
async function handleB2BCallback(req, res) {
  try {
    const { Result } = req.body;
    
    if (!Result) {
      logger.error('B2B callback missing Result object');
      return res.json({ ResultCode: 1, ResultDesc: 'Invalid callback format' });
    }

    const { ResultCode, ResultDesc, OriginatorConversationID, ConversationID, TransactionID } = Result;

    logger.info('B2B callback received:', { 
      OriginatorConversationID, 
      ConversationID, 
      ResultCode 
    });

    // Step 1: Find transaction - try multiple matching fields
    const transaction = await Transaction.findOne({
      where: {
        [Op.or]: [
          { conversationId: ConversationID },
          { originatorConversationId: OriginatorConversationID }
        ]
      }
    });

    if (!transaction) {
      logger.warn(`Transaction not found for B2B callback: ${ConversationID}`);
      await handleOrphanedB2BCallback(Result);
      return res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    // Step 2: Prepare update data
    let updateData = {
      transactionId: TransactionID,
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: req.body
    };

    if (ResultCode === 0) {
      // Success - extract result parameters
      const parameters = Result.ResultParameters?.ResultParameter || [];
      const receiptNo = findParameterValue(parameters, 'TransactionReceipt');
      const amount = findParameterValue(parameters, 'TransactionAmount');
      const dateTime = findParameterValue(parameters, 'TransactionCompletedDateTime');

      updateData.status = 'SUCCESS';
      updateData.mpesaReceiptNumber = receiptNo;
      
      logger.info('B2B transfer successful:', {
        transactionId: transaction.id,
        receiptNo,
        amount,
        dateTime
      });

      await notifyB2BSuccess(transaction, {
        receiptNo,
        amount,
        dateTime
      });
      
    } else {
      // Failed
      updateData.status = 'FAILED';
      logger.error('B2B transfer failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });

      await notifyB2BFailed(transaction, ResultCode, ResultDesc);
    }

    // Step 3: Update transaction
    await transaction.update(updateData);

    // Step 4: Return response
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });

  } catch (error) {
    logger.error('B2B callback processing error:', error);
    return res.json({ ResultCode: 0, ResultDesc: 'Processed' });
  }
}

// Helper function to extract parameter values
function findParameterValue(parameters, key) {
  const parameter = parameters.find(p => p.Key === key);
  return parameter ? parameter.Value : null;
}
```

#### 3. C2B Confirmation Handler

```javascript
async function handleC2BConfirmation(req, res) {
  try {
    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN,
      FirstName,
      LastName
    } = req.body;

    logger.info('C2B confirmation received:', {
      TransID,
      TransAmount,
      MSISDN,
      BillRefNumber
    });

    // Step 1: Check for duplicate transaction
    const existingTransaction = await Transaction.findOne({
      where: { transactionId: TransID }
    });

    if (existingTransaction) {
      logger.warn(`Duplicate C2B transaction: ${TransID}`);
      return res.json({
        ResultCode: 0,
        ResultDesc: 'Confirmation received successfully'
      });
    }

    // Step 2: Create new transaction (C2B transactions are external)
    const transaction = await Transaction.create({
      transactionId: TransID,
      amount: parseFloat(TransAmount),
      phoneNumber: MSISDN,
      transactionType: 'C2B',
      status: 'SUCCESS',
      accountReference: BillRefNumber,
      mpesaReceiptNumber: TransID,
      transactionDesc: `C2B payment from ${FirstName} ${LastName}`,
      rawCallbackData: req.body
    });

    logger.info('C2B transaction created:', {
      transactionId: transaction.id,
      mpesaReceiptNumber: TransID,
      amount: TransAmount
    });

    // Step 3: Process payment based on account reference
    await processC2BPayment(transaction, BillRefNumber);

    // Step 4: Return response
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received successfully'
    });

  } catch (error) {
    logger.error('C2B confirmation processing error:', error);
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received successfully'
    });
  }
}
```

#### 4. Callback Response Handler

```javascript
async function handleCallbackResponse(req, res) {
  // Generic callback handler that returns appropriate response
  try {
    logger.info('Callback received:', req.path);
    logger.info('Callback data:', JSON.stringify(req.body));

    // Process callback (this will be implemented by consuming project)
    await processCallback(req.path, req.body);

    // Always return success to prevent M-Pesa retries
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Processed successfully'
    });

  } catch (error) {
    logger.error('Callback processing error:', error);
    
    // Still return success to M-Pesa
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Processed'
    });
  }
}
```

---

## Database Integration

### Database Schema Design

#### Recommended Table Structure

```sql
CREATE TABLE mpesa_transactions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- M-Pesa transaction identifiers
  merchant_request_id VARCHAR(255),
  checkout_request_id VARCHAR(255),
  transaction_id VARCHAR(255),
  originator_conversation_id VARCHAR(255),
  conversation_id VARCHAR(255),
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  phone_number VARCHAR(20),
  transaction_type VARCHAR(50) NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'PENDING',
  result_code INTEGER,
  result_desc TEXT,
  mpesa_receipt_number VARCHAR(50),
  
  -- Additional metadata
  account_reference VARCHAR(255),
  transaction_desc VARCHAR(255),
  remarks VARCHAR(255),
  
  -- Raw data for debugging
  raw_callback_data JSONB,
  raw_api_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  callback_received_at TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_checkout_request_id ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_merchant_request_id ON mpesa_transactions(merchant_request_id);
CREATE INDEX idx_transaction_id ON mpesa_transactions(transaction_id);
CREATE INDEX idx_conversation_id ON mpesa_transactions(conversation_id);
CREATE INDEX idx_originator_conversation_id ON mpesa_transactions(originator_conversation_id);
CREATE INDEX idx_status ON mpesa_transactions(status);
CREATE INDEX idx_created_at ON mpesa_transactions(created_at);
CREATE INDEX idx_mpesa_receipt_number ON mpesa_transactions(mpesa_receipt_number);

-- Composite indexes for common queries
CREATE INDEX idx_status_created_at ON mpesa_transactions(status, created_at);
CREATE INDEX idx_type_status ON mpesa_transactions(transaction_type, status);
```

### Transaction Types

| Transaction Type | Description | Matching Fields |
|------------------|-------------|-----------------|
| STK_PUSH | Customer payments via mobile prompt | checkout_request_id, merchant_request_id |
| B2C | Business to Customer payments | conversation_id, originator_conversation_id |
| B2B | Business to Business transfers | conversation_id, originator_conversation_id |
| B2POCHI | Business to Pochi wallet payments | conversation_id, originator_conversation_id |
| C2B | Customer to Business payments | transaction_id |
| REVERSAL | Transaction reversals | conversation_id, originator_conversation_id |
| ACCOUNT_BALANCE | Balance queries | conversation_id, originator_conversation_id |
| TRANSACTION_STATUS | Transaction status queries | conversation_id, originator_conversation_id |

### Status Values

| Status | Description | When Set |
|--------|-------------|----------|
| PENDING | Transaction initiated, awaiting callback | On API call success |
| SUCCESS | Transaction completed successfully | On success callback |
| FAILED | Transaction failed | On failure callback |
| CANCELLED | Transaction cancelled by user | On cancel callback (STK Push) |
| TIMEOUT | Transaction timed out | On timeout callback |
| PROCESSING | Transaction being processed | Intermediate state if needed |

### Database Integration Patterns

#### 1. Transaction Creation Pattern

```javascript
async function createTransaction(apiCallData) {
  const {
    amount,
    phoneNumber,
    transactionType,
    accountReference,
    transactionDesc,
    additionalData
  } = apiCallData;

  // Create initial transaction record
  const transaction = await Transaction.create({
    amount: parseFloat(amount),
    phoneNumber: phoneNumber,
    transactionType: transactionType,
    status: 'PENDING',
    accountReference: accountReference,
    transactionDesc: transactionDesc || `${transactionType} transaction`,
    remarks: additionalData?.remarks
  });

  logger.info('Transaction created:', {
    transactionId: transaction.id,
    amount: amount,
    type: transactionType
  });

  return transaction;
}
```

#### 2. Transaction Update Pattern

```javascript
async function updateTransaction(transactionId, updateData) {
  try {
    const transaction = await Transaction.findByPk(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    const updatedTransaction = await transaction.update({
      ...updateData,
      updated_at: new Date(),
      callback_received_at: updateData.status ? new Date() : null
    });

    logger.info('Transaction updated:', {
      transactionId: transactionId,
      status: updatedTransaction.status,
      changes: Object.keys(updateData)
    });

    return updatedTransaction;
  } catch (error) {
    logger.error('Transaction update error:', error);
    throw error;
  }
}
```

#### 3. Transaction Query Pattern

```javascript
async function findTransactionByMpesaReference(mpesaReference, type) {
  const whereConditions = {};

  switch (type) {
    case 'STK_PUSH':
      whereConditions[Op.or] = [
        { checkoutRequestId: mpesaReference },
        { merchantRequestId: mpesaReference }
      ];
      break;
    case 'C2B':
      whereConditions.transactionId = mpesaReference;
      break;
    case 'B2C':
    case 'B2B':
    case 'B2POCHI':
      whereConditions[Op.or] = [
        { conversationId: mpesaReference },
        { originatorConversationId: mpesaReference }
      ];
      break;
    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }

  const transaction = await Transaction.findOne({
    where: whereConditions,
    order: [['createdAt', 'DESC']]
  });

  return transaction;
}
```

#### 4. Bulk Transaction Query Pattern

```javascript
async function getTransactions(filters = {}) {
  const {
    status,
    transactionType,
    startDate,
    endDate,
    phoneNumber,
    limit = 50,
    offset = 0
  } = filters;

  const whereConditions = {};

  if (status) {
    whereConditions.status = status;
  }

  if (transactionType) {
    whereConditions.transactionType = transactionType;
  }

  if (phoneNumber) {
    whereConditions.phoneNumber = phoneNumber;
  }

  if (startDate || endDate) {
    whereConditions.createdAt = {};
    if (startDate) {
      whereConditions.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereConditions.createdAt[Op.lte] = new Date(endDate);
    }
  }

  const { count, rows } = await Transaction.findAndCountAll({
    where: whereConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  return {
    total: count,
    transactions: rows,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(count / limit)
  };
}
```

---

## Complete Integration Examples

### 1. Complete STK Push Integration

```javascript
const express = require('express');
const axios = require('axios');
const { Transaction } = require('./models'); // Your transaction model
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

// STK Push endpoint
app.post('/api/mpesa/stkpush/initiate', async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

    // Step 1: Validate input
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount'
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Step 2: Create initial transaction
    const transaction = await Transaction.create({
      amount: parseFloat(amount),
      phoneNumber: phoneNumber,
      transactionType: 'STK_PUSH',
      status: 'PENDING',
      accountReference: accountReference,
      transactionDesc: transactionDesc || 'STK Push payment'
    });

    logger.info('STK Push transaction created:', transaction.id);

    // Step 3: Call M-Pesa API
    const mpesaResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: generateSTKPushPassword(),
        Timestamp: getCurrentTimestamp(),
        TransactionType: 'CustomerPayBillOnline',
        Amount: parseInt(amount),
        PartyA: formatPhoneNumber(phoneNumber),
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formatPhoneNumber(phoneNumber),
        CallBackURL: `${process.env.CALLBACK_URL}/api/mpesa/callback/stkpush`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc || 'Payment'
      },
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`
        }
      }
    );

    // Step 4: Update transaction with API response
    if (mpesaResponse.data.ResponseCode === '0') {
      await transaction.update({
        checkoutRequestId: mpesaResponse.data.CheckoutRequestID,
        merchantRequestId: mpesaResponse.data.MerchantRequestID,
        rawApiResponse: mpesaResponse.data
      });

      logger.info('STK Push successful:', {
        transactionId: transaction.id,
        checkoutRequestId: mpesaResponse.data.CheckoutRequestID
      });

      return res.json({
        success: true,
        transactionId: transaction.id,
        checkoutRequestId: mpesaResponse.data.CheckoutRequestID,
        message: 'STK Push initiated successfully',
        data: mpesaResponse.data
      });
    } else {
      // API call failed
      await transaction.update({
        status: 'FAILED',
        resultCode: mpesaResponse.data.ResponseCode,
        resultDesc: mpesaResponse.data.ResponseDescription,
        rawApiResponse: mpesaResponse.data
      });

      logger.error('STK Push API failed:', mpesaResponse.data);

      return res.status(400).json({
        success: false,
        error: mpesaResponse.data.ResponseDescription,
        transactionId: transaction.id
      });
    }

  } catch (error) {
    logger.error('STK Push error:', error);
    
    // Update transaction if it exists
    if (transaction) {
      await transaction.update({
        status: 'FAILED',
        resultDesc: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to initiate STK Push',
      details: error.message
    });
  }
});

// STK Push callback handler
app.post('/api/mpesa/callback/stkpush', async (req, res) => {
  try {
    const { Body } = req.body;
    const { CheckoutRequestID, ResultCode, ResultDesc, MerchantRequestID } = Body.stkCallback;

    logger.info('STK Push callback received:', { CheckoutRequestID, ResultCode });

    // Step 1: Find transaction
    const transaction = await Transaction.findOne({
      where: { checkoutRequestId: CheckoutRequestID }
    });

    if (!transaction) {
      logger.warn(`Transaction not found: ${CheckoutRequestID}`);
      return res.json({ ResultCode: 0, ResultDesc: 'Processed' });
    }

    // Step 2: Update transaction
    let updateData = {
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: req.body,
      callback_received_at: new Date()
    };

    if (ResultCode === 0) {
      // Success
      const metadata = Body.stkCallback.CallbackMetadata.Item;
      const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;

      updateData.status = 'SUCCESS';
      updateData.mpesaReceiptNumber = receiptNumber;

      logger.info('STK Push successful:', {
        transactionId: transaction.id,
        receiptNumber
      });

      // Trigger success notification
      await sendSuccessNotification(transaction, receiptNumber);

    } else if (ResultCode === 1032) {
      // Cancelled
      updateData.status = 'CANCELLED';
      logger.info('STK Push cancelled:', { transactionId: transaction.id });
      await sendCancellationNotification(transaction);

    } else {
      // Failed
      updateData.status = 'FAILED';
      logger.error('STK Push failed:', { transactionId: transaction.id, ResultCode });
      await sendFailureNotification(transaction, ResultCode);
    }

    await transaction.update(updateData);

    // Step 3: Return success response
    return res.json({
      ResultCode: 0,
      ResultDesc: 'Success',
      ThirdPartyTransID: MerchantRequestID
    });

  } catch (error) {
    logger.error('STK Push callback error:', error);
    return res.json({ ResultCode: 0, ResultDesc: 'Processed' });
  }
});
```

### 2. Complete B2B Integration

```javascript
// B2B payment endpoint
app.post('/api/mpesa/b2b/transfer', async (req, res) => {
  try {
    const {
      initiatorName,
      securityCredential,
      amount,
      partyA,
      partyB,
      accountReference,
      remarks
    } = req.body;

    // Step 1: Validate input
    if (!amount || !partyA || !partyB) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, partyA, partyB'
      });
    }

    // Step 2: Create transaction
    const originatorConversationID = generateOriginatorConversationID();
    const transaction = await Transaction.create({
      amount: parseFloat(amount),
      phoneNumber: partyB,
      transactionType: 'B2B',
      status: 'PENDING',
      originatorConversationId: originatorConversationID,
      accountReference: accountReference,
      remarks: remarks || 'B2B transfer',
      transactionDesc: `Transfer to ${partyB}`
    });

    logger.info('B2B transaction created:', transaction.id);

    // Step 3: Call M-Pesa API
    const mpesaResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest',
      {
        Initiator: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: 'BusinessPayBill',
        SenderIdentifierType: '4',
        RecieverIdentifierType: '4',
        Amount: amount.toString(),
        PartyA: partyA,
        PartyB: partyB,
        AccountReference: accountReference,
        Remarks: remarks || 'B2B Payment',
        QueueTimeOutURL: `${process.env.CALLBACK_URL}/api/mpesa/timeout`,
        ResultURL: `${process.env.CALLBACK_URL}/api/mpesa/callback/b2b`,
        OriginatorConversationID: originatorConversationID
      },
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`
        }
      }
    );

    // Step 4: Update transaction with response
    if (mpesaResponse.data.ResponseCode === '0') {
      await transaction.update({
        conversationId: mpesaResponse.data.ConversationID,
        rawApiResponse: mpesaResponse.data
      });

      logger.info('B2B transfer initiated:', {
        transactionId: transaction.id,
        conversationId: mpesaResponse.data.ConversationID
      });

      return res.json({
        success: true,
        transactionId: transaction.id,
        conversationId: mpesaResponse.data.ConversationID,
        message: 'B2B transfer initiated successfully',
        data: mpesaResponse.data
      });
    } else {
      await transaction.update({
        status: 'FAILED',
        resultCode: mpesaResponse.data.ResponseCode,
        resultDesc: mpesaResponse.data.ResponseDescription
      });

      return res.status(400).json({
        success: false,
        error: mpesaResponse.data.ResponseDescription
      });
    }

  } catch (error) {
    logger.error('B2B transfer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate B2B transfer',
      details: error.message
    });
  }
});

// B2B callback handler
app.post('/api/mpesa/callback/b2b', async (req, res) => {
  try {
    const { Result } = req.body;

    if (!Result) {
      return res.json({ ResultCode: 1, ResultDesc: 'Invalid format' });
    }

    const { ResultCode, ConversationID, OriginatorConversationID } = Result;

    // Find transaction
    const transaction = await Transaction.findOne({
      where: {
        [Op.or]: [
          { conversationId: ConversationID },
          { originatorConversationId: OriginatorConversationID }
        ]
      }
    });

    if (!transaction) {
      logger.warn(`B2B transaction not found: ${ConversationID}`);
      return res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    // Update transaction
    let updateData = {
      resultCode: ResultCode,
      resultDesc: Result.ResultDesc,
      rawCallbackData: req.body,
      callback_received_at: new Date()
    };

    if (ResultCode === 0) {
      const parameters = Result.ResultParameters?.ResultParameter || [];
      const receiptNo = findParameterValue(parameters, 'TransactionReceipt');
      
      updateData.status = 'SUCCESS';
      updateData.mpesaReceiptNumber = receiptNo;
      updateData.transactionId = findParameterValue(parameters, 'TransactionID');

      logger.info('B2B transfer successful:', {
        transactionId: transaction.id,
        receiptNo
      });

    } else {
      updateData.status = 'FAILED';
      logger.error('B2B transfer failed:', {
        transactionId: transaction.id,
        ResultCode
      });
    }

    await transaction.update(updateData);

    return res.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    logger.error('B2B callback error:', error);
    return res.json({ ResultCode: 0, ResultDesc: 'Processed' });
  }
});
```

### 3. Complete Query Integration

```javascript
// Transaction query endpoint
app.get('/api/mpesa/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Step 1: Query local database
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Step 2: If pending, check M-Pesa status
    let mpesaStatus = null;
    if (transaction.status === 'PENDING' && transaction.merchantRequestId) {
      try {
        mpesaStatus = await checkMpesaTransactionStatus(transaction.merchantRequestId);
      } catch (error) {
        logger.error('Failed to check M-Pesa status:', error);
      }
    }

    return res.json({
      success: true,
      data: {
        transaction: transaction.toJSON(),
        mpesaStatus: mpesaStatus
      }
    });

  } catch (error) {
    logger.error('Transaction query error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to query transaction',
      details: error.message
    });
  }
});

// Transaction list endpoint
app.get('/api/mpesa/transactions', async (req, res) => {
  try {
    const {
      status,
      transactionType,
      phoneNumber,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const whereConditions = {};

    if (status) whereConditions.status = status;
    if (transactionType) whereConditions.transactionType = transactionType;
    if (phoneNumber) whereConditions.phoneNumber = phoneNumber;

    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        transactions: rows,
        total: count,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Transaction list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      details: error.message
    });
  }
});
```

---

## Error Handling

### Comprehensive Error Handler

```javascript
class MpesaErrorHandler {
  static handle(error, context = {}) {
    logger.error('M-Pesa error:', {
      message: error.message,
      context: context,
      stack: error.stack
    });

    // Classify error types
    if (error.response) {
      // M-Pesa API error
      return this.handleMpesaApiError(error, context);
    } else if (error.request) {
      // Network error
      return this.handleNetworkError(error, context);
    } else {
      // Application error
      return this.handleApplicationError(error, context);
    }
  }

  static handleMpesaApiError(error, context) {
    const { response } = error;
    const errorCode = response.data?.errorCode || response.status;
    const errorMessage = response.data?.errorMessage || response.statusText;

    const errorMap = {
      '401.002.01': 'Invalid Consumer Key',
      '401.002.02': 'Invalid Consumer Secret',
      '401.002.03': 'Invalid Security Credential',
      '2001': 'Insufficient balance',
      '2002': 'Insufficient balance',
      '2003': 'Invalid amount',
      '2004': 'Invalid phone number',
      '2005': 'Invalid shortcode',
      '2006': 'Invalid security credential'
    };

    return {
      success: false,
      error: errorMap[errorCode] || errorMessage,
      errorCode: errorCode,
      context: context
    };
  }

  static handleNetworkError(error, context) {
    return {
      success: false,
      error: 'Network error: Unable to connect to M-Pesa API',
      details: error.message,
      context: context
    };
  }

  static handleApplicationError(error, context) {
    return {
      success: false,
      error: 'Application error: ' + error.message,
      details: error.stack,
      context: context
    };
  }
}

// Usage example
app.post('/api/mpesa/stkpush/initiate', async (req, res) => {
  try {
    // Your logic here
  } catch (error) {
    const handledError = MpesaErrorHandler.handle(error, {
      endpoint: '/api/mpesa/stkpush/initiate',
      body: req.body
    });

    return res.status(500).json(handledError);
  }
});
```

---

## Best Practices

### 1. Transaction Management

```javascript
// Always create transaction record before API call
async function initiateTransaction(apiCall) {
  const transaction = await Transaction.create({
    amount: apiCall.amount,
    transactionType: apiCall.type,
    status: 'PENDING'
  });

  try {
    const response = await apiCall.execute();
    await transaction.update({ 
      status: 'PENDING',
      rawApiResponse: response 
    });
    return { transaction, response };
  } catch (error) {
    await transaction.update({ 
      status: 'FAILED',
      resultDesc: error.message 
    });
    throw error;
  }
}
```

### 2. Idempotency Handling

```javascript
// Handle duplicate callbacks
async function processCallback(callbackType, callbackData) {
  const identifier = getCallbackIdentifier(callbackType, callbackData);
  
  const existingCallback = await ProcessedCallback.findOne({
    where: { identifier }
  });

  if (existingCallback) {
    logger.info('Duplicate callback ignored:', identifier);
    return;
  }

  // Process callback
  await processTransaction(callbackType, callbackData);

  // Record processed callback
  await ProcessedCallback.create({
    identifier,
    callbackType,
    processedAt: new Date()
  });
}
```

### 3. Monitoring and Alerts

```javascript
// Set up monitoring for failed transactions
async function monitorFailedTransactions() {
  const failedTransactions = await Transaction.findAll({
    where: { status: 'FAILED' },
    limit: 100,
    order: [['createdAt', 'DESC']]
  });

  if (failedTransactions.length > 10) {
    await sendAlert('High number of failed transactions', {
      count: failedTransactions.length,
      recentTransactions: failedTransactions.slice(0, 10)
    });
  }
}

// Monitor pending transactions timeout
async function monitorTimeouts() {
  const timeoutThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

  const timedOutTransactions = await Transaction.findAll({
    where: {
      status: 'PENDING',
      createdAt: { [Op.lt]: timeoutThreshold }
    }
  });

  for (const transaction of timedOutTransactions) {
    await transaction.update({ status: 'TIMEOUT' });
    await notifyTransactionTimeout(transaction);
  }
}
```

### 4. Logging Strategy

```javascript
// Comprehensive logging
function logTransactionEvent(transaction, event, data = {}) {
  logger.info('Transaction event:', {
    transactionId: transaction.id,
    event: event,
    status: transaction.status,
    amount: transaction.amount,
    type: transaction.transactionType,
    ...data
  });
}

// Usage examples
logTransactionEvent(transaction, 'INITIATED');
logTransactionEvent(transaction, 'API_CALL_SUCCESS', { mpesaResponse });
logTransactionEvent(transaction, 'CALLBACK_RECEIVED', { callbackData });
logTransactionEvent(transaction, 'COMPLETED', { receiptNumber });
```

### 5. Retry Strategy

```javascript
// Implement exponential backoff for retries
async function retryApiCall(apiCall, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      logger.warn(`API call failed, retrying in ${delay}ms...`, {
        attempt: attempt,
        error: error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

---

## Conclusion

This comprehensive guide covers all aspects of integrating with the M-Pesa service:

1. **Response Handling**: Understanding success and failure patterns
2. **Callback Processing**: Implementing robust callback handlers
3. **Database Integration**: Creating and managing transaction records
4. **Complete Examples**: Ready-to-use integration patterns
5. **Error Handling**: Comprehensive error management
6. **Best Practices**: Industry-standard implementation patterns

By following this guide, consuming projects can successfully integrate M-Pesa services with proper database persistence, error handling, and monitoring.