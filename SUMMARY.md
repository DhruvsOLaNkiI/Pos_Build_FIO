# 🛒 POS System — Project Summary

This document provides an overview of the MERN-stack Point of Sale (POS) system built so far.

---

## 🚀 Architecture Overview

The project uses a **MERN** (MongoDB, Express, React, Node.js) architecture with a decoupled frontend and backend.

### **Restructured Folder View**
```
/untitled folder/
├── pos-backend/             # Express.js Server & Business Logic
│   ├── config/              # Database connection
│   ├── controllers/         # API route handlers
│   ├── middleware/          # JWT Auth & Error Handling
│   ├── models/              # Mongoose Database Schemas (7 models)
│   ├── routes/              # Express Routers
│   └── server.js            # Entry Point (Port 5001)
├── pos-frontend/            # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # UI Components (Sidebar, Navbar, Tables)
│   │   ├── context/         # Global State (AuthContext)
│   │   ├── pages/           # Application views (flat structure)
│   │   ├── services/         # API instance (Axios)
│   │   └── ui/              # ShadCN UI components
│   └── vite.config.js       # Proxy config (Port 5173)
├── .env                     # Shared Environment Variables
├── package.json             # Root scripts (Concurrently)
└── PHASE_RULES.md           # AI implementation guidelines
```

---

## ✅ Completed Phases

### **Phase 0: Project Setup & Architecture**
- Initialized a monorepo structure.
- Configured **MongoDB** connection with Mongoose.
- Setup **Express** server with global error handling and cookie-parser.
- Setup **Vite React** with Tailwind CSS and ShadCN UI integration.
- Root scripts allow running both servers with a single command: `npm run dev`.

### **Phase 1: Authentication & RBAC**
- **JWT-based Security**: Implemented login, registration, and logout.
- **Role-Based Access Control (RBAC)**: Support for `Owner`, `Cashier`, and `Staff`.
- **Protected Routes**: Middleware on both backend and frontend to secure specific actions.
- **Auth UI**: Modern, dark-mode Login, Register, and Forgot Password pages.

### **Phase 3: Product & Inventory Management**
- **Full CRUD**: Add, View, Edit, and Delete products.
- **Stock Tracking**: Real-time stock levels with low-stock alerts.
- **Bulk Price Update**: feature to adjust prices across categories.
- **UI**: Searchable product table with status badges.

### **Phase 4: Billing (POS Terminal) 🧾**
- **Interactive Terminal**: Fast product search and cart management.
- **Auto-Calculations**: Automatic GST and discount calculations.
- **Inventory Integration**: Stock levels automatically decrease upon checkout.
- **Payment Methods**: Support for Cash, UPI, and Card transactions.

---

## 🗄️ Database Models (7 Models)

| Model | Purpose |
| :--- | :--- |
| **User** | Authentication and profile details (Roles: owner, cashier, staff). |
| **Product** | Catalog details (Name, Prices, Category, GST, Stock, Barcode). |
| **Sale** | Transaction records (Invoices, payment methods, items sold). |
| **Customer** | CRM (Balance tracking, loyalty points, purchase history). |
| **Supplier** | Vendor management (Contact info, pending payments). |
| **Purchase** | Stock entry (Recording goods received from suppliers). |
| **Expense** | Cost tracking (Rent, salaries, utility bills, etc.). |

---

## 🛠️ How to Continue
1. **Run Dev Environment**: Use `npm run dev` from the root folder.
2. **Access Frontend**: Open `http://localhost:5173`.
3. **API Access**: Backend is running on `http://localhost:5001`.

**Next Phase:** Building out the UI/Logic for **Phase 5 (Customer & Employee Management)**.
