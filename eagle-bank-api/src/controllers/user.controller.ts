// Handles the request logic
import { Request, Response, NextFunction } from 'express';
import { createUserService } from '../services/user.service';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await createUserService(req.body);
    // Transform to match OpenAPI spec
    const userResponse = {
      id: user.id,
      name: user.name,
      address: {
        line1: user.addressLine1,
        line2: user.addressLine2,
        line3: user.addressLine3,
        town: user.town,
        county: user.county,
        postcode: user.postcode,
      },
      phoneNumber: user.phoneNumber,
      email: user.email,
      createdTimestamp: user.createdTimestamp,
      updatedTimestamp: user.updatedTimestamp,
    };
    res.status(201).json(userResponse);
  } catch (err: any) {
    // Prisma unique constraint violation (duplicate email)
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(400).json({
        message: 'A user with this email already exists.',
        details: [{ field: 'email', message: 'Email must be unique', type: 'unique' }]
      });
    }
    // Yup validation error (if validation middleware missed it)
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: err.errors || []
      });
    }
    // Unexpected error
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
