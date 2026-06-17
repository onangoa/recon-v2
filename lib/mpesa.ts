// @ts-ignore
import MpesaPackage from 'secure-mpesa-service';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'http://localhost:3010/api/callbacks/mpesa';
const MPESA_ENVIRONMENT = (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

// Initialize M-Pesa package
const mpesa = new MpesaPackage({
  consumerKey: MPESA_CONSUMER_KEY,
  consumerSecret: MPESA_CONSUMER_SECRET,
  shortCode: MPESA_SHORTCODE,
  passKey: MPESA_PASSKEY,
  environment: MPESA_ENVIRONMENT
});

let isInitialized = false;

const ensureInitialized = async () => {
  if (!isInitialized) {
    try {
      // 2. Connect Database (Creates 'Transactions' table if it doesn't exist)
      await mpesa.connectDatabase();
      
      // 3. Initialize/Validate (Fetches initial OAuth token)
      await mpesa.init();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize M-Pesa package:', error);
      throw error;
    }
  }
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

export const initiateSTKPush = async (phoneNumber: string, amount: number, walletId: string, transactionDesc: string) => {
  await ensureInitialized();
  
  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const result = await mpesa.stkPush({
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      accountReference: walletId, // Use walletId for tracking
      transactionDesc: transactionDesc || 'Payment',
      callbackURL: `${MPESA_CALLBACK_URL}/stkpush`
    });
    
    return {
      CheckoutRequestID: result.CheckoutRequestID,
      MerchantRequestID: result.MerchantRequestID,
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription,
      CustomerMessage: result.CustomerMessage
    };
  } catch (error: any) {
    console.error('STK Push Error:', error);
    throw new Error(error.message || 'Failed to initiate STK Push');
  }
};

export const initiateB2C = async (phoneNumber: string, amount: number, commandID: string, remarks: string, occasion: string) => {
  await ensureInitialized();

  try {
    const result = await mpesa.b2c({
      amount: Math.round(amount),
      partyB: formatPhoneNumber(phoneNumber),
      remarks: remarks || 'B2C Payment',
      commandID: commandID || 'BusinessPayment'
    });
    
    return {
      ConversationID: result.ConversationID,
      OriginatorConversationID: result.OriginatorConversationID,
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2C Error:', error);
    throw new Error(error.message || 'Failed to initiate B2C payment');
  }
};

export const initiateB2Pochi = async (phoneNumber: string, amount: number, remarks: string) => {
  await ensureInitialized();

  try {
    const result = await mpesa.b2pochi({
      amount: Math.round(amount),
      partyB: formatPhoneNumber(phoneNumber),
      remarks: remarks || 'Pochi Payment'
    });
    
    return {
      ConversationID: result.ConversationID,
      OriginatorConversationID: result.OriginatorConversationID,
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2Pochi Error:', error);
    throw new Error(error.message || 'Failed to initiate Pochi payment');
  }
};

export const initiateB2B = async (receiverShortCode: string, amount: number, commandID: string, accountReference: string, remarks: string) => {
  await ensureInitialized();

  try {
    const result = await mpesa.b2b({
      amount: Math.round(amount),
      partyA: MPESA_SHORTCODE,
      partyB: receiverShortCode,
      accountReference,
      remarks: remarks || 'B2B Payment'
    });
    
    return {
      ConversationID: result.ConversationID,
      OriginatorConversationID: result.OriginatorConversationID,
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription
    };
  } catch (error: any) {
    console.error('B2B Error:', error);
    throw new Error(error.message || 'Failed to initiate B2B payment');
  }
};

export const checkTransactionStatus = async (transactionID: string, remarks: string = 'Status Query') => {
  await ensureInitialized();

  try {
    const result = await mpesa.transactionStatus({
      transactionID,
      remarks
    });
    
    return {
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription,
      Result: result.Result
    };
  } catch (error: any) {
    console.error('Transaction Status Error:', error);
    throw new Error('Failed to query transaction status');
  }
};

export const checkAccountBalance = async (remarks: string = 'Balance Query') => {
  await ensureInitialized();

  try {
    const result = await mpesa.accountBalance({
      remarks
    });
    
    return {
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription,
      Result: result.Result
    };
  } catch (error: any) {
    console.error('Account Balance Error:', error);
    throw new Error('Failed to query account balance');
  }
};

export const initiateReversal = async (transactionID: string, amount: number, remarks: string = 'Reversal Request') => {
  await ensureInitialized();

  try {
    const result = await mpesa.reversal({
      transactionID,
      amount: Math.round(amount),
      remarks
    });
    
    return {
      ConversationID: result.ConversationID,
      OriginatorConversationID: result.OriginatorConversationID,
      ResponseCode: result.ResponseCode,
      ResponseDescription: result.ResponseDescription
    };
  } catch (error: any) {
    console.error('Reversal Error:', error);
    throw new Error('Failed to initiate reversal');
  }
};
