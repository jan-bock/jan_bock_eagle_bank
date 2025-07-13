# 🦅 **Eagle Bank API**

## **Technologies Used**

- **Node.js** & **Express** – REST API server
- **TypeScript** – Type safety and maintainability
- **Prisma ORM** – Database modeling and access
- **PostgreSQL** – Relational database
- **Yup** – Request validation
- **JWT (jsonwebtoken)** – Authentication
- **Vitest** – Integration and unit testing
- **OpenAPI (YAML)** – API specification and documentation

---

## **Implemented Endpoints & User Stories**

### 🔐 **Authentication**
- **POST /v1/auth/login**  
  - Authenticate a user and return a JWT token  
  - JWT required for all endpoints except user creation  
  - OpenAPI spec updated

### **User Management**
- **POST /v1/users**  
  - Create a new user (with validation and duplicate email check)
- **GET /v1/users/{userId}**  
  - Fetch own user details (JWT required)
  - Forbidden when accessing another user's data
  - 404 for non-existent user

### 🏦 **Bank Accounts**
- **POST /v1/accounts**  
  - Create a new bank account (JWT required)
  - Validation for required fields
  - 400 for missing/invalid data
- **GET /v1/accounts/{accountNumber}**  
  - Fetch own bank account details
  - 403 for another user's account
  - 404 for non-existent account

### **Transactions**
- **POST /v1/accounts/{accountNumber}/transactions**  
  - Deposit/withdrawal (JWT required, only for own account)
  - Balance updated atomically
  - 422 for insufficient funds (withdrawal)
  - 403 for another user's account
  - 404 for non-existent account
  - 400 for missing/invalid data
- **GET /v1/accounts/{accountNumber}/transactions/{transactionId}**  
  - Fetch a transaction on own account
  - 403 for another user's account
  - 404 for non-existent account, transaction, or mismatched account/transaction

---

## **Test Coverage**

- All endpoints and edge/error cases are covered by integration tests.
- Tests ensure compliance with the OpenAPI specification.

---

## **OpenAPI Spec**

- All endpoints, request/response schemas, and error cases are documented in `openapi.yaml`.
- JWT Bearer authentication is specified and enforced.

---

## 🛠️ **How to Run**

1. **Install dependencies:**  
   ```sh
   npm install
   ```
2. **Set up your `.env` file** (see `.env.example`)
3. **Run migrations:**  
   ```sh
   npx prisma migrate dev
   ```
4. **Build the app:**  
   ```sh
   npm run build
   ```
5. **Start the server:**  
   ```sh
   npm run dev
   ```
6. **Run tests:**  
   ```sh
   npx vitest run
   ```

---