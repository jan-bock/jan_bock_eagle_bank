import prisma from "../config/db";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import http from "http";
import app from "../app";

let server: http.Server;
let baseURL: string;
let token: string;
let userId: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (typeof address === "object" && address && address.port) {
        baseURL = `http://localhost:${address.port}`;
        resolve();
      }
    });
  });
  // Create a user and login to get a JWT
  const testEmail = `testuser+${Date.now()}@example.com`;
  const password = "TestPassword123";
  const res1 = await axios.post(`${baseURL}/v1/users`, {
    name: "Test User",
    address: {
      line1: "123 Main St",
      line2: "Apt 4B",
      line3: "",
      town: "London",
      county: "Greater London",
      postcode: "E1 6AN",
    },
    phoneNumber: "+441234567890",
    email: testEmail,
    password,
  }, { validateStatus: () => true });
  userId = res1.data.id;
  const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
    email: testEmail,
    password,
  }, { validateStatus: () => true });
  token = res2.data.token;
});

afterAll(async () => {
  await prisma.bankAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("Bank Account API", () => {
  it("should create a new bank account with valid data", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Personal Bank Account",
      accountType: "personal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("accountNumber");
    expect(res.data).toMatchObject({
      name: "Personal Bank Account",
      accountType: "personal",
      sortCode: "10-10-10",
      balance: 0,
      currency: "GBP",
    });
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts`, {
      // name missing
      accountType: "personal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty("message");
  });

  it("should return 400 if accountType is not 'personal'", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Business Account",
      accountType: "business",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty("message");
  });

  it("should return 401 if no JWT is provided", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Personal Bank Account",
      accountType: "personal",
    }, {
      validateStatus: () => true,
    });
    expect(res.status).toBe(401);
    expect(res.data).toHaveProperty("message");
  });
});
