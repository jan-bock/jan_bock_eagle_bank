// Controller for POST /v1/accounts
import { Request, Response } from 'express';
import { createBankAccountService } from '../services/account.service';
import { createTransactionService } from '../services/transaction.service';
import prisma from '../config/db';

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

export const getAccountByAccountNumber = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { accountNumber } = req.params;
  // Find the account
  const account = await prisma.bankAccount.findUnique({ where: { accountNumber } });
  if (!account) {
    return res.status(404).json({ message: 'Bank account was not found' });
  }
  if (account.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: can only access your own bank account.' });
  }
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
  res.status(200).json(response);
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { accountNumber } = req.params;
    const { amount, currency, type, reference } = req.body;
    const transaction = await createTransactionService({
      accountNumber,
      userId,
      amount,
      currency,
      type,
      reference,
    });
    // Format response per OpenAPI
    const response = {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      reference: transaction.reference,
      userId: transaction.userId,
      createdTimestamp: transaction.createdTimestamp,
    };
    res.status(201).json(response);
  } catch (err: any) {
    if (err.code === 400) return res.status(400).json({ message: err.message, details: [] });
    if (err.code === 403) return res.status(403).json({ message: err.message });
    if (err.code === 404) return res.status(404).json({ message: err.message });
    if (err.code === 422) return res.status(422).json({ message: err.message });
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
