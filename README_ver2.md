<h1 align="center">🏠 RentVerse (Secured by Vecna)</h1>
<p align="center"><i>A Secure Property Rental Platform with DevSecOps Integration</i></p>

<div align="center">
  <img src="github/assets/LogoUiTM.png" width="550" height="550" alt="UiTM Logo"><br>
  <b>UiTM Tapah</b>
  <br><br>
  <hr width="50%">
  <br>
  <img src="github/assets/logo.png" width="250" height="250" alt="RentVerse Logo"><br>
  <i>Building the Future Through Innovation</i>
  <br><br>
  <hr width="50%">
  <br>
  <img src="github/assets/icon.jpg" width="350" height="350" alt="Team Vecna"><br>
  <b>Team Vecna</b>
</div>

---

## 📋 Challenge Submission Details

| Field | Details |
|-------|---------|
| **Challenge** | Mobile SecOps 21 Days Challenge |
| **Organizer** | Metairflow R&D Sdn. Bhd. |
| **Team** | VECNA |
| **Institution** | UiTM Tapah |
| **Project Duration** | 27 November 2025 - 17 December 2025 |

---

## 👥 Team Vecna Members

<div align="center">
  <table>
    <tr>
      <td align="center" width="500">
        <img src="github/assets/bukh.jpg" width="400" height="400" alt="Bukhari"><br>
        <b>MOHAMAD BUKHARI BIN<br>AHMAD HUZAIRI</b><br>
        <code>2024916761</code><br>
        <sub>Backend & Cloud Infrastructure</sub>
      </td>
      <td align="center" width="500">
        <img src="github/assets/zul.jpg" width="400" height="400" alt="Zulkarnain"><br>
        <b>MUHAMAD ZULKARNAIN BIN<br>SAMSUDIN</b><br>
        <code>2024793133</code><br>
        <sub>Frontend & Beta Tester</sub>
      </td>
      <td align="center" width=500">
        <img src="github/assets/aqil.jpg" width="400" height="400" alt="Aqil"><br>
        <b>AQIL IMRAN BIN<br>NORHIDZAM</b><br>
        <code>2024779269</code><br>
        <sub>Security Lead</sub>
      </td>
    </tr>
  </table>
</div>

---

## 🔗 Live Deployments

| Platform | URL |
|----------|-----|
| 🌐 **Web Application** | [rentverse-frontend-nine.vercel.app](https://rentverse-frontend-nine.vercel.app/) |
| 📱 **Mobile APK** | [Download Android APK](MobileAppBuild/rentverse-vecna.apk) |
| 📚 **API Documentation** | [Swagger UI](/docs) |

### 🧪 Demo Credentials

| Role | Email | Password | MFA |
|------|-------|----------|-----|
| **Admin** | `admin@rentverse.com` | `password123` | Disabled for testing |

> ⚠️ **Note**: User/Landlord registration requires a valid email for OTP verification.

---

## 📖 How to Use

### 👤 User Registration & Login

1. **Visit the Application**
   - Web: [rentverse-frontend-nine.vercel.app](https://rentverse-frontend-nine.vercel.app/)
   - Mobile: Install the APK on Android device

2. **Create an Account**
   - Click "Sign Up" → Enter email, password, first & last name
   - Check your email for the 6-digit OTP code
   - Enter OTP to complete registration

3. **Login Process**
   - Enter email and password → Click "Login"
   - System sends OTP to your email (check console for demo)
   - Enter OTP → Receive JWT token → Access granted

### 🏠 Property Management (Landlord)

1. **List a New Property**
   - Login as a landlord account
   - Click "Add Listing" → Follow 4-step wizard:
     - **Step 1:** Basic info (title, description)
     - **Step 2:** Select location on MapTiler map
     - **Step 3:** Upload photos & select amenities
     - **Step 4:** Set pricing & legal terms
   - Click "Publish" → Property goes live

2. **Manage Your Properties**
   - View all listings from "My Properties"
   - Edit property details, photos, pricing
   - View booking requests and tenant info

### 📅 Booking System (Tenant)

1. **Search & Browse**
   - Use homepage filters: location, price, bedrooms, property type
   - Click property card → View full details, photos, amenities

2. **Make a Booking**
   - Click "Book Now" on property page
   - Select check-in/check-out dates
   - Enter number of guests & special requests
   - Submit booking → **Auto-approved instantly**

3. **Rental Agreement**
   - PDF contract generated automatically
   - Digitally signed with SHA-256 hash
   - Download from "My Rents" page
   - Both landlord & tenant receive copies

### 👑 Admin Dashboard

1. **Access Admin Panel**
   - Login with admin credentials
   - Navigate to `/admin` dashboard

2. **Available Features**
   - View all users, properties, bookings
   - Monitor security anomalies
   - Access activity logs
   - Resolve security alerts
   - View platform statistics

---

## ⭐ Special Features

### 🔐 1. Smart Multi-Factor Authentication
> Role-based MFA with intelligent risk scoring

- **ADMIN users**: Mandatory MFA, 15-min sessions, login hours restricted
- **LANDLORD users**: Mandatory MFA, 30-min sessions
- **Regular users**: Optional MFA, 60-min sessions
- **Risk Detection**: Login blocked if risk score exceeds 0.8
- **TOTP Support**: Use Google Authenticator for added security

### 📄 2. Digital Rental Agreements
> Tamper-proof PDF contracts with cryptographic signatures

- Auto-generated when booking is approved
- SHA-256 hash for document integrity verification
- JWT-based digital signatures with 24-hour validity
- Replay attack prevention using unique nonces
- Stored securely on Cloudinary CDN

### 🤖 3. AI Security Monitoring
> FastAPI-powered anomaly detection system

- Analyzes login patterns for suspicious activity
- Detects: rapid login attempts, unusual hours, new devices
- Sends real-time security alerts via email
- Admin dashboard shows unresolved security anomalies
- Machine learning model trained on user behavior

### 🗺️ 4. Interactive Map Integration
> MapTiler-powered location selection

- Landlords select exact property location on map
- Geocoding for address auto-completion
- Tenants can view property locations visually
- Distance calculation from user's location

### 📱 5. Mobile-First Design
> Capacitor-powered Android application

- Native Android APK available for download
- Deep linking support (`rentverseclarity://`)
- Push notifications for booking updates
- Responsive design works on all screen sizes

### ⚡ 6. High-Speed OTP Delivery
> Parallel delivery system for reliability

- Email delivery via Nodemailer with connection pooling
- SMS backup via Twilio (when configured)
- Styled HTML email templates with countdown
- Delivery status tracking with unique IDs
- OTP expires in 5 minutes for security

### 📊 7. Comprehensive Activity Logging
> Full audit trail for accountability

- All logins tracked (success/failure, IP, device)
- OTP verification attempts recorded
- Admin actions logged with details
- Security alerts linked to activity history
- Exportable logs for compliance

### 🛡️ 8. Multi-Layer API Protection
> Defense-in-depth security architecture

- 8 different rate limiters for different endpoints
- Helmet.js security headers (CSP, XSS protection)
- SQL injection pattern detection
- CORS allowlist for trusted origins
- Request size limits (10MB max)

---

## 🏗️ System Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  📱 Mobile App (Capacitor)    │    🌐 Web App (Next.js 16)      │
│  - Android APK                │    - React 19.1 + TypeScript    │
│  - Deep Linking Support       │    - Tailwind CSS + Zustand     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  🔐 JWT Authentication        │    ⏱️ Multi-Tier Rate Limiting  │
│  🛡️ Helmet.js Security       │    🌐 CORS Configuration        │
│  🚫 XSS/SQL Injection         │    📊 Request Validation        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Express.js API Server        │    Prisma ORM (PostgreSQL)      │
│  - rentverse-backend/src/     │    - prisma/schema.prisma       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ☁️ Supabase (PostgreSQL)    │    📧 Resend (Email API)        │
│  🖼️ Cloudinary (Media CDN)   │    🗺️ MapTiler (Maps)           │
│  🔑 Google OAuth              │    🤖 AI Service (FastAPI)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
uitm-devops-challenge_VECNA-main/
│
├── rentverse-backend/              # Express.js Backend
│   ├── src/
│   │   ├── app.js                  # Main Express application
│   │   ├── config/
│   │   │   ├── database.js         # Prisma database connection
│   │   │   └── storage.js          # Cloudinary configuration
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT authentication
│   │   │   ├── rateLimiter.js      # Multi-tier rate limiting
│   │   │   └── security.js         # CSP, XSS, SQL injection protection
│   │   ├── modules/
│   │   │   ├── users/              # User management
│   │   │   ├── properties/         # Property CRUD
│   │   │   ├── bookings/           # Booking & leases
│   │   │   └── admin/              # Admin dashboard
│   │   ├── services/
│   │   │   ├── enhancedMFA.service.js      # Role-based MFA
│   │   │   ├── fastOTPService.js           # High-speed OTP delivery
│   │   │   ├── securityAnomalyDetection.js # AI anomaly detection
│   │   │   ├── digitalSignatureValidation.js # JWT document signing
│   │   │   ├── pdfGeneration.service.js    # Puppeteer PDF creation
│   │   │   └── enhancedEmailService.js     # Email templates
│   │   └── routes/                 # API route definitions
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   └── templates/
│       └── rental-agreement.ejs    # PDF template
│
├── rentverse-frontend/             # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                # Homepage
│   │   ├── auth/                   # Login, register, forgot password
│   │   ├── property/               # Property listing & details
│   │   ├── rents/                  # User bookings
│   │   ├── admin/                  # Admin dashboard
│   │   └── account/                # User profile & security settings
│   ├── components/                 # Reusable UI components
│   ├── stores/                     # Zustand state management
│   ├── utils/                      # Utility functions
│   └── android/                    # Capacitor Android build
│
├── rentverse-ai-service/           # Python AI Service
│   ├── rentverse/                  # FastAPI application
│   └── models/                     # ML models
│
├── rentverse-mobile-app/           # Mobile App Configuration
│
└── .github/
    └── workflows/
        └── security-scan.yml       # CI/CD security pipeline
```

---

## 🛡️ Security Modules Implementation

### Module 1: Role-Based Multi-Factor Authentication

**File:** `src/services/enhancedMFA.service.js`

| Role | MFA Required | Session Timeout | Max Failed Attempts | Allowed Hours |
|------|--------------|-----------------|---------------------|---------------|
| ADMIN | ✅ Mandatory | 15 minutes | 3 | 6 AM - 10 PM |
| LANDLORD | ✅ Mandatory | 30 minutes | 5 | 5 AM - 11 PM |
| USER | ❌ Optional | 60 minutes | 5 | 24/7 |

**Features:**
- TOTP authentication via Speakeasy library
- QR code generation for authenticator apps
- Parallel OTP delivery (Email + SMS backup)
- Device verification for privileged roles
- Risk-based login blocking (score > 0.8)

---

### Module 2: Multi-Tier API Rate Limiting

**File:** `src/middleware/rateLimiter.js`

| Endpoint Type | Limit | Window | Purpose |
|---------------|-------|--------|---------|
| General API | 100 | 15 min | Standard protection |
| Login | 5 | 15 min | Brute force prevention |
| Registration | 3 | 1 hour | Signup abuse |
| OTP Requests | 3 | 10 min | OTP flooding |
| Admin Routes | 50 | 15 min | Admin protection |
| File Upload | 10 | 1 hour | Storage abuse |
| Search | 200 | 15 min | Query abuse |
| Password Reset | 3 | 1 hour | Reset flooding |

**Security Middleware (`src/middleware/security.js`):**
- Helmet.js with Content Security Policy
- XSS protection (null byte sanitization)
- SQL injection pattern detection
- CORS allowlist validation
- 10MB request size limit

---

### Module 3: Digital Agreement & PDF Generation

**Files:** 
- `src/services/digitalSignatureValidation.js`
- `src/services/pdfGeneration.service.js`

**Digital Signature Flow:**
1. Generate payload with documentId, userId, timestamp, nonce
2. Create JWT signature with 24-hour expiry
3. Check for replay attacks (same nonce within 10 minutes)
4. Validate user permissions (owner, tenant, or signer)

**PDF Generation:**
1. Fetch lease data with property, tenant, landlord info
2. Render EJS template with signature data
3. Generate PDF using Puppeteer headless browser
4. Create SHA-256 hash of document for integrity
5. Upload to Cloudinary with signed request
6. Store hash and URL in database

---

### Module 4: AI-Powered Security Anomaly Detection

**File:** `src/services/securityAnomalyDetection.js`

| Anomaly Type | Threshold | Severity |
|--------------|-----------|----------|
| Failed OTP Attempts | 5 in 15 min | HIGH |
| Failed Logins | 3 in 15 min | HIGH |
| Unusual Access Time | 11 PM - 6 AM | MEDIUM |
| Multiple Sessions | 2+ in 5 min | MEDIUM |
| Rate Limit Breach | 5+ times | HIGH |

**AI Service Integration:**
- Sends login data to FastAPI service at `/api/v1/anomaly/detect`
- Analyzes 24-hour activity history
- Returns anomaly list with severity scores
- High-severity triggers email alerts

---

### Module 5: Activity Logging & Audit Trail

**File:** `src/services/activityLogger.js`

All security-relevant actions are logged to the `ActivityLog` table:
- Login attempts (success/failure)
- OTP verification attempts
- MFA status changes
- Digital signature events
- Admin actions

---

### Module 6: CI/CD Security Pipeline

**File:** `.github/workflows/security-scan.yml`

| Tool | Purpose |
|------|---------|
| Bandit | Python SAST security linter |
| Semgrep | Multi-language SAST (OWASP, secrets) |
| CodeQL | Semantic code analysis |
| npm audit | Node.js dependency vulnerabilities |
| Safety | Python dependency vulnerabilities |
| TruffleHog | Secret/credential detection |

**Triggers:** Push to `main`/`develop`, Pull requests to `main`

---

## 🔄 Core System Workflows

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant M as MFA Service
    participant E as Email Service
    participant D as Database

    U->>F: Enter credentials
    F->>A: POST /auth/login
    A->>D: Validate credentials
    D-->>A: User found
    A->>M: Check MFA policy
    M->>M: Calculate risk score
    alt Risk > 0.8
        M-->>A: Block login
        A-->>F: Login blocked
    else Risk <= 0.8
        M->>E: Send OTP email
        E-->>U: OTP delivered
        U->>F: Enter OTP
        F->>A: POST /auth/verify-otp
        A->>D: Validate OTP
        D-->>A: OTP valid
        A-->>F: JWT token
        F-->>U: Login success
    end
```

### Property Booking Flow

```mermaid
flowchart TD
    A[Tenant Selects Property] --> B[Choose Dates]
    B --> C[POST /api/bookings]
    C --> D{Availability Check}
    D -->|Available| E[Create Booking Record]
    D -->|Unavailable| F[Return Error]
    E --> G[Create Lease Record]
    G --> H[Generate PDF Agreement]
    H --> I[Create SHA-256 Hash]
    I --> J[Upload to Cloudinary]
    J --> K[Save to Database]
    K --> L[Notify Both Parties]
    L --> M[Booking Complete]
```

---

## 🖥️ Frontend Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Homepage with property listings | Public |
| `/auth/login` | User login with OTP | Public |
| `/auth/register` | New user registration | Public |
| `/property/[id]` | Property details | Public |
| `/property/new` | Create property listing | Landlord |
| `/rents` | My bookings/rentals | Authenticated |
| `/account` | User profile | Authenticated |
| `/account/security` | MFA settings | Authenticated |
| `/admin` | Admin dashboard | Admin only |

---

## 🔐 Security Compliance

| OWASP Mobile Top 10 | Implementation |
|---------------------|----------------|
| M1: Improper Platform Usage | Role-based access, activity logging |
| M2: Insecure Data Storage | Encrypted passwords, secure sessions |
| M3: Insecure Communication | HTTPS enforcement, secure headers |
| M4: Insecure Authentication | MFA, OTP, JWT with blacklist |
| M5: Insufficient Cryptography | SHA-256 hashing, JWT signatures |
| M6: Insecure Authorization | RBAC, permission validation |
| M7: Client Code Quality | ESLint, TypeScript, input validation |

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Python 3.9+ (for AI service)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd uitm-devops-challenge_VECNA-main

# Backend setup
cd rentverse-backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev

# Frontend setup (new terminal)
cd rentverse-frontend
npm install
npm run dev

# AI service (optional)
cd rentverse-ai-service
pip install -r requirements.txt
python -m uvicorn rentverse.main:app --reload
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/rentverse
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLOUD_CLOUD_NAME=your-cloudinary-name
CLOUD_API_KEY=your-cloudinary-key
CLOUD_API_SECRET=your-cloudinary-secret
```

---

## ⚖️ Legal & Ownership

**Proprietary Rights:** All deliverables are the exclusive property of Metairflow R&D Sdn. Bhd.

**Usage Restrictions:** Unauthorized reproduction or commercial use prohibited for 24 months.

**Confidentiality:** Adheres to NDA terms. Obligations remain effective for 3 years after engagement.

---

<div align="center">
  <p><i>Built with ❤️ by Team VECNA for Mobile SecOps Challenge 2025</i></p>
  <p><i>© 2025 Metairflow R&D Sdn. Bhd. | Governed by Malaysian Copyright Act 1987</i></p>
</div>
