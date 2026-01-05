# 🚀 RentVerse Deployment Guide

<p align="center"><i>Complete Guide for Deploying RentVerse to Production</i></p>

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Local Development Setup](#-local-development-setup)
3. [Environment Configuration](#-environment-configuration)
4. [Database Setup (Supabase)](#-database-setup-supabase)
5. [Backend Deployment (Railway/Render)](#-backend-deployment-railwayrender)
6. [Frontend Deployment (Vercel)](#-frontend-deployment-vercel)
7. [AI Service Deployment](#-ai-service-deployment)
8. [Mobile App Build (Android)](#-mobile-app-build-android)
9. [External Services Setup](#-external-services-setup)
10. [Post-Deployment Checklist](#-post-deployment-checklist)
11. [Monitoring & Maintenance](#-monitoring--maintenance)

---

## 📦 Prerequisites

### Required Tools

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Comes with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/) |
| Python | 3.9+ | [python.org](https://www.python.org/) |

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| GitHub | Source control | [github.com](https://github.com/) |
| Supabase | PostgreSQL database | [supabase.com](https://supabase.com/) |
| Cloudinary | Media storage | [cloudinary.com](https://cloudinary.com/) |
| Vercel | Frontend hosting | [vercel.com](https://vercel.com/) |
| Railway/Render | Backend hosting | [railway.app](https://railway.app/) |
| Resend | Email service | [resend.com](https://resend.com/) |

---

## 💻 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/uitm-devops-challenge_VECNA-main.git
cd uitm-devops-challenge_VECNA-main
```

### 2. Backend Setup

```bash
cd rentverse-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure .env with your credentials (see Environment Configuration)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

Backend runs at: `http://localhost:3000`

### 3. Frontend Setup

```bash
cd rentverse-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure .env.local

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3001`

### 4. AI Service Setup (Optional)

```bash
cd rentverse-ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn rentverse.main:app --reload --port 8000
```

AI Service runs at: `http://localhost:8000`

---

## ⚙️ Environment Configuration

### Backend Environment Variables

Create `rentverse-backend/.env`:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/rentverse

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-key

# ===========================================
# EMAIL SERVICE (Gmail)
# ===========================================
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# For Gmail App Password:
# 1. Enable 2FA on Google Account
# 2. Go to: myaccount.google.com/apppasswords
# 3. Generate new app password

# ===========================================
# CLOUDINARY (Media Storage)
# ===========================================
CLOUD_CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret

# ===========================================
# GOOGLE OAUTH (Optional)
# ===========================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===========================================
# AI SERVICE (Optional)
# ===========================================
AI_SERVICE_URL=http://localhost:8000

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### Frontend Environment Variables

Create `rentverse-frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# MapTiler (for maps)
NEXT_PUBLIC_MAPTILER_KEY=your-maptiler-api-key

# Google OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click **"New Project"**
3. Enter project name: `rentverse-production`
4. Set a strong database password
5. Select region closest to your users
6. Click **"Create new project"**

### 2. Get Connection String

1. Go to **Project Settings** → **Database**
2. Copy the **Connection string (URI)**
3. Replace `[YOUR-PASSWORD]` with your database password

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 3. Configure Prisma

Update your `.env` file:

```env
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

### 4. Run Migrations

```bash
cd rentverse-backend

# Push schema to production database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### 5. Verify Connection

```bash
# Open Prisma Studio to view data
npx prisma studio
```

---

## ☁️ Backend Deployment (Railway/Render)

### Option A: Railway

#### 1. Create Railway Project

1. Go to [railway.app](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select the repository

#### 2. Configure Service

1. Click on the service
2. Go to **"Settings"** → **"Root Directory"**
3. Set to: `rentverse-backend`

#### 3. Add Environment Variables

Go to **"Variables"** and add all backend environment variables:

```
DATABASE_URL=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
CLOUD_CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
NODE_ENV=production
BASE_URL=https://your-app.up.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
```

#### 4. Deploy

Railway auto-deploys on push to main branch.

**Your backend URL:** `https://rentverse-backend-production.up.railway.app`

---

### Option B: Render

#### 1. Create Web Service

1. Go to [render.com](https://render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect GitHub repository
4. Configure:
   - **Name:** `rentverse-backend`
   - **Root Directory:** `rentverse-backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`

#### 2. Add Environment Variables

Add all backend environment variables in the **Environment** section.

#### 3. Deploy

Click **"Create Web Service"**

---

## 🌐 Frontend Deployment (Vercel)

### 1. Import Project

1. Go to [vercel.com](https://vercel.com/)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `rentverse-frontend`
   - **Framework Preset:** Next.js

### 2. Add Environment Variables

In **"Environment Variables"** section:

```
NEXT_PUBLIC_API_URL=https://rentverse-backend-production.up.railway.app
NEXT_PUBLIC_MAPTILER_KEY=your-maptiler-key
```

### 3. Deploy

Click **"Deploy"**

**Your frontend URL:** `https://rentverse-frontend-nine.vercel.app`

### 4. Configure Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records

---

## 🤖 AI Service Deployment

### Deploy to Railway

1. Create new service in Railway
2. Set **Root Directory:** `rentverse-ai-service`
3. Railway auto-detects Python

### Configure

Add environment variables:
```
PORT=8000
```

### Update Backend

Update backend `.env`:
```env
AI_SERVICE_URL=https://rentverse-ai-service-production.up.railway.app
```

---

## 📱 Mobile App Build (Android)

### 1. Prerequisites

- Android Studio installed
- Java JDK 11+

### 2. Build Web App

```bash
cd rentverse-frontend

# Build production bundle
npm run build

# Export static files
npm run export
```

### 3. Sync with Capacitor

```bash
# Sync web assets
npx cap sync android
```

### 4. Update Configuration

Edit `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.rentverse.app',
  appName: 'RentVerse',
  webDir: 'out',
  server: {
    url: 'https://rentverse-frontend-nine.vercel.app',
    cleartext: true
  }
};
```

### 5. Build APK

```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### 6. Locate APK

APK file location:
```
rentverse-frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Copy to:
```
MobileAppBuild/rentverse-vecna.apk
```

---

## 🔧 External Services Setup

### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to **Dashboard**
3. Copy:
   - Cloud Name
   - API Key
   - API Secret

### MapTiler Setup

1. Sign up at [maptiler.com](https://www.maptiler.com/)
2. Go to **Account** → **API Keys**
3. Create new key with **Maps SDK** access
4. Copy API Key

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select project
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth Client ID**
5. Configure:
   - Authorized JavaScript origins: Your frontend URLs
   - Authorized redirect URIs: Your callback URLs

---

## ✅ Post-Deployment Checklist

### Security

- [ ] All environment variables are set
- [ ] JWT_SECRET is unique and strong (32+ chars)
- [ ] DATABASE_URL uses SSL connection
- [ ] CORS configured for production URLs
- [ ] Rate limiting is active
- [ ] HTTPS enforced

### Functionality

- [ ] User registration works
- [ ] OTP emails are delivered
- [ ] Login/logout works
- [ ] Property CRUD works
- [ ] Booking creation works
- [ ] PDF generation works
- [ ] File uploads work

### Database

- [ ] Migrations applied
- [ ] Seed data created (admin user)
- [ ] Backups configured

### Monitoring

- [ ] Error logging enabled
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured

---

## 📊 Monitoring & Maintenance

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic health check |
| `GET /api/test-db` | Database connectivity |

### Logs

**Railway:**
- View logs in dashboard
- Filter by time range

**Vercel:**
- View function logs
- Check build logs

### Database Backups

**Supabase:**
- Automatic daily backups
- Point-in-time recovery available

### Updates

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Restart services (auto on Railway/Render)
```

---

## 🆘 Troubleshooting

### Common Issues

#### Build Fails on Vercel

```bash
# Clear cache and rebuild
# In Vercel dashboard: Deployments → Redeploy with cleared cache
```

#### Database Connection Error

1. Check CONNECTION_URL format
2. Verify IP allowlist in Supabase
3. Check SSL settings

#### OTP Emails Not Sending

1. Verify EMAIL_USER and EMAIL_PASS
2. Check Gmail App Password (not regular password)
3. Check spam folder

#### CORS Errors

Update backend CORS config:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'https://rentverse-frontend-nine.vercel.app',
    'https://your-custom-domain.com'
  ]
};
```

---

<div align="center">
  <p><i>Happy Deploying! 🚀</i></p>
  <p><i>© 2025 Team VECNA - RentVerse Platform</i></p>
</div>
