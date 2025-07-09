// Validates request body (optional)
import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'yup';

const validate = (schema: AnySchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.validate(req.body);
    next();
  } catch (err: unknown) {
    let details: string[] = [];
    if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as any).errors)) {
      details = (err as { errors: string[] }).errors;
    }
    console.log('Validation error:', err);
    console.log('Request body:', req.body);
    res.status(400).json({ message: 'Validation error', details });
  }
};

export default validate;
