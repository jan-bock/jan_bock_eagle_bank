// Validates request body (optional)
import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'yup';

const validate = (schema: AnySchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.validate(req.body);
    next();
  } catch (err: any) {
    console.log('Validation error:', err);
    console.log('Request body:', req.body);
    res.status(400).json({ message: 'Validation error', details: err.errors });
  }
};

export default validate;
