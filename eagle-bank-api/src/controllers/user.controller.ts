// Handles the request logic
import { Request, Response, NextFunction } from 'express';
import { createUserService } from '../services/user.service';
import prisma from '../config/db';

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
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null) {
      const error = err as { code?: string; meta: unknown, name?: string; errors?: unknown[] };

      // Prisma unique constraint violation (duplicate email)
      if (
        error.code === 'P2002' &&
        (error.meta as { target?: string[] })?.target?.includes('email')
      ) {
        return res.status(400).json({
          message: 'A user with this email already exists.',
          details: [{ field: 'email', message: 'Email must be unique', type: 'unique' }]
        });
      }

      // Yup validation error (if validation middleware missed it)
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          details: error.errors || []
        });
      }
    }
    // Unexpected error
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });

  if (!user) {
    return res.status(404).json({ message: 'User was not found' });
  }

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

  res.status(200).json(userResponse);
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        ...req.body.name && { name: req.body.name },
        ...req.body.address && {
          addressLine1: req.body.address.line1,
          addressLine2: req.body.address.line2,
          addressLine3: req.body.address.line3,
          town: req.body.address.town,
          county: req.body.address.county,
          postcode: req.body.address.postcode,
        },
        ...req.body.phoneNumber && { phoneNumber: req.body.phoneNumber },
        ...req.body.email && { email: req.body.email },
      },
    });

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
    
    res.status(200).json(userResponse);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null) {
      const error = err as { code?: string; meta?: unknown };
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'User was not found' });
      }
      if (
        error.code === 'P2002' &&
        ((error.meta as { target?: string[] })?.target?.includes('email'))
      ) {
        return res.status(400).json({
          message: 'A user with this email already exists.',
          details: [{ field: 'email', message: 'Email must be unique', type: 'unique' }]
        });
      }
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const deleteUserById = async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.userId } });
    res.status(204).send();
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null) {
      const error = err as { code?: string };
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'User was not found' });
      }
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
