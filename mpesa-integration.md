# 🚀 Secure M-Pesa Service: Integration Guide

This guide provides a comprehensive overview of how to integrate and use the `secure-mpesa-service` package in your projects.

---

## 1. Installation & Setup

- Already installed

## 2. Initialization

You should initialize the package and connect the database before making any requests.

```javascript
const MpesaPackage = require('secure-mpesa-service');

// 1. Create Instance
// Options are optional if .env is set up
const mpesa = new MpesaPackage({
  environment: 'sandbox' 
});

async function setup() {
  try {
    // 2. Connect Database (Creates 'Transactions' table if it doesn't exist)
    await mpesa.connectDatabase();
    
    // 3. Initialize/Validate (Fetches initial OAuth token)
    await mpesa.init();
    
    console.log("M-Pesa Service Ready");
  } catch (error) {
    console.error("Setup failed", error);
  }
}

setup();
```

---

## 3. API Reference

### 📱 STK Push (Lipa Na M-Pesa Online)
Initiates a payment prompt on the user's phone.

```javascript
const result = await mpesa.stkPush({
  phoneNumber: '2547XXXXXXXX',
  amount: 10,
  accountReference: 'Order #123',
  transactionDesc: 'Payment for goods',
  callbackURL: 'https://your-api.com/stk-callback' // Optional override
});
```

### 💸 B2C (Business to Customer)
Sending money from your business to a customer (Payouts/Salary).

```javascript
const result = await mpesa.b2c({
  amount: 100,
  partyB: '2547XXXXXXXX',
  remarks: 'Salary Payment',
  commandID: 'SalaryPayment' // BusinessPayment, SalaryPayment, PromotionPayment
});
```

### 🏢 B2B (Business to Business)
Transferring funds between two business shortcodes.

```javascript
const result = await mpesa.b2b({
  amount: 1000,
  partyA: 'Shortcode_A',
  partyB: 'Shortcode_B',
  accountReference: 'Invoice_456',
  remarks: 'Stock Purchase'
});
```

### 🛍️ B2Pochi (Business to Pochi La Biashara)
Specialized payment to a Pochi La Biashara wallet.

```javascript
const result = await mpesa.b2pochi({
  amount: 50,
  partyB: '2547XXXXXXXX',
  remarks: 'Payment to Vendor'
});
```

### 📥 C2B (Customer to Business)
Used for Paybill or Buy Goods integration.

```javascript
// 1. Register URLs (Do this once)
await mpesa.c2bRegister({
  shortCode: '174379',
  confirmationURL: 'https://your-api.com/confirm',
  validationURL: 'https://your-api.com/validate'
});

// 2. Simulate (Testing only)
await mpesa.c2bSimulate({
  amount: 100,
  msisdn: '2547XXXXXXXX',
  billRefNumber: 'INV001'
});
```

### 🔍 Transaction Status & Balance
```javascript
// Check status of a specific transaction
const status = await mpesa.transactionStatus({
  transactionID: 'OXXXXXXXXX',
  remarks: 'Checking payment status'
});

// Check account balance
const balance = await mpesa.accountBalance({
  remarks: 'Daily balance check'
});
```

### 🔄 Reversal
Request a reversal for a transaction.

```javascript
const reversal = await mpesa.reversal({
  transactionID: 'OXXXXXXXXX',
  amount: 10,
  remarks: 'Wrong entry'
});
```

---

## 4. Advanced Usage

### Runtime Configuration
You can update credentials at runtime without restarting the app:

```javascript
mpesa.setConfig({
  shortCode: 'NEW_SHORTCODE',
  passKey: 'NEW_PASSKEY'
});
```
