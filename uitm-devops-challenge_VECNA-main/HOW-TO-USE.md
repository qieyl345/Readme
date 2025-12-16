# 🚀 RentVerse - How to Use Guide

## 📋 **Table of Contents**
1. [Quick Setup](#quick-setup)
2. [User Registration & Login](#user-registration--login)
3. [Property Management](#property-management)
4. [Booking System](#booking-system)
5. [Admin Features](#admin-features)
6. [Security Testing](#security-testing)
7. [API Testing](#api-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🏃‍♂️ **Quick Setup**

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd rentverse-challenge

# Install backend dependencies
cd rentverse-backend
npm install

# Install frontend dependencies
cd ../rentverse-frontend
npm install

# Return to root
cd ..
```

### 2. Database Setup
```bash
cd rentverse-backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/rentverse

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 3. Start Services
```bash
# Terminal 1: Start Backend
cd rentverse-backend
npm start

# Terminal 2: Start Frontend
cd rentverse-frontend
npm run dev

# Terminal 3: Start AI Service (optional)
cd rentverse-ai-service
python -m rentverse.cli serve
```

### 4. Access Application
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/docs
- **AI Service:** http://localhost:8000

---

## 👤 **User Registration & Login**

### Register New Account
1. Visit http://localhost:3001
2. Click "Sign Up"
3. Fill registration form:
   - Email
   - Password (min 6 characters)
   - First Name & Last Name
4. Click "Register"

### Login with MFA
1. Click "Login"
2. Enter email and password
3. **Check terminal/console** for OTP code
4. Enter 6-digit OTP code
5. Click "Verify"

### Demo Accounts
```
Admin: admin@rentverse.com / password123
Landlord: landlord@rentverse.com / password123
Tenant: tenant@rentverse.com / password123
```

---

## 🏠 **Property Management**

### Browse Properties
1. Login as any user
2. Navigate to homepage
3. Use search filters:
   - Location
   - Price range
   - Property type
   - Bedrooms/bathrooms

### Add New Property (Landlord Only)
1. Login as landlord user
2. Click "Add Listing"
3. Fill property details:
   - **Step 1:** Basic info (title, description)
   - **Step 2:** Location & map
   - **Step 3:** Photos & amenities
   - **Step 4:** Pricing & legal
4. Click "Publish"

### View Property Details
1. Click on any property card
2. View full details, photos, amenities
3. Check availability calendar
4. See landlord contact info

---

## 📅 **Booking System**

### Make a Booking
1. Login as tenant/regular user
2. Find desired property
3. Click "Book Now"
4. Select dates using calendar
5. Enter booking details:
   - Check-in/check-out dates
   - Number of guests
   - Special requests
6. **Auto-approval:** Booking is instantly approved
7. **PDF Generation:** Contract is automatically created

### View My Bookings
1. Login as tenant
2. Go to "My Rents" page
3. View all bookings with status
4. Download rental agreements

### Manage Bookings (Landlord)
1. Login as landlord
2. Go to "My Properties" → "Bookings"
3. View tenant booking requests
4. Approve/reject bookings
5. Download rental agreements

---

## 👑 **Admin Features**

### Access Admin Dashboard
1. Login with admin account
2. Admin features are automatically available

### View All Bookings
```bash
# API endpoint for admins only
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/bookings
```

### Monitor Activity Logs
```bash
# View all user activities
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/auth/activity-logs
```

### User Management
- View all users
- Monitor suspicious activities
- Access security reports

---

## 🧪 **Security Testing**

### Module 1: Authentication & MFA
```bash
# Test login flow
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentverse.com","password":"password123"}'

# Check console for OTP, then verify
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentverse.com","otp":"123456"}'
```

### Module 2: Rate Limiting
```bash
# Test rate limiting (should fail after 100 requests)
for i in {1..105}; do
  curl -s http://localhost:3000/api/bookings &
done
# Should return: "Too many requests from this IP"
```

### Module 3: Digital Contracts
```bash
# Create booking (auto-generates PDF)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "sample-property-id",
    "startDate": "2025-12-20",
    "endDate": "2026-12-20",
    "rentAmount": 2500
  }'

# Download generated PDF
curl http://localhost:3000/api/bookings/BOOKING_ID/rental-agreement/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o rental-agreement.pdf
```

### Module 4: AI Anomaly Detection
```bash
# Test with suspicious patterns
# 1. Multiple rapid login attempts
# 2. Login from different user agents
# 3. Check AI service logs for detections
```

### Module 5: Activity Logging
```bash
# View activity logs
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/auth/activity-logs
```

### Module 6: CI/CD Security
```bash
cd rentverse-backend

# Run all tests
npm test

# Check vulnerabilities
npm audit

# Run linting
npm run lint
```

---

## 🔌 **API Testing**

### Get Authentication Token
```bash
# 1. Login to get OTP
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentverse.com","password":"password123"}'

# 2. Verify OTP (replace with actual OTP from console)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentverse.com","otp":"440166"}'

# 3. Use the returned token in subsequent requests
```

### Test Property APIs
```bash
# Get all properties
curl http://localhost:3000/api/properties

# Get specific property
curl http://localhost:3000/api/properties/PROPERTY_ID

# Search properties
curl "http://localhost:3000/api/properties?search=Kuala%20Lumpur"
```

### Test Booking APIs
```bash
# Get user's bookings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/bookings/my-bookings

# Get owner's bookings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/bookings/owner-bookings

# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "property-id",
    "startDate": "2025-12-20",
    "endDate": "2026-12-20",
    "rentAmount": 2500
  }'
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### Backend Won't Start
```bash
# Check if port 3000 is available
netstat -ano | findstr :3000

# Kill process using port 3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

#### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Test database connection
psql -U your_user -d rentverse -h localhost

# Reset database
npx prisma migrate reset
```

#### Frontend Build Issues
```bash
cd rentverse-frontend

# Clear cache and reinstall
rm -rf node_modules .next
npm install

# Check for port conflicts
npm run dev -- -p 3002
```

#### AI Service Issues
```bash
cd rentverse-ai-service

# Check Python version
python --version

# Install dependencies
pip install -r requirements.txt

# Test AI service
python -c "import rentverse; print('AI service ready')"
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=rentverse:*

# Run with verbose output
npm start -- --verbose
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Database connectivity
curl http://localhost:3000/api/test-db

# AI service health
curl http://localhost:8000/health
```

---

## 📞 **Support & Resources**

### Documentation Links
- **API Documentation:** http://localhost:3000/docs
- **Frontend App:** http://localhost:3001
- **GitHub Repository:** [Your repo link]

### Demo Credentials
```
Admin User:
- Email: admin@rentverse.com
- Password: password123

Landlord User:
- Email: landlord@rentverse.com
- Password: password123

Tenant User:
- Email: tenant@rentverse.com
- Password: password123
```

### Key Features to Demonstrate
1. ✅ **Secure Login** with OTP verification
2. ✅ **Rate Limiting** protection
3. ✅ **PDF Contract Generation**
4. ✅ **AI Anomaly Detection**
5. ✅ **Activity Logging**
6. ✅ **Automated Security Testing**

---

## 🎯 **Quick Demo Script**

**Time: 3 minutes**

1. **Setup** (30s): Start servers, show architecture
2. **Auth Demo** (45s): Login → OTP → Dashboard
3. **Security Demo** (45s): Rate limiting + logs
4. **Core Features** (45s): Booking → PDF generation
5. **Testing** (15s): Run security tests

**Total: 3 minutes exactly**

---

*For technical support, check the README.md or create an issue in the GitHub repository.*