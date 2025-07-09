// Business logic (e.g., save user)
import prisma from '../config/db';
import bcrypt from 'bcrypt';

export type CreateUserInput = {
  name: string;
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    town: string;
    county: string;
    postcode: string;
  };
  phoneNumber: string;
  email: string;
  password: string;
};

export const createUserService = async (userData: CreateUserInput) => {
  const passwordHash = await bcrypt.hash(userData.password, 10);
  console.log('Creating user:', userData.email, 'passwordHash:', passwordHash);
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      addressLine1: userData.address.line1,
      addressLine2: userData.address.line2,
      addressLine3: userData.address.line3,
      town: userData.address.town,
      county: userData.address.county,
      postcode: userData.address.postcode,
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      passwordHash,
    },
  });
  console.log('User created:', user.email, 'id:', user.id);
  return user;
};
