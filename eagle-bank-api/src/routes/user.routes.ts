// POST /v1/users route
import { Router } from 'express';
import { createUser } from '../controllers/user.controller';
import validate from '../middlewares/validate.middleware';
import { userSchema } from '../schemas/user.schema';

const router = Router();

router.post('/', validate(userSchema), createUser);

export default router;
