// Controller for POST /v1/accounts
import { Request, Response } from 'express';
import { createBankAccountService } from '../services/account.service';

export const createAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Access token is missing or invalid' });
    const { name, accountType } = req.body;
    const account = await createBankAccountService({ name, accountType, userId });
    // Format response per OpenAPI
    const response = {
      accountNumber: account.accountNumber,
      sortCode: account.sortCode,
      name: account.name,
      accountType: account.accountType,
      balance: account.balance,
      currency: account.currency,
      createdTimestamp: account.createdTimestamp,
      updatedTimestamp: account.updatedTimestamp,
    };
    res.status(201).json(response);
  } catch (err: any) {
    if (err.code === 400) {
      return res.status(400).json({ message: err.message, details: [] });
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
