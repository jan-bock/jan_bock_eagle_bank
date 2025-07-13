// Handles /v1/auth/login
import { Request, Response } from 'express';
import { loginUserService } from '../services/auth.service';

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    let token: string | null = null;
    try {
      token = await loginUserService(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error in loginUserService:', err.message);
      } else {
        console.error('Error in loginUserService:', err);
      }

      return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
    if (!token) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.status(200).json({ token });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error in loginUser controller:', err.message);
    } else {
      console.error('Error in loginUser controller:', err);
    }
    
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
