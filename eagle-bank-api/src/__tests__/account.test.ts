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

describe("Bank Account Fetch API", () => {
  it("should fetch own bank account details", async () => {
    // Create a user and account
    const testEmail = `testuser+${Date.now()}+${Math.random()}@example.com`;
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
    const userId = res1.data.id;
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: testEmail,
      password,
    }, { validateStatus: () => true });
    const token = res2.data.token;
    const res3 = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Personal Bank Account",
      accountType: "personal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    const accountNumber = res3.data.accountNumber;
    const res = await axios.get(`${baseURL}/v1/accounts/${accountNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("accountNumber", accountNumber);
    expect(res.data).toHaveProperty("name", "Personal Bank Account");
    // Cleanup
    await prisma.bankAccount.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("should return 403 when fetching another user's account", async () => {
    // Create user 1 and account
    const testEmail = `testuser+${Date.now()}+${Math.random()}@example.com`;
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
    const userId = res1.data.id;
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: testEmail,
      password,
    }, { validateStatus: () => true });
    const token = res2.data.token;
    const res3 = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Personal Bank Account",
      accountType: "personal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    const accountNumber = res3.data.accountNumber;
    // Create user 2
    const otherEmail = `otheruser+${Date.now()}+${Math.random()}@example.com`;
    const otherPassword = "OtherPassword123";
    const res4 = await axios.post(`${baseURL}/v1/users`, {
      name: "Other User",
      address: {
        line1: "456 Main St",
        line2: "",
        line3: "",
        town: "London",
        county: "Greater London",
        postcode: "E2 7AN",
      },
      phoneNumber: "+441234567891",
      email: otherEmail,
      password: otherPassword,
    }, { validateStatus: () => true });
    const otherUserId = res4.data.id;
    const res5 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: otherEmail,
      password: otherPassword,
    }, { validateStatus: () => true });
    const otherToken = res5.data.token;
    // Try to fetch user 1's account as user 2
    const res6 = await axios.get(`${baseURL}/v1/accounts/${accountNumber}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
      validateStatus: () => true,
    });
    expect(res6.status).toBe(403);
    expect(res6.data).toHaveProperty("message");
    // Cleanup
    await prisma.bankAccount.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.bankAccount.deleteMany({ where: { userId: otherUserId } });
    await prisma.user.deleteMany({ where: { id: otherUserId } });
  });

  it("should return 404 for non-existent account", async () => {
    // Create a user and login
    const testEmail = `testuser+${Date.now()}+${Math.random()}@example.com`;
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
    const userId = res1.data.id;
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: testEmail,
      password,
    }, { validateStatus: () => true });
    const token = res2.data.token;
    // Try to fetch a non-existent account
    const res = await axios.get(`${baseURL}/v1/accounts/01999999`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty("message");
    // Cleanup
    await prisma.user.deleteMany({ where: { id: userId } });
  });
});
