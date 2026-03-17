# POS System Project — Phase Rules & AI Instructions

This document is the **single source of truth** for building the MERN-stack Point of Sale (POS) system.
**Any AI assistant working on this project MUST follow these rules strictly.**

---

## 🚀 Project Overview
**Goal:** Build a comprehensive POS system for retail shops.
**Tech Stack:**
- **Frontend:** React 18 (Vite), Tailwind CSS, ShadCN UI, Lucide React, Recharts, Axios.
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Authentication.
- **Tools:** Concurrently (run both servers), Nodemon.

---

## ⚠️ CRITICAL RULES FOR AI ASSISTANTS

1.  **Phase-by-Phase Execution**:
    - Do NOT jump ahead. Complete **Phase X** fully before starting **Phase X+1**.
    - **Verification is Mandatory**: After finishing a phase, you MUST verify the code (run server/client, check logs, or ask user to test) before marking it complete.

2.  **File Structure Consistency**:
    - **Frontend (`/client`)**:
        - Components go in `src/components/{module_name}/`.
        - Pages go in `src/pages/{module_name}/`.
        - Context go in `src/context/`.
    - **Backend (`/server`)**:
        - Controllers go in `controllers/`.
        - Models go in `models/`.
        - Routes go in `routes/`.

3.  **Code Quality**:
    - Use `async/await` for all DB operations.
    - Use `try/catch` blocks in all controllers.
    - Use meaningful variable names (e.g., `productDocs` instead of `data`).
    - **NO placeholder code**. Write functional logic or `// TODO: Implement later` if strictly necessary for future phases.

4.  **Error Handling**:
    - Backend: Return standardized JSON errors `{ success: false, message: "..." }`.
    - Frontend: Show user-friendly toasts/alerts on error.

---

## 📅 Implementation Phases

### Phase 0: Project Setup (📍 CURRENT STATUS: COMPLETE)
- [x] Create project structure (pos-frontend/pos-backend folders).
- [x] Initialize `package.json` for root, client, and server.
- [x] Connect MongoDB (`config/db.js`).
- [x] Set up Express server entry point (`server.js`).
- [x] Set up Vite React entry point (`main.jsx`, `App.jsx`).
- **Pass Criteria:** `npm run dev` starts both servers without errors.

### Phase 1: Authentication & Security (📍 STATUS: COMPLETE ✅ — Enhanced)
- [x] **Backend**:
    - User Model (Name, Email, Password, Role: Owner/Cashier/Staff, isApproved, status).
    - Auth Routes: Register (public — first user becomes Owner, rest are pending), Login (blocks unapproved users), Forgot Password.
    - Middleware: `authMiddleware` (JWT verification), `adminMiddleware` (Role check).
- [x] **Frontend**:
    - Login Page (with Role Category selector: Owner/Cashier/Staff), Register Page (with Role Category selector: Staff/Cashier).
    - `AuthContext`: Manage user state & tokens, handles `pendingApproval` response.
    - Protected Routes wrapper.
- [x] **Enhancement**: Employee Self-Registration & Owner Approval Workflow:
    - Employees register themselves → account is `pending`.
    - Owner sees pending requests in Employees page → Approves/Rejects.
    - Only approved users can login.
- **Pass Criteria:** User can register, login, and access a protected dashboard route. Staff/Cashier registration requires owner approval.

### Phase 2: Dashboard (Analytics)
- [x] **Backend**: Aggregation pipelines for Total Sales, Profit, Low Stock, Top Products.
- [x] **Frontend**: Dashboard UI with Cards (KPIs) and Charts (Recharts).
- **Pass Criteria:** Dashboard loads data from (mocked or real) DB.

### Phase 3: Product & Inventory Management
- [x] **Backend**: Product CRUD (Name, Category, Price, Stock, Barcode).
- [x] **Frontend**: Product List (Table), Add/Edit Product Forms.
- [x] **Feature**: Bulk Price Update.
- **Pass Criteria:** Can add a product, see it in the list, edit it, and delete it.

### Phase 4: Billing (POS Terminal) 🛒
- [x] **Backend**: Sale Model (Items, Tax, Discount, Total, Payment Method).
- [x] **Frontend**:
    - POS Interface: Product Search bar (left), Cart (right).
    - Barcode Scanner integration (auto-focus input).
    - Payment Modal (Cash/Card/UPI).
    - Print Receipt (Thermal printer format).
- **Pass Criteria:** Complete a full checkout flow -> Stock decreases -> Sale recorded.

### Phase 5: People Management (📍 STATUS: COMPLETE ✅)
- [x] Customers: Track credit, loyalty points. CRUD with search.
- [x] Employees: Self-registration with owner approval flow.
    - Backend: `employeeController.js` (CRUD + `/approve` endpoint), `employeeRoutes.js`.
    - Frontend: `Employees.jsx` with Pending Approvals section (Approve/Reject) + Active Employees table.
    - Role selection during registration (Staff/Cashier), preserved through approval.
    - Owner can also add employees directly (auto-approved).
- [x] Suppliers: Manage vendors, purchase orders.
- **Pass Criteria:** CRUD operations for all three user types. Employee self-registration & approval working.

### Phase 6: Purchase Management (📍 STATUS: COMPLETE ✅)
- [x] Stock Entry: Add items from Suppliers (auto increases stock).
- [x] Purchase History logs with payment status tracking.
- [x] Stock rollback on purchase deletion.
- **Pass Criteria:** Adding a purchase order updates the product stock level.

### Phase 7: Reports & Expenses (📍 CURRENT STATUS: PENDING)
- [ ] Sales Reports (Daily/Weekly/Monthly).
- [ ] GST Reports (GSTR-1 format).
- [ ] Expense Tracker (CRUD, categories, date filter).
- **Pass Criteria:** Generating a report matches the actual sales data.

### Phase 8: Settings & Alerts
- [ ] Shop Settings (Logo, Address, Tax Rates).
- [ ] Alerts Component (Low Stock, Expiry).
- **Pass Criteria:** Changing tax rate updates billing calculation.

---

## 🛑 Verification Steps (Before Moving to Next Phase)
1.  **Check Terminal**: No crashing errors?
2.  **Check Database**: valid data being saved?
3.  **Check UI**: Is it responsive? Does it look good (Glassmorphism)?
4.  **User Confirmation**: "Phase X is done. Ready for Phase X+1?"

---

*This file was generated to guide AI agents. Do not delete.*
