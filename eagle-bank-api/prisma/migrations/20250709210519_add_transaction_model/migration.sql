-- AlterTable
ALTER TABLE "BankAccount" ALTER COLUMN "accountNumber" SET DEFAULT '01' || lpad(nextval('account_number_seq')::text, 6, '0');

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT concat('tan-', substr(md5(random()::text), 1, 6));
