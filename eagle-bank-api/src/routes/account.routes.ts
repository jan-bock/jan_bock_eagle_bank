// Account routes
import { Router } from 'express';
import { createAccount, getAccountByAccountNumber, createTransaction, fetchTransaction } from '../controllers/account.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createBankAccountSchema, createBankTransactionSchema } from '../schemas/account.schema';

const router = Router();

// All account routes require authentication
router.use(authenticateJWT);

// POST /v1/accounts
router.post('/', validate(createBankAccountSchema), createAccount);

// GET /v1/accounts/:accountNumber
router.get('/:accountNumber', getAccountByAccountNumber);

// POST /v1/accounts/:accountNumber/transactions
router.post('/:accountNumber/transactions', validate(createBankTransactionSchema), createTransaction);

// GET /v1/accounts/:accountNumber/transactions/:transactionId
router.get('/:accountNumber/transactions/:transactionId', fetchTransaction);

export default router;
