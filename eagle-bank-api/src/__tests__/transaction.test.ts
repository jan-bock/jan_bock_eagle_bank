import prisma from "../config/db";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import axios from "axios";
import http from "http";
import app from "../app";

let server: http.Server;
let baseURL: string;

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
});

afterAll(async () => {
  await prisma.transaction.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "testuser@",
      },
    },
  });
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("Transaction API", () => {
  let token: string;
  let userId: string;
  let accountNumber: string;

  beforeEach(async () => {
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
    userId = res1.data.id;
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: testEmail,
      password,
    }, { validateStatus: () => true });
    token = res2.data.token;
    // Create a bank account
    const res3 = await axios.post(`${baseURL}/v1/accounts`, {
      name: "Personal Bank Account",
      accountType: "personal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    accountNumber = res3.data.accountNumber;
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({ where: { accountNumber } });
    await prisma.bankAccount.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("should deposit money into own account", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      amount: 100.0,
      currency: "GBP",
      type: "deposit",
      reference: "Initial deposit",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({
      amount: 100.0,
      currency: "GBP",
      type: "deposit",
      reference: "Initial deposit",
      userId,
    });
    // Check balance updated
    const account = await prisma.bankAccount.findUnique({ where: { accountNumber } });
    expect(account?.balance).toBe(100.0);
  });

  it("should withdraw money from own account if sufficient funds", async () => {
    // First deposit
    await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      amount: 200.0,
      currency: "GBP",
      type: "deposit",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    // Then withdraw
    const res = await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      amount: 50.0,
      currency: "GBP",
      type: "withdrawal",
      reference: "ATM withdrawal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({
      amount: 50.0,
      currency: "GBP",
      type: "withdrawal",
      reference: "ATM withdrawal",
      userId,
    });
    // Check balance updated
    const account = await prisma.bankAccount.findUnique({ where: { accountNumber } });
    expect(account?.balance).toBe(150.0);
  });

  it("should return 422 if insufficient funds for withdrawal", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      amount: 100.0,
      currency: "GBP",
      type: "withdrawal",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(422);
    expect(res.data).toHaveProperty("message");
  });

  it("should return 403 if trying to transact on another user's account", async () => {
    // Create another user
    const otherEmail = `testuser+${Date.now()}+${Math.random()}@example.com`;
    const otherPassword = "OtherPassword123";
    const res1 = await axios.post(`${baseURL}/v1/users`, {
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
    const otherUserId = res1.data.id;
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: otherEmail,
      password: otherPassword,
    }, { validateStatus: () => true });
    const otherToken = res2.data.token;
    // Try to deposit into first user's account
    const res = await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      amount: 10.0,
      currency: "GBP",
      type: "deposit",
    }, {
      headers: { Authorization: `Bearer ${otherToken}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(403);
    expect(res.data).toHaveProperty("message");
    // Cleanup
    await prisma.user.deleteMany({ where: { id: otherUserId } });
  });

  it("should return 404 for non-existent account", async () => {
    const res = await axios.post(`${baseURL}/v1/accounts/01999999/transactions`, {
      amount: 10.0,
      currency: "GBP",
      type: "deposit",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty("message");
  });

  it("should return 400 if required data is missing", async () => {
    // Missing amount
    const res = await axios.post(`${baseURL}/v1/accounts/${accountNumber}/transactions`, {
      currency: "GBP",
      type: "deposit",
    }, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty("message");
  });
});
