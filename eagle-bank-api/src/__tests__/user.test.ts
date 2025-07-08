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
  });

  it("should create a new user with valid data", async () => {
    const user = {
      ...getValidUser(),
      email: `testuser+${Date.now()}@example.com`,
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
    // First create
    await axios.post(
      `${baseURL}/v1/users`,
      { ...getValidUser(), email: "uniqueuser@example.com" },
      {
        validateStatus: () => true,
      }
    );
    // Try duplicate
    const res = await axios.post(
      `${baseURL}/v1/users`,
      { ...getValidUser(), email: "uniqueuser@example.com" },
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
