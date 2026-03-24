# TableTime - Project Structure Guide

## 📁 Complete Folder Organization

```
TableTime/
├── backend/                          # Node.js Express Server
│   ├── .env                         # ✅ Backend environment variables
│   ├── Server.js                    # Main server entry point
│   ├── package.json
│   │
│   ├── config/
│   │   └── db.js                    # MongoDB connection setup
│   │
│   ├── models/
│   │   └── User.model.js            # User schema with bcrypt & JWT
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # Register, Login, Google Auth, Forgot/Reset Password
│   │   ├── user.controller.js       # User profile routes
│   │   └── admin.controller.js      # Admin operations
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # POST /api/auth/register, /login, /google
│   │   ├── user.routes.js           # Protected user routes
│   │   └── admin.routes.js          # Protected admin routes
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT token verification (protect)
│   │   └── role.middleware.js       # Role-based access control
│   │
│   ├── utils/
│   │   ├── email_validator.js       # Email & password validation
│   │   ├── generateToken.js         # JWT token generation
│   │   └── FileHandler.js           # File upload utilities
│   │
│   ├── public/                       # Static files
│   ├── node_modules/
│   └── user.json                    # User data backup (optional)
│
├── frontend/                         # React + TypeScript + Vite
│   ├── .env.local                   # ✅ Frontend environment variables
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── package.json
│   │
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Main App component
│   │   ├── App.css
│   │   ├── index.css
│   │   │
│   │   ├── api/
│   │   │   └── api.ts               # ✅ Axios instance (baseURL: http://localhost:5000/api)
│   │   │
│   │   ├── components/
│   │   │   ├── navbar.tsx           # Navigation component
│   │   │   └── RestaurantScene.tsx  # Restaurant UI component
│   │   │
│   │   ├── Pages/
│   │   │   ├── Login.tsx            # ✅ Login modal with error handling
│   │   │   ├── Register.tsx         # Registration modal with Google OAuth
│   │   │   ├── Dashboard.tsx        # Protected dashboard
│   │   │   ├── HeroSection.tsx      # Hero section
│   │   │   └── (other pages)
│   │   │
│   │   ├── assets/                  # Images, icons, etc.
│   │   └── (other directories)
│   │
│   ├── public/
│   └── node_modules/
│
├── .git/                            # Git repository
├── .gitignore
├── package.json                     # Root package.json
└── README.md
```

---

## 🔧 Environment Variables Setup

### Backend (.env) Location: `backend/.env`
```env
WEATHER_API_KEY=37ab5674ec2a74ff80f76ac71b7df0de
MONGO_URI=mongodb://127.0.0.1:27017/learnMongo
PORT=5000
JWT_SECRET=45rohit264
JWT_EXPIRE=2h
VITE_GOOGLE_CLIENT_ID=844101499216-3itrukj7c5lses66parapkmdrd34hnig.apps.googleusercontent.com
GOOGLE_CLIENT_ID=844101499216-3itrukj7c5lses66parapkmdrd34hnig.apps.googleusercontent.com
```

### Frontend (.env.local) Location: `frontend/.env.local`
```env
VITE_GOOGLE_CLIENT_ID=844101499216-3itrukj7c5lses66parapkmdrd34hnig.apps.googleusercontent.com
```

---

## 🚀 How to Run

### Terminal 1: Start Backend
```powershell
cd c:\Users\l\OneDrive\Desktop\TableTime\backend
npm start
```
**Expected Output:**
```
Server running on port 5000
API Endpoint: http://localhost:5000/api/auth
```

### Terminal 2: Start Frontend (if not running)
```powershell
cd c:\Users\l\OneDrive\Desktop\TableTime\frontend
npm run dev
```
**Expected Output:**
```
Local: http://localhost:5173
```

### Terminal 3: Verify MongoDB
```powershell
mongosh
```

---

## 🔐 Authentication Flow

### 1. **Registration** (`POST /api/auth/register`)
- Email validation → Password validation → Hash password → Save to DB → Generate JWT token

### 2. **Login** (`POST /api/auth/login`) 
- Find user by email → Compare password with bcrypt → Generate JWT token
- **Token stored in:** `localStorage.setItem("token", response.data.token)`

### 3. **Protected Routes**
- Middleware checks: `Authorization: Bearer <token>`
- Extracts `userId` from JWT → Fetches user from DB

### 4. **Google OAuth**
- Google credential verified → User created/found → JWT token generated

---

## 📋 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new account |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/google` | ❌ | Google OAuth login |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |
| POST | `/api/auth/reset-password/:token` | ❌ | Reset password |
| GET | `/api/user/profile` | ✅ | Get user profile |
| PUT | `/api/user/profile` | ✅ | Update user profile |

---

## ✅ Checklist Before Testing

- [ ] MongoDB is running (`mongosh` works)
- [ ] Backend `.env` file exists with all variables
- [ ] Frontend `.env.local` file exists with Google Client ID
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Google OAuth configured correctly
- [ ] Network tab shows requests to `http://localhost:5000/api/*`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "AxiosError: Network Error" | Backend not running - `npm start` in backend folder |
| "ECONNREFUSED" | MongoDB not running or wrong URI |
| "Invalid credentials" | Wrong email/password or user doesn't exist |
| "Google login error" | Check GOOGLE_CLIENT_ID in .env files |
| "Token invalid or expired" | Clear localStorage, login again |

