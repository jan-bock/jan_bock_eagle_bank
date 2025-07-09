// POST /v1/users route
import { Router } from 'express';
import { createUser } from '../controllers/user.controller';
import validate from '../middlewares/validate.middleware';
import { userSchema } from '../schemas/user.schema';
import { authenticateJWT, AuthRequest } from '../middlewares/auth.middleware';
import { getUserById, updateUserById, deleteUserById } from '../controllers/user.controller';

const router = Router();

router.post('/', validate(userSchema), createUser);

// Secure all other user routes
router.use(authenticateJWT);

// GET /v1/users/:userId - only allow self
router.get('/:userId', (req, res, next) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden: can only access your own user data.' });
  }
  next();
}, getUserById);

// PATCH /v1/users/:userId - only allow self
router.patch('/:userId', (req, res, next) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden: can only update your own user data.' });
  }
  next();
}, updateUserById);

// DELETE /v1/users/:userId - only allow self
router.delete('/:userId', (req, res, next) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden: can only delete your own user.' });
  }
  next();
}, deleteUserById);

export default router;
