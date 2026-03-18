# MyFin Bank — MERN Banking Application
## DB Design Handbook v2.0 — 100% Compliant

### What was fixed from v1
- All 12 collections implemented as proper Mongoose models
- MYFIN-XXXX-0001 human-readable IDs on every collection
- Services layer added (controllers → services → models)
- Separate `customers` and `admins` collections (no shared User model)
- `fixed_deposits` and `recurring_deposits` as standalone collections (not embedded)
- Fund transfer creates TWO records (DEBIT + CREDIT) sharing a `referenceId`
- `beneficiaries` with PENDING/ACTIVE lifecycle + admin approval
- `loan_payments` pre-generated on loan approval, Pay EMI endpoint
- `support_tickets` + `support_messages` with proper FK relationship
- `password_reset_tokens` with OTP, 10-min expiry, `used` flag
- AT_RISK → DEACTIVATED (AUTO) cron job (every hour)
- KYC file upload via Multer on registration
- Socket.io scoped to per-customer rooms

---

### Quick Start

#### 1. Backend
```bash
cd backend
npm install
# Edit .env with your MongoDB URI and email credentials
npm run dev
```

#### 2. Seed Admin
POST `http://localhost:5000/api/auth/admin/login`  
First create an admin directly in MongoDB:
```js
db.admins.insertOne({
  adminId: "MYFIN-ADMIN-0001",
  name: "Admin",
  email: "admin@myfinbank.com",
  password: "<bcrypt hash of your password>",
  role: "ADMIN"
})
```
Or use the register-admin helper (remove after setup):
POST `/api/auth/register-admin` with `{ name, email, password }`

#### 3. Frontend
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

---

### Collection Summary (12 total)

| Collection | ID Format | Key Fields |
|---|---|---|
| customers | MYFIN-CUST-0001 | status: PENDING_VERIFICATION/ACTIVE/REJECTED, govIdType, govIdNumber |
| admins | MYFIN-ADMIN-0001 | separate from customers |
| accounts | MYFIN-SACC/CACC-0001 | status: REQUESTED/ACTIVE/AT_RISK/DEACTIVATED/REJECTED, deactivationType |
| transactions | MYFIN-TXN-000001 | txnId, referenceId, transactionCategory, type: DEBIT/CREDIT, balanceAfterTxn |
| beneficiaries | MYFIN-BEN-0001 | status: PENDING/ACTIVE |
| loans | MYFIN-LN-0001 | status: PENDING/APPROVED/REJECTED/ACTIVE/CLOSED, emiAmount, remainingBalance |
| loan_payments | MYFIN-PAY-0001 | emiNumber, status: PENDING/PAID, referenceId |
| fixed_deposits | MYFIN-FD-0001 | maturityAmount, maturityDate, status: ACTIVE/MATURED/BROKEN |
| recurring_deposits | MYFIN-RD-0001 | paidInstallments, status: ACTIVE/MATURED/BROKEN |
| support_tickets | MYFIN-TKT-0001 | status: OPEN/IN_PROGRESS/RESOLVED |
| support_messages | MYFIN-MSG-0001 | senderType: CUSTOMER/ADMIN |
| password_reset_tokens | MYFIN-OTP-0001 | otp, expiresAt, used |

---

### API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register customer with KYC upload |
| POST | /api/auth/login | Public | Customer login |
| POST | /api/auth/admin/login | Public | Admin login |
| POST | /api/auth/forgot-password | Public | Send OTP |
| POST | /api/auth/reset-password | Public | Reset with OTP |
| GET | /api/customers | Admin | All customers |
| PATCH | /api/customers/:id/approve | Admin | Approve KYC |
| PATCH | /api/customers/:id/reject | Admin | Reject KYC |
| GET | /api/accounts/my | Customer | Own accounts |
| PATCH | /api/accounts/:num/approve | Admin | Approve account |
| POST | /api/transactions/deposit | Customer | Deposit |
| POST | /api/transactions/withdraw | Customer | Withdraw |
| POST | /api/transactions/transfer | Customer | Transfer (creates 2 records) |
| POST | /api/loans/apply | Customer | Apply for loan |
| POST | /api/loans/:id/pay-emi | Customer | Pay next EMI |
| GET | /api/loans/:id/payments | Customer | EMI history |
| PATCH | /api/loans/:id/approve | Admin | Approve + disburse |
| POST | /api/investments/fd | Customer | Create FD |
| POST | /api/investments/rd | Customer | Create RD |
| POST | /api/investments/rd/:id/pay | Customer | Pay RD installment |
| POST | /api/beneficiaries | Customer | Add beneficiary |
| PATCH | /api/beneficiaries/:id/approve | Admin | Approve beneficiary |
| POST | /api/support/tickets | Customer | Create ticket |
| POST | /api/support/tickets/:id/messages | Customer/Admin | Send message |
| PATCH | /api/support/tickets/:id/status | Admin | Update ticket status |
| GET | /api/admin/stats | Admin | Full dashboard stats |
