# 🍽️ TableTime - Restaurant Table Booking System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-%3E%3D19.2.0-blue)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.9.3-3178c6)
![Status](https://img.shields.io/badge/status-active-success.svg)

A full-stack restaurant table booking system built with modern technologies featuring real-time reservation management, user authentication, and seamless payment integration.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Features](#-features)
- [🏗️ Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [📖 Usage](#-usage)
- [🔌 API Documentation](#-api-documentation)
- [🔐 Authentication](#-authentication)
- [🛠️ Development](#-development)
- [🐛 Troubleshooting](#-troubleshooting)
- [📝 License](#-license)
- [👥 Contributing](#-contributing)
- [📧 Contact](#-contact)

---

## Overview

**TableTime** is a comprehensive restaurant table booking platform that streamlines the reservation process for both customers and restaurant staff. With real-time availability tracking, secure user authentication, and integrated payment processing, TableTime modernizes the dining reservation experience.

### Key Capabilities
- 🎯 Real-time table availability management
- 👤 Secure user authentication with OAuth integration
- 💳 Stripe payment integration
- 🔔 Email notifications for booking confirmations
- 📊 Admin dashboard for reservation management
- 🌐 Responsive, modern UI with 3D visualization
- ⚡ Real-time updates using Socket.io

---

## ✨ Features

### For Users
- **Easy Registration & Login** - Traditional or Google OAuth authentication
- **Browse Restaurants** - View available tables with interactive 3D visualization
- **Book Tables** - Simple, intuitive booking interface
- **Manage Reservations** - View, modify, and cancel bookings
- **Secure Payments** - Stripe integration for secure transactions
- **Email Confirmations** - Automatic booking confirmation emails
- **Password Recovery** - Forgot password with secure reset tokens
- **Profile Management** - Update personal information and preferences

### For Administrators
- **Reservation Dashboard** - Complete overview of all bookings
- **Real-time Notifications** - Instant alerts for new bookings
- **Analytics** - Booking statistics and insights
- **User Management** - Manage restaurant users and staff
- **System Configuration** - Update restaurant details and settings

### System Features
- ⚡ Real-time data synchronization with Socket.io
- 🔒 JWT-based authentication with token refresh
- 🎨 Responsive design with Tailwind CSS
- 📱 Mobile-friendly interface
- 🚀 Optimized performance with Vite
- 🔐 Password hashing with bcrypt
- 📧 Email notifications via Nodemailer
- ☁️ Cloud file storage with Cloudinary

---

## 🏗️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | LTS | JavaScript runtime |
| **Express.js** | ^5.2.1 | Web framework |
| **MongoDB** | 9+ | NoSQL database |
| **Mongoose** | ^9.0.2 | MongoDB ODM |
| **JWT** | ^9.0.3 | Authentication |
| **bcrypt** | ^6.0.0 | Password hashing |
| **Socket.io** | ^4.8.3 | Real-time communication |
| **Stripe** | ^21.0.1 | Payment processing |
| **Nodemailer** | ^8.0.4 | Email service |
| **Cloudinary** | ^2.9.0 | File storage |
| **Helmet** | ^8.1.0 | Security headers |
| **CORS** | ^2.8.5 | Cross-origin requests |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | ^19.2.0 | UI library |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^7.3.1 | Build tool |
| **React Router** | ^7.13.1 | Routing |
| **Axios** | ^1.13.6 | HTTP client |
| **Tailwind CSS** | ^3.4.1 | Styling |
| **Three.js** | ^0.183.2 | 3D graphics |
| **React Three Fiber** | ^9.5.0 | 3D in React |
| **Stripe React** | ^6.0.0 | Payment UI |
| **Framer Motion** | ^12.34.3 | Animations |
| **Socket.io Client** | ^4.8.3 | Real-time updates |
| **React Hot Toast** | ^2.6.0 | Notifications |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **Nodemon** | ^3.1.11 | Auto-restart on changes |
| **ESLint** | ^9.39.1 | Code quality |
| **TypeScript ESLint** | ^8.48.0 | TS linting |

---

## 📁 Project Structure

```
restaurant-table-booking/
├── 📂 backend/                          # Node.js Express Server
│   ├── .env                             # Environment variables (create manually)
│   ├── .env.example                     # Example environment file
│   ├── Server.js                        # Application entry point
│   ├── package.json                     # Backend dependencies
│   ├── package-lock.json
│   │
│   ├── 📁 config/
│   │   └── db.js                        # MongoDB connection configuration
│   │
│   ├── 📁 models/
│   │   ├── User.model.js                # User schema with bcrypt hashing
│   │   ├── Booking.model.js             # Booking schema
│   │   ├── Restaurant.model.js          # Restaurant schema
│   │   └── Table.model.js               # Table schema
│   │
│   ├── 📁 controllers/
│   │   ├── auth.controller.js           # Auth logic (register, login, OAuth, password reset)
│   │   ├── user.controller.js           # User profile management
│   │   ├── booking.controller.js        # Booking operations
│   │   ├── restaurant.controller.js     # Restaurant management
│   │   └── admin.controller.js          # Admin operations
│   │
│   ├── 📁 routes/
│   │   ├── auth.routes.js               # Authentication endpoints
│   │   ├── user.routes.js               # User profile endpoints
│   │   ├── booking.routes.js            # Booking endpoints
│   │   ├── restaurant.routes.js         # Restaurant endpoints
│   │   └── admin.routes.js              # Admin endpoints
│   │
│   ├── 📁 middleware/
│   │   ├── auth.middleware.js           # JWT verification & token validation
│   │   ├── role.middleware.js           # Role-based access control (RBAC)
│   │   ├── errorHandler.middleware.js   # Global error handling
│   │   └── validator.middleware.js      # Input validation
│   │
│   ├── 📁 utils/
│   │   ├── email.validator.js           # Email validation utilities
│   │   ├── password.validator.js        # Password validation utilities
│   │   ├── generateToken.js             # JWT token generation
│   │   ├── sendEmail.js                 # Email sending service
│   │   ├── cloudinary.config.js         # Cloudinary file upload
│   │   └── constants.js                 # Application constants
│   │
│   ├── 📁 public/                       # Static files & assets
│   ├── 📁 uploads/                      # Temporary file uploads
│   ├── 📁 node_modules/                 # Dependencies
│   └── user.json                        # User data backup (optional)
│
├── 📂 frontend/                         # React + TypeScript + Vite Application
│   ├── .env.local                       # Frontend environment variables (create manually)
│   ├── .env.example                     # Example environment file
│   ├── vite.config.ts                   # Vite configuration
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   ├── postcss.config.js                # PostCSS configuration
│   ├── index.html                       # HTML entry point
│   ├── package.json                     # Frontend dependencies
│   ├── package-lock.json
│   │
│   ├── 📂 src/
│   │   ├── main.tsx                     # React application entry point
│   │   ├── App.tsx                      # Root component with routing
│   │   ├── App.css                      # Global styles
│   │   ├── index.css                    # CSS reset & variables
│   │   │
│   │   ├── 📁 api/
│   │   │   └── api.ts                   # Axios instance with interceptors
│   │   │                                # (baseURL: http://localhost:5000/api)
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── navbar.tsx               # Navigation bar
│   │   │   ├── RestaurantScene.tsx      # 3D restaurant visualization
│   │   │   ├── BookingForm.tsx          # Booking form component
│   │   │   ├── LoadingSpinner.tsx       # Loading indicator
│   │   │   └── Footer.tsx               # Footer component
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Login.tsx                # Login modal with error handling
│   │   │   ├── Register.tsx             # Registration modal with Google OAuth
│   │   │   ├── Dashboard.tsx            # User dashboard (protected)
│   │   │   ├── HeroSection.tsx          # Landing page hero
│   │   │   ├── BookingPage.tsx          # Main booking interface
│   │   │   ├── MyBookings.tsx           # User bookings page
│   │   │   ├── AdminDashboard.tsx       # Admin panel (protected)
│   │   │   ├── PaymentPage.tsx          # Payment processing page
│   │   │   └── NotFound.tsx             # 404 page
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useAuth.ts               # Authentication custom hook
│   │   │   ├── useBooking.ts            # Booking operations hook
│   │   │   └── useSocket.ts             # Socket.io connection hook
│   │   │
│   │   ├── 📁 context/
│   │   │   ├── AuthContext.tsx          # Authentication state management
│   │   │   └── BookingContext.tsx       # Booking state management
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── User.ts                  # User TypeScript interface
│   │   │   ├── Booking.ts               # Booking TypeScript interface
│   │   │   └── Restaurant.ts            # Restaurant TypeScript interface
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── localStorage.ts          # LocalStorage helper functions
│   │   │   ├── formatters.ts            # Data formatting utilities
│   │   │   └── validators.ts            # Client-side validation
│   │   │
│   │   ├── 📁 assets/
│   │   │   ├── images/                  # Image files
│   │   │   ├── icons/                   # Icon assets
│   │   │   └── fonts/                   # Custom fonts
│   │   │
│   │   └── 📁 styles/
│   │       ├── colors.css               # Color variables
│   │       ├── animations.css           # Animation definitions
│   │       └── responsive.css           # Responsive styles
│   │
│   ├── 📂 public/                       # Public static files
│   │   └── favicon.svg
│   │
│   └── 📁 node_modules/                 # Dependencies
│
├── 📂 .git/                             # Git repository
├── .gitignore                           # Git ignore rules
├── package.json                         # Root package.json
├── package-lock.json
├── PROJECT_STRUCTURE.md                 # Detailed structure guide
└── README.md                            # This file

```

---

## 🚀 Installation

### Prerequisites
Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v7.0.0 or higher) - comes with Node.js
- **MongoDB** (v4.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Verify Installations
```bash
node --version          # Should show v16.0.0 or higher
npm --version           # Should show v7.0.0 or higher
mongod --version        # Should show version info
git --version           # Should show version info
```

### Step 1: Clone the Repository
```bash
git clone https://github.com/Pawan19786/restaurant-table-booking.git
cd restaurant-table-booking
```

### Step 2: Install Dependencies
```bash
# Install all dependencies (backend, frontend, and root)
npm run setup

# Or manually:
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ../
```

### Step 3: Configure Environment Variables

#### Backend Configuration
Create `backend/.env` file:
```bash
cd backend
touch .env
```

Add the following content to `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/tabletime

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=2h
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email Service (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Payment Gateway
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# File Upload (Cloudinary)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# API Configuration
API_URL=http://localhost:5000/api
WEATHER_API_KEY=optional_weather_api_key
```

#### Frontend Configuration
Create `frontend/.env.local` file:
```bash
cd ../frontend
touch .env.local
```

Add the following content to `frontend/.env.local`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Stripe
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Environment
VITE_NODE_ENV=development
```

### Step 4: Start MongoDB
```bash
# Start MongoDB service (ensure it's running)
# On Windows:
mongod

# On macOS with Homebrew:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh
> db.version()  # Should return version number
```

---

## 🔧 Configuration

### Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | ✅ |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/tabletime | ✅ |
| `JWT_SECRET` | JWT signing secret | complex_secret_string | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | 844101499216-xxx.apps.googleusercontent.com | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret API key | sk_test_xxx | ✅ |
| `EMAIL_USER` | Email sender address | noreply@tabletime.com | ✅ |
| `CLOUDINARY_NAME` | Cloudinary account name | your_account | ❌ |

### Important Security Notes
⚠️ **DO NOT** commit `.env` files to version control  
⚠️ **NEVER** share your secret keys or API credentials  
⚠️ Use strong, unique JWT secrets in production  
⚠️ Enable HTTPS in production  
⚠️ Implement rate limiting  
⚠️ Use environment-specific configurations  

---

## 📖 Usage

### Development Mode

#### Option 1: Using Combined Script
```bash
npm run dev
# This starts both backend and frontend in separate terminal windows
```

#### Option 2: Manual Setup (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server running on port 5000
# Output: "Server running on port 5000"
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on port 5173
# Output: "Local: http://localhost:5173"
```

**Terminal 3 - MongoDB (if not running as service):**
```bash
mongod
# Database running on port 27017
```

### Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **MongoDB:** mongodb://localhost:27017/tabletime

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
# Creates optimized build in dist/ folder
```

#### Build Backend
Backend doesn't require building, but you can verify and optimize:
```bash
cd backend
npm install --production
# This removes devDependencies for production
```

### Running in Production
```bash
NODE_ENV=production npm start
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Response Format
All API responses follow this standard format:

#### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  },
  "timestamp": "2026-04-30T10:30:00Z"
}
```

#### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description",
  "error": "SPECIFIC_ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-04-30T10:30:00Z"
}
```

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John"
    }
  }
}
```

#### Google OAuth Login
```
POST /auth/google
Content-Type: application/json

{
  "credential": "google_jwt_token_from_frontend"
}

Response: 200 OK
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com"
    }
  }
}
```

#### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

#### Reset Password
```
POST /auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successful"
}
```

### User Endpoints

#### Get User Profile
```
GET /user/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "createdAt": "2026-01-15T08:00:00Z"
  }
}
```

#### Update User Profile
```
PUT /user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

### Booking Endpoints

#### Create Booking
```
POST /booking/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "507f1f77bcf86cd799439012",
  "tableId": "507f1f77bcf86cd799439013",
  "bookingDate": "2026-05-10",
  "bookingTime": "19:00",
  "numberOfGuests": 4,
  "specialRequests": "Window seat preferred"
}

Response: 201 Created
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "507f1f77bcf86cd799439014",
    "status": "confirmed"
  }
}
```

#### Get User Bookings
```
GET /booking/my-bookings
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "bookingId": "507f1f77bcf86cd799439014",
      "restaurant": "Italian Bistro",
      "bookingDate": "2026-05-10",
      "bookingTime": "19:00",
      "numberOfGuests": 4,
      "status": "confirmed"
    }
  ]
}
```

#### Cancel Booking
```
DELETE /booking/:bookingId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

### Admin Endpoints

#### Get All Bookings (Admin Only)
```
GET /admin/bookings
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "bookingId": "507f1f77bcf86cd799439014",
      "user": { /* user details */ },
      "restaurant": { /* restaurant details */ },
      "status": "confirmed"
    }
  ]
}
```

#### Update Booking Status (Admin Only)
```
PUT /admin/booking/:bookingId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "completed"
}

Response: 200 OK
{
  "success": true,
  "message": "Booking status updated successfully"
}
```

---

## 🔐 Authentication

### JWT Authentication Flow

#### 1. Registration Process
```
User Input → Validation → Hash Password (bcrypt) → Save to DB → Generate JWT → Return Token
```

#### 2. Login Process
```
Email & Password Input → Find User → Compare Passwords (bcrypt) → Generate JWT → Return Token
```

#### 3. Token Storage
```javascript
// Frontend stores token in localStorage
localStorage.setItem("token", response.data.token);
```

#### 4. Protected Routes
```javascript
// Middleware checks for valid JWT
Authorization: Bearer <token>
// Extracts userId from token → Fetches user from DB
```

#### 5. Google OAuth
```
Google Credential → Verify with Google → Create/Find User → Generate JWT
```

### Token Structure
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "iat": 1682947200,
  "exp": 1682954400
}

Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### Using Tokens in Requests
```javascript
// Frontend - Axios Interceptor
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🛠️ Development

### Scripts

```bash
# Root level commands
npm run setup           # Install all dependencies
npm run dev            # Start both backend and frontend

# Backend commands
npm run backend        # Start backend
npm run backend:dev    # Start backend with hot-reload

# Frontend commands
npm run frontend       # Start frontend dev server
npm run frontend:build # Build optimized production bundle
```

### Code Style & Quality

#### ESLint Configuration
```bash
cd frontend
npm run lint           # Check for linting errors
```

#### TypeScript Type Checking
```bash
cd frontend
npm run build          # Runs TypeScript compiler
```

### Git Workflow

#### Initialize Local Repository
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

#### Common Commands
```bash
git status             # Check status
git add .              # Stage changes
git commit -m "feat: add new feature"  # Commit with message
git push origin main   # Push to remote
git pull origin main   # Pull latest changes
```

#### Branch Management
```bash
git checkout -b feature/new-feature    # Create new branch
git checkout main                      # Switch branch
git merge feature/new-feature          # Merge branch
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **AxiosError: Network Error** | Backend not running | `cd backend && npm run dev` |
| **ECONNREFUSED** | MongoDB not running | Start MongoDB: `mongod` |
| **Invalid credentials** | Wrong email/password | Verify credentials in DB |
| **Google login error** | Incorrect OAuth configuration | Check GOOGLE_CLIENT_ID in .env |
| **Token invalid or expired** | Expired/invalid JWT | Clear localStorage, login again |
| **CORS error** | Frontend URL not in CORS whitelist | Add CLIENT_URL to backend .env |
| **Port already in use** | Port 5000/5173 already in use | Change port in .env |
| **MongoDB connection failed** | Wrong MONGO_URI | Check connection string format |
| **Email not sending** | Gmail app password incorrect | Generate new app password |

### Pre-Deployment Checklist

- [ ] MongoDB is running and accessible
- [ ] Backend `.env` has all required variables
- [ ] Frontend `.env.local` has all required variables
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Google OAuth properly configured
- [ ] Stripe keys valid and configured
- [ ] Email service configured
- [ ] Cloudinary (if using) configured
- [ ] No console errors in browser DevTools
- [ ] Network tab shows successful API requests

### Getting Help

1. **Check the logs** - Review console output for error messages
2. **Network tab** - Inspect API requests in browser DevTools
3. **MongoDB compass** - Verify database connection and data
4. **Postman** - Test API endpoints directly
5. **Documentation** - Review PROJECT_STRUCTURE.md for architecture details

---

## 🚀 Deployment

### Deploy Backend (Node.js)

#### Option 1: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create tabletime-backend

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGO_URI=your_mongodb_uri

# Deploy
git push heroku main
```

#### Option 2: Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy

#### Option 3: DigitalOcean
1. Create Droplet (Ubuntu 22.04)
2. Install Node.js and MongoDB
3. Clone repository
4. Set environment variables
5. Run `npm start`

### Deploy Frontend (React)

#### Option 1: Vercel
```bash
npm install -g vercel
vercel
```

#### Option 2: Netlify
```bash
npm run build
# Deploy dist folder to Netlify
```

#### Option 3: GitHub Pages
```bash
npm run build
# Push dist folder to gh-pages branch
```

---

## 📝 License

This project is licensed under the **ISC License** - see below for details.

```
ISC License (ISC)

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

---

## 👥 Contributing

We welcome contributions from the community! Here's how to get started:

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report issues responsibly

### How to Contribute

1. **Fork the Repository**
   ```bash
   # Go to https://github.com/Pawan19786/restaurant-table-booking
   # Click "Fork" button
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/restaurant-table-booking.git
   cd restaurant-table-booking
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make Changes**
   - Follow existing code style
   - Write meaningful commit messages
   - Add comments for complex logic
   - Test thoroughly

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

6. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open Pull Request**
   - Describe changes clearly
   - Link related issues
   - Include screenshots if UI changes

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(auth): add two-factor authentication

Implement TOTP-based 2FA using speakeasy library.
Add 2FA setup in user profile.

Closes #123
```

---

## 📧 Contact

### Project Author
- **Name:** Pawan Sahu
- **GitHub:** [@Pawan19786](https://github.com/Pawan19786)
- **Email:** pawan@example.com

### Support
- **Issues:** [GitHub Issues](https://github.com/Pawan19786/restaurant-table-booking/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Pawan19786/restaurant-table-booking/discussions)

### Follow for Updates
- ⭐ Star the repository
- 👀 Watch for updates
- 🔔 Enable notifications

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [Stripe Integration Guide](https://stripe.com/docs/stripe-js)
- [Socket.io Guide](https://socket.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🌟 Acknowledgments

- Built with ❤️ using React, Node.js, and MongoDB
- Inspired by modern restaurant booking platforms
- Thanks to all contributors and supporters

---

<div align="center">

**Made with ❤️ by [Pawan Sahu](https://github.com/Pawan19786)**

If you found this project helpful, please consider giving it a ⭐

[⬆ Back to Top](#-tabletime---restaurant-table-booking-system)

</div>
