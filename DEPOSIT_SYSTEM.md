# Deposit System Implementation Summary

## Overview
Complete UPI deposit flow with admin template management and player deposit initiation with auto-generated transaction IDs.

## Architecture

### Database Schema
- **PaymentLink** (Admin Template):
  - `id`: UUID primary key
  - `name`: Link display name
  - `payeeVPA`: UPI ID (merchant@bank)
  - `payeeName`: Recipient name
  - `active`: Boolean toggle
  - `createdBy`: Admin who created it
  - `deposits`: One-to-many relation to Deposit records

- **Deposit** (User Transaction):
  - `id`: UUID primary key
  - `userId`: Foreign key to User
  - `paymentLinkId`: Foreign key to PaymentLink template
  - `amount`: Integer in cents (e.g., 10000 = ₹100)
  - `currency`: Always "INR"
  - `transactionRef`: Unique 12-char alphanumeric ID (auto-generated)
  - `screenshotUrl`: Path to uploaded payment screenshot
  - `status`: Enum - PENDING → SCREENSHOT_UPLOADED → APPROVED/REJECTED
  - `createdAt/updatedAt`: Timestamps

### Backend Controllers

#### AdminController Functions
- `listDeposits(status?, userId?, limit, offset)`: Fetch deposits with optional filters
- `approveDeposit(depositId)`: Approve deposit, credit wallet, create transaction record
- `rejectDeposit(depositId)`: Reject deposit, update status

#### DepositController Functions (NEW)
- `generateTransactionRef()`: Create unique 12-char alphanumeric ID
- `initDeposit(paymentLinkId, amount)`: 
  - Create Deposit record with PENDING status
  - Generate unique transactionRef
  - Assemble UPI Intent URI
  - Return deposit ID and UPI link
- `uploadDepositScreenshot(depositId, screenshotUrl)`:
  - Update screenshot URL
  - Set status to SCREENSHOT_UPLOADED
- `getMyDeposits(userId, status?, limit, offset)`: Fetch user's deposit history
- `getDeposit(depositId)`: Single deposit details
- `getActivePaymentLinks()`: Fetch active payment link templates for player

### Backend Routes

**Player Routes** (Protected with authenticate middleware):
- `POST /api/deposits/init` - Initiate deposit with payment link ID + amount
- `POST /api/deposits/:depositId/upload-screenshot` - Upload payment proof
- `GET /api/deposits/my` - View own deposits
- `GET /api/deposits/:depositId` - Single deposit details
- `GET /api/payment-links/active` - Available payment templates

**Admin Routes** (Protected with authenticate + admin check):
- `GET /admin/deposits` - List all deposits with filters
- `PUT /admin/deposits/:depositId/approve` - Approve deposit
- `PUT /admin/deposits/:depositId/reject` - Reject deposit

### Frontend Components

#### ManagePayment Component (Updated)
- Two tabs: "Payment Links" + "Deposits"
- **Links Tab**:
  - Create form: Name, Payee VPA, Payee Name (no amount)
  - Edit/Delete/Activate/Deactivate existing templates
  - Display deposit count per link
- **Deposits Tab**:
  - Filter by status (All, Pending, Awaiting Approval, Approved, Rejected)
  - Table view with user email, amount, transaction ID, link name, status
  - Approve/Reject buttons for SCREENSHOT_UPLOADED status
  - Screenshot preview link

#### DepositPage Component (NEW)
- Three-step flow:
  1. **Select Amount**:
     - Payment link selector
     - Preset amounts: ₹100, 200, 500, 1000, 2000, 5000
     - Custom amount input
  2. **Make Payment**:
     - Display amount, transaction ID, recipient VPA, recipient name
     - Copy transaction ID to clipboard button
     - "Pay with UPI" button (opens UPI Intent)
     - Instructions for payment
  3. **Upload Screenshot**:
     - File input with preview
     - Max file size: 5MB
     - Image-only validation
- Recent deposits table showing history

### Frontend API Layer

**adminApi.ts**:
- `listDeposits(status?, userId?, limit, offset)`: Promise
- `approveDeposit(depositId)`: Promise
- `rejectDeposit(depositId)`: Promise
- `Deposit` interface with status enum

**playerApi.ts**:
- `getActivePaymentLinks()`: Returns { paymentLinks: PaymentLinkOption[] }
- `initDeposit(paymentLinkId, amount)`: Returns DepositInitResponse
- `uploadDepositScreenshot(depositId, screenshotUrl)`: Promise
- `getMyDeposits(status?, limit, offset)`: Returns { deposits: DepositInfo[] }
- `getDeposit(depositId)`: Returns { deposit: DepositInfo }

### Transaction ID Generation
- 12-character alphanumeric: [A-Z0-9]
- Example: `A1B2C3D4E5F6`
- Generated at deposit initiation time
- Globally unique constraint in database

### UPI Intent URI Format
```
upi://pay?pa={payeeVPA}&pn={payeeName}&am={amount}&cu=INR&tr={transactionRef}&tn=Game%20Deposit
```
- `pa`: Payee Address (UPI ID)
- `pn`: Payee Name (URL encoded)
- `am`: Amount in rupees
- `cu`: Currency (INR)
- `tr`: Transaction Reference ID
- `tn`: Transaction Note

### Data Flow

**Player Deposit Flow**:
1. Player navigates to `/deposit` route
2. Fetches active payment links via `getActivePaymentLinks()`
3. Selects payment link + enters amount
4. Clicks "Generate Payment Link"
5. Backend calls `initDeposit()`:
   - Creates Deposit record (status: PENDING)
   - Generates transactionRef
   - Returns deposit ID + UPI Intent link
6. Player clicks "Pay with UPI" → Opens payment app
7. Player completes payment in UPI app
8. Returns to app and uploads screenshot
9. Backend updates deposit status to SCREENSHOT_UPLOADED
10. Admin reviews deposit in ManagePayment → Deposits tab
11. Admin clicks "Approve" → Wallet credited + transaction record created
12. Player sees approved status in recent deposits

**Admin Flow**:
1. Admin navigates to ManagePayment
2. Creates payment link template (name, VPA, recipient name only)
3. Switches to Deposits tab
4. Filters by status (default: SCREENSHOT_UPLOADED)
5. Reviews pending deposits with screenshot preview
6. Approves (credits wallet) or Rejects (notifies user)

### Wallet Integration
When deposit is approved:
1. Admin calls `approveDeposit()`
2. Controller updates Wallet balance atomically
3. Creates Transaction record with type: "DEPOSIT"
4. Deposit status set to APPROVED
5. Player wallet immediately reflects new balance

### Error Handling
- Validation: Required fields (name, VPA, payee name, amount, link selection)
- File validation: Image only, max 5MB
- Business logic: Check for duplicate transaction IDs, valid statuses
- User feedback: Error alerts, success messages, loading states

### Navigation Integration
- Added `/deposit` route to main App.tsx
- Added "💳 Deposit" nav button to ThemeSelection bottom nav (between Home and Refer)
- Protected route requires authentication

## File Changes Summary

### Backend
- `prisma/schema.prisma`: Added PaymentLink + Deposit models with DepositStatus enum
- `src/controllers/adminController.ts`: Updated 5 payment link functions + added 3 deposit functions
- `src/controllers/depositController.ts`: NEW file with 6 deposit functions + helper
- `src/routes/depositRoutes.ts`: NEW file with 8 routes (5 player + 3 admin)
- `src/routes/adminRoutes.ts`: Added 3 new deposit endpoints

### Frontend
- `src/components/ManagePayment.tsx`: Replaced old form, added deposits tab with admin review
- `src/components/DepositPage.tsx`: NEW component with 3-step deposit flow
- `src/services/adminApi.ts`: Updated PaymentLink interface, added Deposit functions
- `src/services/playerApi.ts`: Added 5 deposit functions + interfaces
- `src/App.tsx`: Added DepositPage import + `/deposit` route
- `src/components/ThemeSelection.tsx`: Added "Deposit" nav button

## Testing Checklist
- [ ] Admin creates payment link template (name, VPA, payee name)
- [ ] Admin edits payment link details
- [ ] Admin toggles link active/inactive
- [ ] Admin deletes payment link
- [ ] Player fetches active payment links
- [ ] Player initiates deposit with amount selection
- [ ] Transaction ID generates uniquely
- [ ] UPI link opens in payment app
- [ ] Player uploads screenshot
- [ ] Admin sees pending deposit in Deposits tab
- [ ] Admin approves deposit → wallet credited
- [ ] Admin rejects deposit → status updated
- [ ] Player sees deposit history with status
- [ ] Filter deposits by status works

## Next Steps (Optional Enhancements)
- Implement actual cloud storage for screenshots (AWS S3, Firebase Storage, etc.)
- Add email notifications for deposit approval/rejection
- Implement receipt generation/download
- Add webhook support for UPI payment verification
- Create deposit analytics dashboard
- Add batch deposit approval feature
