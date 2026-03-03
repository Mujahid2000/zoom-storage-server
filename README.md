# Zoom Cloud - Backend API

Zoom Cloud is a robust, scalable backend for a SaaS Cloud Storage platform. It handles authentication, file/folder management, subscription logic, and administrative controls.

## 🚀 Features

- **Authentication**: Secure JWT-based authentication with email verification and password reset functionality.
- **File Management**: Integrated with **Cloudinary** for reliable cloud storage. Supports file uploads, renaming, and secure downloads.
- **Folder System**: Hierarchical folder structure with nested folder support.
- **Subscription Engine**: 
  - Dynamic package management (Admin-controlled).
  - Automated 30-day subscription expiry logic.
  - **Restriction**: Users are limited to one package purchase/update every 30 days to ensure system stability.
- **Admin Portal API**: Comprehensive endpoints for managing users, packages, system configurations, and monitoring subscriptions.
- **Maintenance Mode**: System-wide toggle to gracefully handle updates.
- **API Documentation**: Fully documented using **Swagger/OpenAPI**.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Storage**: Cloudinary
- **Documentation**: Swagger UI
- **Deployment Ready**: Modular architecture designed for easy deployment.

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- Cloudinary Account
- SMTP Server (for emails)

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/zoomit"
   JWT_SECRET="your_secret_key"
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   EMAIL_HOST="smtp.example.com"
   EMAIL_PORT=587
   EMAIL_USER="your_email"
   EMAIL_PASS="your_password"
   CLIENT_URL="http://localhost:3000"
   ```

4. **Database Migration**:
   ```bash
   npx prisma migrate dev
   ```

5. **Run the server**:
   ```bash
   npm run dev
   ```

## 📖 API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
`http://localhost:5000/api-docs`

## 🛡️ Key Security Implementations

- **Password Hashing**: Bcrypt for secure storage.
- **Middleware**: Custom authentication and role-based access control (RBAC).
- **Subscription Guards**: Middleware to ensure users have active plans before allowing storage operations.
