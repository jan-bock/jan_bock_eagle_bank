// Auth service for login
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export const loginUserService = async (email: string, password: string): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('No user found');
      return null;
    }
    if (!user.passwordHash) {
      console.error('User has no passwordHash');
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.error('Password invalid');
      return null;
    }
    // JWT payload: only user id
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    return token;
  } catch (err) {
    console.error('Error in loginUserService');
    throw err;
  }
};
