// Transaction service for deposits and withdrawals
import prisma from "../config/db";

export type CreateTransactionInput = {
  accountNumber: string;
  userId: string;
  amount: number;
  currency: string;
  type: "deposit" | "withdrawal";
  reference?: string;
};

export const createTransactionService = async (
  data: CreateTransactionInput
) => {
  // Find the account and check ownership
  const account = await prisma.bankAccount.findUnique({
    where: { accountNumber: data.accountNumber },
  });
  if (!account) throw { code: 404, message: "Bank account was not found" };
  if (account.userId !== data.userId)
    throw {
      code: 403,
      message: "Forbidden: can only transact on your own account.",
    };
  if (data.currency !== "GBP")
    throw { code: 400, message: "Only GBP is supported." };
  if (data.amount <= 0 || data.amount > 10000)
    throw { code: 400, message: "Amount must be between 0.01 and 10000.00" };

  let newBalance = account.balance;
  if (data.type === "deposit") {
    newBalance += data.amount;
  } else if (data.type === "withdrawal") {
    if (account.balance < data.amount)
      throw { code: 422, message: "Insufficient funds to process transaction" };
    newBalance -= data.amount;
  } else {
    throw { code: 400, message: "Invalid transaction type" };
  }

  // Transactional update: create transaction, update balance
  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        reference: data.reference,
        userId: data.userId,
        accountNumber: data.accountNumber,
      },
    }),
    prisma.bankAccount.update({
      where: { accountNumber: data.accountNumber },
      data: { balance: newBalance },
    }),
  ]);
  return transaction;
};
