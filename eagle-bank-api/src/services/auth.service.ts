// Auth service for login
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export const loginUserService = async (email: string, password: string): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('Login attempt for:', email, 'found user:', !!user, 'passwordHash:', user?.passwordHash);
    if (!user) {
      console.error('No user found for email:', email);
      return null;
    }
    if (!user.passwordHash) {
      console.error('User has no passwordHash:', user.email);
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', valid);
    if (!valid) {
      console.error('Password invalid for user:', user.email);
      return null;
    }
    // JWT payload: only user id
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    return token;
  } catch (err) {
    console.error('Error in loginUserService:', err);
    throw err;
  }
};
