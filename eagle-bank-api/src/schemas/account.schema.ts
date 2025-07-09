// Yup schema for CreateBankAccountRequest
import { object, string } from 'yup';

export const createBankAccountSchema = object({
  name: string().required('Account name is required'),
  accountType: string().oneOf(['personal'], 'Only "personal" accountType is supported').required('Account type is required'),
});
