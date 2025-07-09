// Yup schema for CreateBankAccountRequest
import { object, string, number } from 'yup';

export const createBankAccountSchema = object({
  name: string().required('Account name is required'),
  accountType: string().oneOf(['personal'], 'Only "personal" accountType is supported').required('Account type is required'),
});

export const createBankTransactionSchema = object({
  amount: number().min(0.01).max(10000).required('Amount is required'),
  currency: string().oneOf(['GBP'], 'Only GBP is supported').required('Currency is required'),
  type: string().oneOf(['deposit', 'withdrawal'], 'Type must be deposit or withdrawal').required('Type is required'),
  reference: string(),
});
