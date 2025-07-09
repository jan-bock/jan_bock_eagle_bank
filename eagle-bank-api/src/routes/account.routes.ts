// Account routes
import { Router } from 'express';
import { createAccount, getAccountByAccountNumber } from '../controllers/account.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createBankAccountSchema } from '../schemas/account.schema';

const router = Router();

// All account routes require authentication
router.use(authenticateJWT);

// POST /v1/accounts
router.post('/', validate(createBankAccountSchema), createAccount);

// GET /v1/accounts/:accountNumber
router.get('/:accountNumber', getAccountByAccountNumber);

export default router;
