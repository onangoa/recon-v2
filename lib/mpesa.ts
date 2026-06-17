import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'http://localhost:3010/api/callbacks/mpesa';
const MPESA_B2C_SHORTCODE = process.env.MPESA_B2C_SHORTCODE || '';
const MPESA_INITIATOR_NAME = process.env.MPESA_INITIATOR_NAME || '';
const MPESA_INITIATOR_PASSWORD = process.env.MPESA_INITIATOR_PASSWORD || '';
const MPESA_CERT_PATH = process.env.MPESA_CERT_PATH || '';
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
  console.warn('WARNING: MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are not set in environment variables');
}

if (!MPESA_SHORTCODE || !MPESA_PASSKEY) {
  console.warn('WARNING: MPESA_SHORTCODE and MPESA_PASSKEY are not set in environment variables');
}

const BASE_URL = MPESA_ENVIRONMENT === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

const MPESA_URLS = {
  production: {
    auth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkPushQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    b2c: 'https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest',
    b2b: 'https://api.safaricom.co.ke/mpesa/b2b/v1/paymentrequest',
    b2pochi: 'https://api.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest',
    accountBalance: 'https://api.safaricom.co.ke/mpesa/accountbalance/v1/query',
    transactionStatus: 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query',
    reversal: 'https://api.safaricom.co.ke/mpesa/reversal/v1/request'
  },
  sandbox: {
    auth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkPushQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    b2c: 'https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest',
    b2b: 'https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest',
    b2pochi: 'https://sandbox.safaricom.co.ke/mpesa/b2pochi/v1/paymentrequest',
    accountBalance: 'https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query',
    transactionStatus: 'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query',
    reversal: 'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request'
  }
};

const getUrl = () => MPESA_URLS[MPESA_ENVIRONMENT as keyof typeof MPESA_URLS];

let accessTokenCache: string | null = null;
let tokenExpiry: number | null = null;

const getAccessToken = async (): Promise<string> => {
  try {
    if (accessTokenCache && tokenExpiry && Date.now() < tokenExpiry) {
      return accessTokenCache;
    }

    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error('MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are required');
    }

    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const urls = getUrl();

    const response = await axios.get(urls.auth, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    accessTokenCache = response.data.access_token;
    tokenExpiry = Date.now() + (3500 * 1000);

    console.log(`Access token obtained successfully`);
    
    if (!accessTokenCache) {
      throw new Error('Failed to obtain access token from response');
    }
    
    return accessTokenCache;
  } catch (error: any) {
    console.error('Error getting access token:', error.message);
    throw new Error('Failed to get access token');
  }
};

const generateSecurityCredential = (password: string): string => {
  if (!MPESA_CERT_PATH || !fs.existsSync(MPESA_CERT_PATH)) {
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

const formatPhoneNumber = (phoneNumber: string): string => {
  let formattedPhone = phoneNumber.toString().replace(/\s+/g, '').replace(/[-+]/g, '');
  
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  return formattedPhone;
};

const generateOriginatorConversationID = (): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomString}`;
};

const validateRequiredParams = (phoneNumber: string, amount: number) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Valid phone number is required');
  }
  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required');
  }
};

export const initiateSTKPush = async (phoneNumber: string, amount: number, accountReference: string, transactionDesc: string) => {
  validateRequiredParams(phoneNumber, amount);
  
  const token = await getAccessToken();
  const urls = getUrl();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  if (!MPESA_SHORTCODE || !MPESA_PASSKEY) {
    throw new Error('MPESA_SHORTCODE and MPESA_PASSKEY are required');
  }
  
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: `${MPESA_CALLBACK_URL}/stk`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc || 'Payment'
  };

  try {
    const response = await axios.post(urls.stkPush, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      CheckoutRequestID: response.data.CheckoutRequestID,
      MerchantRequestID: response.data.MerchantRequestID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription,
      CustomerMessage: response.data.CustomerMessage
    };
  } catch (error: any) {
    console.error('STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || error.response?.data?.CustomerMessage || 'Failed to initiate STK Push');
  }
};

export const initiateB2C = async (phoneNumber: string, amount: number, commandID: string, remarks: string, occasion: string) => {
  const token = await getAccessToken();
  const urls = getUrl();
  const originatorConversationID = generateOriginatorConversationID();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    OriginatorConversationID: originatorConversationID,
    InitiatorName: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: commandID || 'BusinessPayment',
    Amount: Math.round(amount).toString(),
    PartyA: MPESA_B2C_SHORTCODE || MPESA_SHORTCODE,
    PartyB: formatPhoneNumber(phoneNumber),
    Remarks: remarks || 'B2C Payment',
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/timeout`,
    ResultURL: `${MPESA_CALLBACK_URL}/payout-result`,
    Occasion: occasion || ''
  };

  try {
    const response = await axios.post(urls.b2c, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ConversationID: response.data.ConversationID,
      OriginatorConversationID: response.data.OriginatorConversationID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2C Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate B2C payment');
  }
};

export const initiateB2Pochi = async (phoneNumber: string, amount: number, remarks: string, occasion: string) => {
  const token = await getAccessToken();
  const urls = getUrl();
  const originatorConversationID = generateOriginatorConversationID();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    OriginatorConversationID: originatorConversationID,
    InitiatorName: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayToPochi',
    Amount: Math.round(amount).toString(),
    PartyA: MPESA_SHORTCODE,
    PartyB: formatPhoneNumber(phoneNumber),
    Remarks: remarks || 'Pochi Payment',
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/timeout`,
    ResultURL: `${MPESA_CALLBACK_URL}/b2pochi`,
    Occasion: occasion || ''
  };

  try {
    const response = await axios.post(urls.b2pochi, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ConversationID: response.data.ConversationID,
      OriginatorConversationID: response.data.OriginatorConversationID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2Pochi Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate Pochi payment');
  }
};

export const initiateB2B = async (receiverShortCode: string, amount: number, commandID: string, accountReference: string, remarks: string) => {
  const token = await getAccessToken();
  const urls = getUrl();
  const originatorConversationID = generateOriginatorConversationID();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: commandID || 'BusinessPayBill',
    SenderIdentifierType: '4',
    RecieverIdentifierType: '4',
    Amount: Math.round(amount).toString(),
    PartyA: MPESA_B2C_SHORTCODE || MPESA_SHORTCODE,
    PartyB: receiverShortCode,
    AccountReference: accountReference,
    Remarks: remarks || 'B2B Payment',
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/timeout`,
    ResultURL: `${MPESA_CALLBACK_URL}/payout-result`,
    Occasion: ''
  };

  try {
    const response = await axios.post(urls.b2b, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ConversationID: response.data.ConversationID,
      OriginatorConversationID: response.data.OriginatorConversationID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2B Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate B2B payment');
  }
};

export const checkTransactionStatus = async (transactionID: string, remarks: string = 'Status Query') => {
  const token = await getAccessToken();
  const urls = getUrl();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionStatusQuery',
    TransactionID: transactionID,
    PartyA: MPESA_SHORTCODE,
    IdentifierType: '4',
    ResultURL: `${MPESA_CALLBACK_URL}/status-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/status-timeout`,
    Remarks: remarks,
    Occasion: ''
  };

  try {
    const response = await axios.post(urls.transactionStatus, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription,
      Result: response.data.Result
    };
  } catch (error: any) {
    console.error('Transaction Status Error:', error.response?.data || error.message);
    throw new Error('Failed to query transaction status');
  }
};

export const checkAccountBalance = async (remarks: string = 'Balance Query') => {
  const token = await getAccessToken();
  const urls = getUrl();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'AccountBalance',
    PartyA: MPESA_SHORTCODE,
    IdentifierType: '4',
    ResultURL: `${MPESA_CALLBACK_URL}/balance-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/balance-timeout`,
    Remarks: remarks
  };

  try {
    const response = await axios.post(urls.accountBalance, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription,
      Result: response.data.Result
    };
  } catch (error: any) {
    console.error('Account Balance Error:', error.response?.data || error.message);
    throw new Error('Failed to query account balance');
  }
};

export const initiateReversal = async (transactionID: string, amount: number, remarks: string = 'Reversal Request') => {
  const token = await getAccessToken();
  const urls = getUrl();
  const securityCredential = generateSecurityCredential(MPESA_INITIATOR_PASSWORD);

  const payload = {
    Initiator: MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionReversal',
    TransactionID: transactionID,
    Amount: Math.round(amount).toString(),
    ReceiverParty: MPESA_SHORTCODE,
    RecieverIdentifierType: '4',
    ResultURL: `${MPESA_CALLBACK_URL}/reversal-result`,
    QueueTimeOutURL: `${MPESA_CALLBACK_URL}/reversal-timeout`,
    Remarks: remarks,
    Occasion: ''
  };

  try {
    const response = await axios.post(urls.reversal, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ConversationID: response.data.ConversationID,
      OriginatorConversationID: response.data.OriginatorConversationID,
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription
    };
  } catch (error: any) {
    console.error('Reversal Error:', error.response?.data || error.message);
    throw new Error('Failed to initiate reversal');
  }
};

export const queryStkPush = async (checkoutRequestID: string) => {
  const token = await getAccessToken();
  const urls = getUrl();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID
  };

  try {
    const response = await axios.post(urls.stkPushQuery, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      ResponseCode: response.data.ResponseCode,
      ResponseDescription: response.data.ResponseDescription,
      ResultCode: response.data.ResultCode,
      ResultDesc: response.data.ResultDesc,
      MerchantRequestID: response.data.MerchantRequestID,
      CheckoutRequestID: response.data.CheckoutRequestID
    };
  } catch (error: any) {
    console.error('STK Push Query Error:', error.response?.data || error.message);
    throw new Error('Failed to query STK Push status');
  }
};