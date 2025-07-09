import prisma from "../config/db";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "testuser@", // or whatever pattern you use for test emails
      },
    },
  });
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("User API", () => {
  const getValidUser = () => ({
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
    email: "testuser@example.com",
    password: "TestPassword123",
  });

  it("should create a new user with valid data", async () => {
    const user = {
      ...getValidUser(),
      email: `testuser+${Date.now()}+${Math.random()}@example.com`,
    };
    const res = await axios.post(`${baseURL}/v1/users`, user, {
      validateStatus: () => true,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({
      name: user.name,
      address: user.address,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });
  });

  it("should not create a user with missing required fields", async () => {
    const user = getValidUser();
    const { name, ...userWithoutName } = user;
    const res = await axios.post(`${baseURL}/v1/users`, userWithoutName, {
      validateStatus: () => true,
    });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty("message", "Validation error");
  });

  it("should not allow duplicate emails", async () => {
    const uniqueEmail = `uniqueuser+${Date.now()}+${Math.random()}@example.com`;
    // First create
    await axios.post(
      `${baseURL}/v1/users`,
      { ...getValidUser(), email: uniqueEmail },
      {
        validateStatus: () => true,
      }
    );
    // Try duplicate
    const res = await axios.post(
      `${baseURL}/v1/users`,
      { ...getValidUser(), email: uniqueEmail },
      {
        validateStatus: () => true,
      }
    );
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty(
      "message",
      "A user with this email already exists."
    );
  });
});

describe("Auth & Protected User API", () => {
  let userId: string;
  let token: string;
  const testEmail = `testuser+${Date.now()}@example.com`;
  const password = "TestPassword123";

  it("should allow login and return a JWT", async () => {
    // Create user
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
    // Login
    const res2 = await axios.post(`${baseURL}/v1/auth/login`, {
      email: testEmail,
      password,
    }, { validateStatus: () => true });
    expect(res2.status).toBe(200);
    expect(res2.data).toHaveProperty("token");
    token = res2.data.token;
  });

  it("should allow fetching own user data with JWT", async () => {
    const res = await axios.get(`${baseURL}/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id", userId);
    expect(res.data).toHaveProperty("email", testEmail);
  });

  it("should forbid fetching another user's data", async () => {
    // Create another user
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
      email: `otheruser+${Date.now()}@example.com`,
      password: "OtherPassword123",
    });
    const otherUserId = res1.data.id;
    // Try to fetch as original user
    const res2 = await axios.get(`${baseURL}/v1/users/${otherUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    expect(res2.status).toBe(403);
  });

  it("should reject requests with invalid JWT", async () => {
    const res = await axios.get(`${baseURL}/v1/users/${userId}`, {
      headers: { Authorization: `Bearer invalidtoken` },
      validateStatus: () => true,
    });
    expect(res.status).toBe(401);
  });
});
