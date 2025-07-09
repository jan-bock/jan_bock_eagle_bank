// Account service for creating a bank account
import prisma from '../config/db';

export type CreateBankAccountInput = {
  name: string;
  accountType: string;
  userId: string;
};

export const createBankAccountService = async (data: CreateBankAccountInput) => {
  // Only 'personal' is allowed for now (per OpenAPI)
  if (data.accountType !== 'personal') {
    throw { code: 400, message: 'Invalid accountType. Only "personal" is supported.' };
  }
  const account = await prisma.bankAccount.create({
    data: {
      name: data.name,
      accountType: data.accountType,
      userId: data.userId,
      // sortCode, currency, balance, accountNumber are defaulted by Prisma/Postgres
    },
  });
  return account;
};
