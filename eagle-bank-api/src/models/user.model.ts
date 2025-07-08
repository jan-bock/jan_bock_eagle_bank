// User type for Prisma/Postgres - can also use prisma's generated types directly
export type User = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  town: string;
  county: string;
  postcode: string;
  phoneNumber: string;
  email: string;
  createdTimestamp: Date;
  updatedTimestamp: Date;
};
