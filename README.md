# POS System & Customer Portal

This project consists of three main components:
1. **pos-backend**: Node.js/Express server (API).
2. **pos-frontend**: React/Vite admin dashboard for POS operations.
3. **customer-portal**: React/Vite portal for customers to place orders.

## 🛠 Prerequisites

- **Node.js**: (v18 or higher recommended)
- **MongoDB**: (Local or Atlas instance)
- **npm** or **yarn**

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/DhruvsOLaNkiI/Pos_Build_FIO.git
cd Pos_Build_FIO
```

### 2. Environment Setup (Crucial)
The `.env` file is ignored by Git for security. You **MUST** create a `.env` file in the root directory (`/untitled folder/` or the project root) for the backend to function.

Create a file named `.env` and add the following:

```env
# Database Connection (Replace with your own if using MongoDB Atlas)
MONGO_URI=mongodb://localhost:27017/pos_system

# Security
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 3. Install Dependencies

You need to install dependencies for each part of the project:

```bash
# Backend
cd pos-backend
npm install

# Admin Frontend
cd ../pos-frontend
npm install

# Customer Portal
cd ../customer-portal
npm install
```

### 4. Running the Project

Open three terminal windows to run everything simultaneously:

**Terminal 1 (Backend Server):**
```bash
cd pos-backend
npm run dev
```

**Terminal 2 (Admin POS Frontend):**
```bash
cd pos-frontend
npm run dev
```

**Terminal 3 (Customer Portal):**
```bash
cd customer-portal
npm run dev
```

## 📝 Configuration Note
- The default backend port is `5001`.
- If you change the `PORT` in `.env`, ensure you update the `VITE_API_URL` or equivalent in the frontend `src/services/api.js` files.

## 📦 Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT.
