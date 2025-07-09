// Account routes
import { Router } from 'express';
import { createAccount, getAccountByAccountNumber, createTransaction } from '../controllers/account.controller';
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

export default router;
