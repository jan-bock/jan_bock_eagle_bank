// Input validation
import { object, string } from 'yup';

export const userSchema = object({
  name: string().required(),
  address: object({
    line1: string().required(),
    line2: string(),
    line3: string(),
    town: string().required(),
    county: string().required(),
    postcode: string().required(),
  }).required(),
  phoneNumber: string().required(),
  email: string().email().required(),
  password: string().min(8, 'Password must be at least 8 characters').required(),
});
