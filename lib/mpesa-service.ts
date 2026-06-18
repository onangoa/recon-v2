import MpesaPackage from 'mpesa-servc';
import { prisma } from '@/lib/prisma';

// M-Pesa Configuration
export const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
export const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
export const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
export const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
export const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'http://localhost:3010/api/callbacks/mpesa';
export const MPESA_ENVIRONMENT = (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

// Transaction Status Enum
export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
  PENDING_APPROVAL = 'PENDING_APPROVAL'
}

// Transaction Type Enum
export enum TransactionType {
  STK_PUSH = 'STK_PUSH',
  B2C = 'B2C',
  B2B = 'B2B',
  C2B = 'C2B',
  B2POCHI = 'B2POCHI',
  ACCOUNT_BALANCE = 'ACCOUNT_BALANCE',
  TRANSACTION_STATUS = 'TRANSACTION_STATUS',
  REVERSAL = 'REVERSAL'
}

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
      await mpesa.init();
      isInitialized = true;
      console.log('M-Pesa service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize M-Pesa package:', error);
      throw error;
    }
  }
};

// Helper function to format phone numbers
const formatPhoneNumber = (phoneNumber: string): string => {
  let formattedPhone = phoneNumber.toString().replace(/\s+/g, '').replace(/[-+]/g, '');
  
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  return formattedPhone;
};

// Helper function to create transaction record
const createTransaction = async (data: {
  walletId: string;
  amount: number;
  type: string;
  phoneNumber?: string;
  accountReference?: string;
  transactionDesc?: string;
  remarks?: string;
  metadata?: string;
}) => {
  try {
    console.log('Creating transaction for wallet:', data.walletId);
    
    // Validate wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId }
    });

    if (!wallet) {
      throw new Error(`Wallet with ID ${data.walletId} not found`);
    }

    console.log('Wallet found, creating transaction:', {
      walletId: wallet.id,
      walletName: wallet.name,
      currentBalance: wallet.balance
    });

    return await prisma.transaction.create({
      data: {
        walletId: data.walletId,
        amount: data.amount,
        type: data.type,
        status: TransactionStatus.PENDING,
        phoneNumber: data.phoneNumber,
        accountReference: data.accountReference,
        transactionDesc: data.transactionDesc || `${data.type} transaction`,
        remarks: data.remarks,
        metadata: data.metadata,
        transactionType: data.type
      }
    });
  } catch (error: any) {
    console.error('Error creating transaction:', {
      walletId: data.walletId,
      error: error.message,
      code: error.code,
      meta: error.meta
    });
    throw error;
  }
};

// Helper function to update transaction
const updateTransaction = async (transactionId: string, updateData: {
  status?: string;
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  conversationId?: string;
  originatorConversationId?: string;
  mpesaTransactionId?: string;
  rawCallbackData?: string;
  rawApiResponse?: string;
  callbackReceivedAt?: Date;
}) => {
  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...updateData,
      updatedAt: new Date()
    }
  });
};

// Helper function to find transaction by various identifiers
const findTransaction = async (identifier: string, type: TransactionType) => {
  switch (type) {
    case TransactionType.STK_PUSH:
      return await prisma.transaction.findFirst({
        where: {
          OR: [
            { checkoutRequestId: identifier },
            { merchantRequestId: identifier }
          ]
        }
      });
    case TransactionType.C2B:
      return await prisma.transaction.findFirst({
        where: { mpesaTransactionId: identifier }
      });
    case TransactionType.B2C:
    case TransactionType.B2B:
    case TransactionType.B2POCHI:
    case TransactionType.REVERSAL:
      return await prisma.transaction.findFirst({
        where: {
          OR: [
            { conversationId: identifier },
            { originatorConversationId: identifier }
          ]
        }
      });
    default:
      return null;
  }
};

// Helper function to extract parameter value from callback
const extractParameterValue = (parameters: any[], key: string) => {
  console.log(`Extracting parameter ${key} from ${parameters.length} items`);
  const parameter = parameters.find((p: any) => p.Key === key || p.Name === key);
  const value = parameter ? parameter.Value : null;
  console.log(`Parameter ${key}:`, JSON.stringify(parameter), `Value: ${value}`);
  return value;
};

// ============ STK PUSH OPERATIONS ============

export const initiateSTKPush = async (
  phoneNumber: string,
  amount: number,
  walletId: string,
  accountReference: string,
  transactionDesc?: string
) => {
  await ensureInitialized();
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  let transaction: any = null;

  try {
    // Create initial transaction record as CREDIT type
    transaction = await createTransaction({
      walletId,
      amount,
      type: TransactionType.STK_PUSH,
      phoneNumber: formattedPhone,
      accountReference,
      transactionDesc: transactionDesc || 'STK Push payment'
    });

    // Initiate STK Push
    const result = await mpesa.stkPush({
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      accountReference: accountReference,
      transactionDesc: transactionDesc || 'Payment',
      callbackURL: `${MPESA_CALLBACK_URL}/stkpush`
    });
    
    // Update transaction with API response
    if (result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        merchantRequestId: result.MerchantRequestID,
        checkoutRequestId: result.CheckoutRequestID,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: true,
        transactionId: transaction.id,
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription,
        customerMessage: result.CustomerMessage
      };
    } else {
      // API call failed
      await updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        resultCode: parseInt(result.ResponseCode),
        resultDesc: result.ResponseDescription,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: false,
        transactionId: transaction.id,
        error: result.ResponseDescription,
        responseCode: result.ResponseCode
      };
    }
  } catch (error: any) {
    console.error('STK Push Error:', error);
    
    // Update transaction status to FAILED if transaction exists
    if (transaction) {
      try {
        await updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
          resultDesc: error.message || 'Failed to initiate STK Push',
          rawApiResponse: JSON.stringify({
            error: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response?.data
          })
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }
    }
    
    throw new Error(error.message || 'Failed to initiate STK Push');
  }
};

export const handleSTKPushCallback = async (callbackData: any) => {
  try {
    let stkCallback: any;
    
    if (callbackData.Body?.stkCallback) {
      stkCallback = callbackData.Body.stkCallback;
    } else {
      stkCallback = callbackData;
    }
    
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    } = stkCallback;

    console.log('STK Push callback received:', { CheckoutRequestID, ResultCode, ResultDesc, fullData: JSON.stringify(callbackData) });

    if (!CheckoutRequestID) {
      console.error('Missing CheckoutRequestID in callback', JSON.stringify(callbackData));
      return { success: false, error: 'Missing CheckoutRequestID' };
    }

    const transaction = await findTransaction(CheckoutRequestID, TransactionType.STK_PUSH);

    if (!transaction) {
      console.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return { success: false, error: 'Transaction not found' };
    }

    console.log(`Processing STK Push callback for transaction ${transaction.id}`, {
      currentStatus: transaction.status,
      resultCode: ResultCode,
      resultDesc: ResultDesc
    });

    // Prepare update data
    let updateData: any = {
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    // Process based on result code
    if (ResultCode === 0) {
      // Success case
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      
      console.log('STK Push metadata:', JSON.stringify(metadata));
      
      updateData.status = TransactionStatus.SUCCESS;
      updateData.mpesaReceiptNumber = extractParameterValue(metadata, 'MpesaReceiptNumber');
      
      const amount = extractParameterValue(metadata, 'Amount');
      const phoneNumber = extractParameterValue(metadata, 'PhoneNumber');
      const transactionDate = extractParameterValue(metadata, 'TransactionDate');

      console.log('STK Push extracted values:', {
        transactionId: transaction.id,
        mpesaReceiptNumber: updateData.mpesaReceiptNumber,
        amount,
        phoneNumber,
        transactionDate
      });

      // Update wallet balance only if amount is valid (INCREASE for deposits)
      if (amount && !isNaN(amount)) {
        const numericAmount = parseFloat(amount);
        console.log(`Updating wallet balance for transaction ${transaction.id} by INCREMENTING ${numericAmount}`);
        const wallet = await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: numericAmount
            }
          }
        });
        console.log(`Successfully updated wallet ${transaction.walletId} balance to ${wallet.balance}`);

        // Process registration if this is a registration payment
        if (transaction.metadata) {
          try {
            const metadata = JSON.parse(transaction.metadata);
            if (metadata.isRegistration && metadata.formData) {
              console.log('Processing automatic registration after payment success');
              await processRegistration(metadata.formData, transaction.id);
            }
          } catch (error) {
            console.error('Failed to parse transaction metadata for registration:', error);
          }
        }
      } else {
        console.warn('Could not update wallet balance: invalid or missing amount', {
          transactionId: transaction.id,
          amount,
          phoneNumber
        });
      }

    } else if (ResultCode === 1032) {
      // User cancelled
      updateData.status = TransactionStatus.CANCELLED;
      console.log('STK Push cancelled by user:', { transactionId: transaction.id });
      
    } else if (ResultCode === 1037) {
      // Timeout
      updateData.status = TransactionStatus.TIMEOUT;
      console.log('STK Push timed out:', { transactionId: transaction.id, CheckoutRequestID });
      
    } else {
      // Failed case
      updateData.status = TransactionStatus.FAILED;
      console.error('STK Push failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc,
        CheckoutRequestID
      });
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('STK Push callback processing error:', error);
    throw new Error(error.message || 'Failed to process STK Push callback');
  }
};

// Process registration after successful payment
const processRegistration = async (formData: any, transactionId: string) => {
  try {
    const { email, password, name, companyName, phoneNumber, licenseNo, location, planId } = formData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists, skipping registration`);
      return;
    }

    // Create User and Contractor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password, // In production, use bcrypt
          name,
          role: 'contractor',
        },
      });

      const contractor = await tx.contractor.create({
        data: {
          userId: user.id,
          companyName,
          location,
          phoneNumber,
          licenseNo,
          subscriptionPlanId: planId,
        },
      });

      // Create a default wallet for the contractor
      await tx.wallet.create({
        data: {
          name: `${companyName} Wallet`,
          description: 'Default wallet for business operations',
          currency: 'KES',
          contractorId: contractor.id,
        }
      });

      return { user, contractor };
    });

    console.log('Automatic registration completed successfully:', { userId: result.user.id, contractorId: result.contractor.id });

    // Send notification or email here if needed
  } catch (error) {
    console.error('Automatic registration error:', error);
    // Don't throw error here to avoid breaking the callback
  }
};

// ============ B2C OPERATIONS ============

export const initiateB2C = async (
  phoneNumber: string,
  amount: number,
  walletId: string,
  commandID: string = 'BusinessPayment',
  remarks?: string,
  occasion?: string,
  existingTransactionId?: string
) => {
  await ensureInitialized();
  let transaction: any = null;

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Use existing transaction or create new one
    if (existingTransactionId) {
      transaction = await prisma.transaction.findUnique({
        where: { id: existingTransactionId }
      });
      
      if (!transaction) {
        throw new Error(`Transaction with ID ${existingTransactionId} not found`);
      }
    } else {
      // Create transaction record as DEBIT type
      transaction = await createTransaction({
        walletId,
        amount,
        type: TransactionType.B2C,
        phoneNumber: formattedPhone,
        transactionDesc: remarks || 'B2C Payment',
        remarks: occasion
      });
    }

    // Generate originator conversation ID
    const originatorConversationID = `B2C_${Date.now()}_${transaction.id}`;

    // Initiate B2C
    const result = await mpesa.b2c({
      amount: Math.round(amount),
      partyB: formattedPhone,
      remarks: remarks || 'B2C Payment',
      commandID: commandID,
      originatorConversationID: originatorConversationID
    });
    
    // Update transaction with API response
    if (result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        status: TransactionStatus.PENDING,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: true,
        transactionId: transaction.id,
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription
      };
    } else {
      await updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        resultCode: parseInt(result.ResponseCode),
        resultDesc: result.ResponseDescription,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: false,
        transactionId: transaction.id,
        error: result.ResponseDescription,
        responseCode: result.ResponseCode
      };
    }
  } catch (error: any) {
    console.error('B2C Error:', error);
    
    // Update transaction status to FAILED if transaction exists
    if (transaction) {
      try {
        await updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
          resultDesc: error.message || 'Failed to initiate B2C payment',
          rawApiResponse: JSON.stringify({
            error: error.message,
            code: error.code,
            meta: error.meta
          })
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }
    }
    
    // Provide more detailed error information
    if (error.code === 'P2003') {
      throw new Error(`Foreign key constraint violated. The wallet ID may not exist: ${error.meta?.field_name || 'walletId'}`);
    }
    
    throw new Error(error.message || 'Failed to initiate B2C payment');
  }
};

export const handleB2CCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID
    } = Result;

    console.log('B2C callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode,
      ResultDesc,
      fullResult: JSON.stringify(Result)
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.B2C);

    if (!transaction) {
      console.warn(`B2C transaction not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    let updateData: any = {
      mpesaTransactionId: TransactionID,
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    if (ResultCode === 0) {
      // Success - extract result parameters
      const parameters = Result.ResultParameters?.ResultParameter || [];
      
      console.log('B2C callback parameters:', JSON.stringify(parameters));
      
      const receiptNo = extractParameterValue(parameters, 'TransactionReceipt');
      const amount = extractParameterValue(parameters, 'TransactionAmount');
      const transactionCompletedDateTime = extractParameterValue(parameters, 'TransactionCompletedDateTime');

      updateData.status = TransactionStatus.SUCCESS;
      updateData.mpesaReceiptNumber = receiptNo;

      console.log('B2C payment successful:', {
        transactionId: transaction.id,
        receiptNo,
        amount,
        transactionCompletedDateTime
      });

      // Update wallet balance (DECREASE for payouts) only if amount is valid
      if (amount && !isNaN(amount)) {
        const numericAmount = parseFloat(amount);
        console.log(`Updating wallet balance for transaction ${transaction.id} by DECREMENTING ${numericAmount}`);
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              decrement: numericAmount
            }
          }
        });
        console.log(`Successfully decremented wallet ${transaction.walletId} balance`);
      } else {
        console.warn('Could not update wallet balance: invalid or missing amount', {
          transactionId: transaction.id,
          amount
        });
      }

    } else {
      // Failed
      updateData.status = TransactionStatus.FAILED;
      console.error('B2C payment failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('B2C callback processing error:', error);
    throw new Error(error.message || 'Failed to process B2C callback');
  }
};

// ============ B2B OPERATIONS ============

export const initiateB2B = async (
  receiverShortCode: string,
  amount: number,
  walletId: string,
  accountReference: string,
  commandID: string = 'BusinessPayBill',
  remarks?: string,
  existingTransactionId?: string
) => {
  await ensureInitialized();
  let transaction: any = null;

  try {
    // Use existing transaction or create new one
    if (existingTransactionId) {
      transaction = await prisma.transaction.findUnique({
        where: { id: existingTransactionId }
      });
      
      if (!transaction) {
        throw new Error(`Transaction with ID ${existingTransactionId} not found`);
      }
    } else {
      // Create transaction record
      transaction = await createTransaction({
        walletId,
        amount,
        type: TransactionType.B2B,
        accountReference,
        transactionDesc: remarks || 'B2B Payment',
        remarks: remarks
      });
    }

    // Set identifier types based on command ID
    let senderIdentifierType = '4';
    let receiverIdentifierType = '4';
    
    if (commandID === 'BusinessBuyGoods') {
      receiverIdentifierType = '2'; // Till number
    }

    // Initiate B2B
    const result = await mpesa.b2b({
      amount: Math.round(amount),
      partyA: MPESA_SHORTCODE,
      partyB: receiverShortCode,
      accountReference,
      remarks: remarks || 'B2B Payment',
      commandID: commandID,
      senderIdentifierType: senderIdentifierType,
      receiverIdentifierType: receiverIdentifierType
    });
    
    // Update transaction with API response
    if (result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        status: TransactionStatus.PENDING,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: true,
        transactionId: transaction.id,
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription
      };
    } else {
      await updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        resultCode: parseInt(result.ResponseCode),
        resultDesc: result.ResponseDescription,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: false,
        transactionId: transaction.id,
        error: result.ResponseDescription,
        responseCode: result.ResponseCode
      };
    }
  } catch (error: any) {
    console.error('B2B Error:', error);
    
    // Update transaction status to FAILED if transaction exists
    if (transaction) {
      try {
        await updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
          resultDesc: error.message || 'Failed to initiate B2B transfer',
          rawApiResponse: JSON.stringify({
            error: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response?.data
          })
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }
    }
    
    throw new Error(error.message || 'Failed to initiate B2B transfer');
  }
};

export const handleB2BCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID
    } = Result;

    console.log('B2B callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode,
      ResultDesc,
      fullResult: JSON.stringify(Result)
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.B2B);

    if (!transaction) {
      console.warn(`B2B transaction not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    let updateData: any = {
      mpesaTransactionId: TransactionID,
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    if (ResultCode === 0) {
      // Success - extract result parameters
      const parameters = Result.ResultParameters?.ResultParameter || [];
      
      console.log('B2B callback parameters:', JSON.stringify(parameters));
      
      const receiptNo = extractParameterValue(parameters, 'TransactionReceipt');
      const amount = extractParameterValue(parameters, 'TransactionAmount');
      const transactionCompletedDateTime = extractParameterValue(parameters, 'TransactionCompletedDateTime');

      updateData.status = TransactionStatus.SUCCESS;
      updateData.mpesaReceiptNumber = receiptNo;

      console.log('B2B transfer successful:', {
        transactionId: transaction.id,
        receiptNo,
        amount,
        transactionCompletedDateTime
      });

      // Update wallet balance (DECREASE for payouts) only if amount is valid
      if (amount && !isNaN(amount)) {
        const numericAmount = parseFloat(amount);
        console.log(`Updating wallet balance for transaction ${transaction.id} by DECREMENTING ${numericAmount}`);
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              decrement: numericAmount
            }
          }
        });
        console.log(`Successfully decremented wallet ${transaction.walletId} balance`);
      } else {
        console.warn('Could not update wallet balance: invalid or missing amount', {
          transactionId: transaction.id,
          amount
        });
      }

    } else {
      // Failed
      updateData.status = TransactionStatus.FAILED;
      console.error('B2B transfer failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('B2B callback processing error:', error);
    throw new Error(error.message || 'Failed to process B2B callback');
  }
};

// ============ B2POCHI OPERATIONS ============

export const initiateB2Pochi = async (
  phoneNumber: string,
  amount: number,
  walletId: string,
  remarks?: string,
  existingTransactionId?: string
) => {
  await ensureInitialized();
  let transaction: any = null;

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Use existing transaction or create new one
    if (existingTransactionId) {
      transaction = await prisma.transaction.findUnique({
        where: { id: existingTransactionId }
      });
      
      if (!transaction) {
        throw new Error(`Transaction with ID ${existingTransactionId} not found`);
      }
    } else {
      // Create transaction record
      transaction = await createTransaction({
        walletId,
        amount,
        type: TransactionType.B2POCHI,
        phoneNumber: formattedPhone,
        transactionDesc: remarks || 'Pochi Payment',
        remarks: remarks
      });
    }

    // Initiate B2Pochi
    const result = await mpesa.b2pochi({
      amount: Math.round(amount),
      partyB: formattedPhone,
      remarks: remarks || 'Pochi Payment'
    });
    
    // Update transaction with API response
    if (result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        status: TransactionStatus.PENDING,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: true,
        transactionId: transaction.id,
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription
      };
    } else {
      await updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        resultCode: parseInt(result.ResponseCode),
        resultDesc: result.ResponseDescription,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: false,
        transactionId: transaction.id,
        error: result.ResponseDescription,
        responseCode: result.ResponseCode
      };
    }
  } catch (error: any) {
    console.error('B2Pochi Error:', error);
    
    // Update transaction status to FAILED if transaction exists
    if (transaction) {
      try {
        await updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
          resultDesc: error.message || 'Failed to initiate Pochi payment',
          rawApiResponse: JSON.stringify({
            error: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response?.data
          })
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }
    }
    
    throw new Error(error.message || 'Failed to initiate Pochi payment');
  }
};

export const handleB2PochiCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID
    } = Result;

    console.log('B2Pochi callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode,
      ResultDesc,
      fullResult: JSON.stringify(Result)
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.B2POCHI);

    if (!transaction) {
      console.warn(`B2Pochi transaction not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    let updateData: any = {
      mpesaTransactionId: TransactionID,
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    if (ResultCode === 0) {
      // Success - extract result parameters
      const parameters = Result.ResultParameters?.ResultParameter || [];
      
      console.log('B2Pochi callback parameters:', JSON.stringify(parameters));
      
      const receiptNo = extractParameterValue(parameters, 'TransactionReceipt');
      const amount = extractParameterValue(parameters, 'TransactionAmount');
      const transactionCompletedDateTime = extractParameterValue(parameters, 'TransactionCompletedDateTime');

      updateData.status = TransactionStatus.SUCCESS;
      updateData.mpesaReceiptNumber = receiptNo;

      console.log('B2Pochi payment successful:', {
        transactionId: transaction.id,
        receiptNo,
        amount,
        transactionCompletedDateTime
      });

      // Update wallet balance (DECREASE for payouts) only if amount is valid
      if (amount && !isNaN(amount)) {
        const numericAmount = parseFloat(amount);
        console.log(`Updating wallet balance for transaction ${transaction.id} by DECREMENTING ${numericAmount}`);
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              decrement: numericAmount
            }
          }
        });
        console.log(`Successfully decremented wallet ${transaction.walletId} balance`);
      } else {
        console.warn('Could not update wallet balance: invalid or missing amount', {
          transactionId: transaction.id,
          amount
        });
      }

    } else {
      // Failed
      updateData.status = TransactionStatus.FAILED;
      console.error('B2Pochi payment failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('B2Pochi callback processing error:', error);
    throw new Error(error.message || 'Failed to process B2Pochi callback');
  }
};

// ============ C2B OPERATIONS ============

export const handleC2BConfirmation = async (callbackData: any) => {
  try {
    const {
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN,
      FirstName,
      LastName
    } = callbackData;

    console.log('C2B confirmation received:', {
      TransID,
      TransAmount,
      MSISDN,
      BillRefNumber
    });

    // Check for duplicate transaction
    const existingTransaction = await findTransaction(TransID, TransactionType.C2B);

    if (existingTransaction) {
      console.warn(`Duplicate C2B transaction: ${TransID}`);
      return { success: true, message: 'Duplicate callback ignored' };
    }

    // Find wallet by account reference
    const wallet = await prisma.wallet.findFirst({
      where: {
        OR: [
          { name: BillRefNumber },
          { id: BillRefNumber }
        ]
      }
    });

    if (!wallet) {
      console.warn(`Wallet not found for BillRefNumber: ${BillRefNumber}`);
      return { success: false, error: 'Wallet not found' };
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: parseFloat(TransAmount),
        type: TransactionType.C2B,
        status: TransactionStatus.SUCCESS,
        phoneNumber: MSISDN,
        accountReference: BillRefNumber,
        mpesaReceiptNumber: TransID,
        transactionDesc: `C2B payment from ${FirstName} ${LastName}`,
        mpesaTransactionId: TransID,
        rawCallbackData: JSON.stringify(callbackData),
        callbackReceivedAt: new Date()
      }
    });

    console.log('C2B transaction created:', {
      transactionId: transaction.id,
      mpesaReceiptNumber: TransID,
      amount: TransAmount
    });

    // Update wallet balance (INCREASE for customer deposits)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: parseFloat(TransAmount)
        }
      }
    });

    console.log(`Successfully INCREMENTED wallet ${wallet.id} balance by ${TransAmount} for C2B payment`);

    return {
      success: true,
      transactionId: transaction.id,
      message: 'C2B confirmation processed successfully'
    };

  } catch (error: any) {
    console.error('C2B confirmation processing error:', error);
    throw new Error(error.message || 'Failed to process C2B confirmation');
  }
};

export const handleC2BValidation = async (callbackData: any) => {
  try {
    const {
      TransID,
      TransAmount,
      MSISDN,
      BillRefNumber
    } = callbackData;

    console.log('C2B validation received:', {
      TransID,
      TransAmount,
      MSISDN,
      BillRefNumber
    });

    // Validate the transaction
    // You can add your business logic here
    // For example, check if the bill reference number is valid
    // or if the phone number is registered

    const isValid = await validateC2BTransaction(BillRefNumber, MSISDN);

    if (isValid) {
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
        ThirdPartyTransID: TransID
      };
    } else {
      return {
        ResultCode: 1,
        ResultDesc: 'Rejected',
        ThirdPartyTransID: TransID
      };
    }

  } catch (error: any) {
    console.error('C2B validation processing error:', error);
    return {
      ResultCode: 1,
      ResultDesc: 'Validation failed',
      ThirdPartyTransID: callbackData.TransID
    };
  }
};

// Helper function to validate C2B transaction
const validateC2BTransaction = async (billRefNumber: string, msisdn: string): Promise<boolean> => {
  try {
    // Check if wallet exists
    const wallet = await prisma.wallet.findFirst({
      where: {
        OR: [
          { name: billRefNumber },
          { id: billRefNumber }
        ]
      }
    });

    return !!wallet;
  } catch (error) {
    console.error('C2B validation error:', error);
    return false;
  }
};

// ============ TRANSACTION STATUS OPERATIONS ============

export const checkTransactionStatus = async (
  transactionID: string,
  remarks: string = 'Status Query',
  walletId?: string
) => {
  await ensureInitialized();

  try {
    // Create transaction record if walletId is provided
    let transaction = null;
    if (walletId) {
      transaction = await createTransaction({
        walletId,
        amount: 0,
        type: TransactionType.TRANSACTION_STATUS,
        transactionDesc: remarks
      });
    }

    // Check transaction status
    const result = await mpesa.transactionStatus({
      transactionID,
      remarks
    });
    
    // Update transaction if it exists
    if (transaction && result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        mpesaTransactionId: transactionID,
        rawApiResponse: JSON.stringify(result)
      });
    }

    return {
      success: result.ResponseCode === '0',
      responseCode: result.ResponseCode,
      responseDescription: result.ResponseDescription,
      result: result.Result,
      transactionId: transaction?.id
    };

  } catch (error: any) {
    console.error('Transaction Status Error:', error);
    throw new Error(error.message || 'Failed to query transaction status');
  }
};

export const handleTransactionStatusCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID
    } = Result;

    console.log('Transaction status callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.TRANSACTION_STATUS);

    if (!transaction) {
      console.warn(`Transaction status query not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    const updateData: any = {
      mpesaTransactionId: TransactionID,
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    // Extract result parameters if available
    if (Result.ResultParameters?.ResultParameter) {
      const parameters = Result.ResultParameters.ResultParameter;
      const receiptNo = extractParameterValue(parameters, 'ReceiptNo');
      const transactionDate = extractParameterValue(parameters, 'TransactionDate');
      const transactionStatus = extractParameterValue(parameters, 'TransactionStatus');

      if (receiptNo) updateData.mpesaReceiptNumber = receiptNo;
      if (transactionStatus) updateData.resultDesc = transactionStatus;
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('Transaction status callback processing error:', error);
    throw new Error(error.message || 'Failed to process transaction status callback');
  }
};

// ============ ACCOUNT BALANCE OPERATIONS ============

export const checkAccountBalance = async (
  remarks: string = 'Balance Query',
  walletId?: string
) => {
  await ensureInitialized();

  try {
    // Create transaction record if walletId is provided
    let transaction = null;
    if (walletId) {
      transaction = await createTransaction({
        walletId,
        amount: 0,
        type: TransactionType.ACCOUNT_BALANCE,
        transactionDesc: remarks
      });
    }

    // Check account balance
    const result = await mpesa.accountBalance({
      remarks
    });
    
    // Update transaction if it exists
    if (transaction && result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        rawApiResponse: JSON.stringify(result)
      });
    }

    return {
      success: result.ResponseCode === '0',
      responseCode: result.ResponseCode,
      responseDescription: result.ResponseDescription,
      result: result.Result,
      transactionId: transaction?.id
    };

  } catch (error: any) {
    console.error('Account Balance Error:', error);
    throw new Error(error.message || 'Failed to query account balance');
  }
};

export const handleAccountBalanceCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID
    } = Result;

    console.log('Account balance callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.ACCOUNT_BALANCE);

    if (!transaction) {
      console.warn(`Account balance query not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    const updateData: any = {
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    // Extract balance information if available
    if (Result.ResultParameters?.ResultParameter) {
      const parameters = Result.ResultParameters.ResultParameter;
      const accountStatus = extractParameterValue(parameters, 'AccountStatus');
      const workingAccountBalance = extractParameterValue(parameters, 'WorkingAccountBalance');
      const utilityAccountBalance = extractParameterValue(parameters, 'UtilityAccountBalance');

      if (accountStatus || workingAccountBalance || utilityAccountBalance) {
        const balanceInfo = {
          accountStatus,
          workingAccountBalance,
          utilityAccountBalance
        };
        updateData.metadata = JSON.stringify(balanceInfo);
      }
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      balanceInfo: updateData.metadata
    };

  } catch (error: any) {
    console.error('Account balance callback processing error:', error);
    throw new Error(error.message || 'Failed to process account balance callback');
  }
};

// ============ REVERSAL OPERATIONS ============

export const initiateReversal = async (
  transactionID: string,
  amount: number,
  walletId: string,
  remarks: string = 'Reversal Request'
) => {
  await ensureInitialized();
  let transaction: any = null;

  try {
    // Create transaction record
    transaction = await createTransaction({
      walletId,
      amount,
      type: TransactionType.REVERSAL,
      transactionDesc: remarks,
      remarks: `Reversal for transaction ${transactionID}`
    });

    // Initiate reversal
    const result = await mpesa.reversal({
      transactionID,
      amount: Math.round(amount),
      remarks
    });
    
    // Update transaction with API response
    if (result.ResponseCode === '0') {
      await updateTransaction(transaction.id, {
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        mpesaTransactionId: transactionID,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: true,
        transactionId: transaction.id,
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription
      };
    } else {
      await updateTransaction(transaction.id, {
        status: TransactionStatus.FAILED,
        resultCode: parseInt(result.ResponseCode),
        resultDesc: result.ResponseDescription,
        mpesaTransactionId: transactionID,
        rawApiResponse: JSON.stringify(result)
      });

      return {
        success: false,
        transactionId: transaction.id,
        error: result.ResponseDescription,
        responseCode: result.ResponseCode
      };
    }
  } catch (error: any) {
    console.error('Reversal Error:', error);
    
    // Update transaction status to FAILED if transaction exists
    if (transaction) {
      try {
        await updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
          resultDesc: error.message || 'Failed to initiate reversal',
          rawApiResponse: JSON.stringify({
            error: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response?.data
          })
        });
      } catch (updateError) {
        console.error('Failed to update transaction status:', updateError);
      }
    }
    
    throw new Error(error.message || 'Failed to initiate reversal');
  }
};

export const handleReversalCallback = async (callbackData: any) => {
  try {
    const { Result } = callbackData;
    
    if (!Result) {
      return { success: false, error: 'Invalid callback format' };
    }

    const {
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID
    } = Result;

    console.log('Reversal callback received:', {
      OriginatorConversationID,
      ConversationID,
      ResultCode
    });

    // Find transaction
    const transaction = await findTransaction(ConversationID || OriginatorConversationID, TransactionType.REVERSAL);

    if (!transaction) {
      console.warn(`Reversal transaction not found: ${ConversationID}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prepare update data
    let updateData: any = {
      conversationId: ConversationID,
      originatorConversationId: OriginatorConversationID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallbackData: JSON.stringify(callbackData),
      callbackReceivedAt: new Date()
    };

    if (ResultCode === 0) {
      // Success - extract result parameters
      const parameters = Result.ResultParameters?.ResultParameter || [];
      const reversalAmount = extractParameterValue(parameters, 'ReversalAmount');
      const reversedTransactionID = extractParameterValue(parameters, 'ReversedTransactionID');
      const reversalReceipt = extractParameterValue(parameters, 'ReversalReceipt');

      updateData.status = TransactionStatus.SUCCESS;
      updateData.mpesaReceiptNumber = reversalReceipt;

      console.log('Reversal successful:', {
        transactionId: transaction.id,
        reversalAmount,
        reversedTransactionID,
        reversalReceipt
      });

      // Update wallet balance (INCREASE for reversals - adding back the reversed amount) only if amount is valid
      if (reversalAmount && !isNaN(reversalAmount)) {
        const numericAmount = parseFloat(reversalAmount);
        console.log(`Updating wallet balance for transaction ${transaction.id} by INCREMENTING ${numericAmount}`);
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: numericAmount
            }
          }
        });
        console.log(`Successfully incremented wallet ${transaction.walletId} balance`);
      } else {
        console.warn('Could not update wallet balance: invalid or missing reversal amount', {
          transactionId: transaction.id,
          reversalAmount
        });
      }

    } else {
      // Failed
      updateData.status = TransactionStatus.FAILED;
      console.error('Reversal failed:', {
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });
    }

    // Update transaction
    await updateTransaction(transaction.id, updateData);

    return {
      success: true,
      transactionId: transaction.id,
      status: updateData.status
    };

  } catch (error: any) {
    console.error('Reversal callback processing error:', error);
    throw new Error(error.message || 'Failed to process reversal callback');
  }
};

// ============ HELPER FUNCTIONS ============

// Get transaction by ID
export const getTransaction = async (transactionId: string) => {
  return await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: true
    }
  });
};

// Get transactions by wallet
export const getWalletTransactions = async (
  walletId: string,
  limit: number = 50,
  offset: number = 0
) => {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.transaction.count({ where: { walletId } })
  ]);

  return {
    transactions,
    total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
};

// Get transactions by status
export const getTransactionsByStatus = async (
  status: string,
  limit: number = 50,
  offset: number = 0
) => {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.transaction.count({ where: { status } })
  ]);

  return {
    transactions,
    total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
};

// Get transactions by type
export const getTransactionsByType = async (
  type: string,
  limit: number = 50,
  offset: number = 0
) => {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.transaction.count({ where: { type } })
  ]);

  return {
    transactions,
    total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
};

// Monitor pending transactions for timeout
export const monitorPendingTransactions = async (timeoutMinutes: number = 30) => {
  const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const timedOutTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.PENDING,
      createdAt: {
        lt: timeoutThreshold
      }
    }
  });

  for (const transaction of timedOutTransactions) {
    await updateTransaction(transaction.id, {
      status: TransactionStatus.TIMEOUT
    });

    console.log(`Transaction ${transaction.id} marked as timeout`);
  }

  return {
    processed: timedOutTransactions.length,
    transactions: timedOutTransactions
  };
};