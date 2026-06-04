import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';
const MPESA_B2C_SHORTCODE = process.env.MPESA_B2C_SHORTCODE || '';
const MPESA_INITIATOR_NAME = process.env.MPESA_INITIATOR_NAME || '';
const MPESA_INITIATOR_PASSWORD = process.env.MPESA_INITIATOR_PASSWORD || '';
const MPESA_CERT_PATH = process.env.MPESA_CERT_PATH || '';

const BASE_URL = process.env.MPESA_ENVIRONMENT === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

const getAccessToken = async () => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    console.error('M-Pesa Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
};

const generateSecurityCredential = (password: string) => {
  if (!MPESA_CERT_PATH || !fs.existsSync(MPESA_CERT_PATH)) {
    // Fallback for sandbox if no cert provided, though sandbox usually accepts raw password or simple b64
    // But for production, the cert is MANDATORY.
    return Buffer.from(password).toString('base64');
  }

  const cert = fs.readFileSync(MPESA_CERT_PATH, 'utf8');
  const buffer = Buffer.from(password);
  const encrypted = crypto.publicEncrypt(
    {
      key: cert,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString('base64');
};

export const initiateSTKPush = async (phoneNumber: string, amount: number, accountReference: string, transactionDesc: string) => {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${MPESA_CALLBACK_URL}/stk`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.CustomerMessage || 'Failed to initiate STK Push');
  }
};

export const initiateB2C = async (phoneNumber: string, amount: number, commandID: string, remarks: string, occasion: string) => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    InitiatorName: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: commandID, // SalaryPayment, BusinessPayment, PromotionPayment
    Amount: Math.round(amount),
    PartyA: MPESA_B2C_SHORTCODE,
    PartyB: phoneNumber,
    Remarks: remarks,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/payout-timeout`,
    ResultURL: `${MPESA_CALLBACK_URL}/payout-result`,
    Occasion: occasion,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/b2c/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('B2C Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate B2C payment');
  }
};

export const initiateB2B = async (receiverShortCode: string, amount: number, commandID: string, accountReference: string, remarks: string) => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: commandID, // BusinessPayBill, BusinessBuyGoods, DisburseFundsToBusiness, BusinessToBusinessTransfer, MerchantToMerchantTransfer
    SenderIdentifierType: '4', // 4 for Shortcode
    RecieverIdentifierType: '4', // 4 for Shortcode
    Amount: Math.round(amount),
    PartyA: MPESA_B2C_SHORTCODE,
    PartyB: receiverShortCode,
    AccountReference: accountReference,
    Remarks: remarks,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/payout-timeout`,
    ResultURL: `${MPESA_CALLBACK_URL}/payout-result`,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/b2b/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('B2B Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate B2B payment');
  }
};

export const checkTransactionStatus = async (transactionID: string, remarks: string = 'Status Query') => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionStatusQuery',
    TransactionID: transactionID,
    PartyA: MPESA_SHORTCODE,
    IdentifierType: '4', // Shortcode
    ResultURL: `${MPESA_CALLBACK_URL}/status-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/status-timeout`,
    Remarks: remarks,
    Occasion: '',
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/transactionstatus/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Transaction Status Error:', error.response?.data || error.message);
    throw new Error('Failed to query transaction status');
  }
};

export const checkAccountBalance = async (remarks: string = 'Balance Query') => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'AccountBalance',
    PartyA: MPESA_SHORTCODE,
    IdentifierType: '4', // Shortcode
    ResultURL: `${MPESA_CALLBACK_URL}/balance-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/balance-timeout`,
    Remarks: remarks,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/accountbalance/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Account Balance Error:', error.response?.data || error.message);
    throw new Error('Failed to query account balance');
  }
};

export const initiateReversal = async (transactionID: string, amount: number, remarks: string = 'Reversal Request') => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionReversal',
    TransactionID: transactionID,
    Amount: Math.round(amount),
    ReceiverParty: MPESA_SHORTCODE,
    RecieverIdentifierType: '11', // Shortcode
    ResultURL: `${MPESA_CALLBACK_URL}/reversal-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/reversal-timeout`,
    Remarks: remarks,
    Occasion: '',
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/reversal/v1/request`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Reversal Error:', error.response?.data || error.message);
    throw new Error('Failed to initiate reversal');
  }
};
