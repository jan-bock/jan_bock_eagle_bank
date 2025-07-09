// Account routes
import { Router } from 'express';
import { createAccount } from '../controllers/account.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createBankAccountSchema } from '../schemas/account.schema';

const router = Router();

// All account routes require authentication
router.use(authenticateJWT);

// POST /v1/accounts
router.post('/', validate(createBankAccountSchema), createAccount);

export default router;
