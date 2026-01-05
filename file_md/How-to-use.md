# 📖 RentVerse - How to Use Guide

<p align="center"><i>Complete User Guide for the RentVerse Property Rental Platform</i></p>

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [User Registration](#-user-registration)
3. [Login Process (MFA/OTP)](#-login-process-mfaotp)
4. [Browsing Properties](#-browsing-properties)
5. [Making a Booking](#-making-a-booking)
6. [Property Management (Landlord)](#-property-management-landlord)
7. [My Rents Dashboard](#-my-rents-dashboard)
8. [Account Settings](#-account-settings)
9. [Admin Dashboard](#-admin-dashboard)
10. [Mobile App Usage](#-mobile-app-usage)
11. [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### Access Points

| Platform | URL/Download |
|----------|--------------|
| 🌐 Web Application | [rentverse-frontend-nine.vercel.app](https://rentverse-frontend-nine.vercel.app/) |
| 📱 Android App | [Download APK](MobileAppBuild/rentverse-vecna.apk) |
| 📚 API Documentation | [Swagger UI](https://rentverse-backend.up.railway.app/docs) |

### Demo Account (For Testing)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rentverse.com` | `password123` |

> ⚠️ **Note**: For regular accounts, you must use a real email address to receive OTP codes.

---

## 👤 User Registration

### Step 1: Navigate to Sign Up

1. Open the RentVerse application (web or mobile)
2. Click the **"Sign Up"** button on the homepage
3. You will be redirected to the registration page

### Step 2: Fill Registration Form

| Field | Requirement |
|-------|-------------|
| Email | Valid email address (used for OTP) |
| Password | Minimum 6 characters |
| First Name | Your first name |
| Last Name | Your last name |

### Step 3: Verify Email with OTP

1. After submitting, check your email inbox
2. You will receive a **6-digit OTP code**
3. Enter the OTP within **5 minutes** (it expires after that)
4. Click **"Verify"** to complete registration

### User Roles

| Role | Description | How to Get |
|------|-------------|------------|
| **USER** | Regular tenant - can browse and book properties | Default on registration |
| **LANDLORD** | Property owner - can list and manage properties | Select during registration |
| **ADMIN** | Platform administrator | Assigned by system |

---

## 🔐 Login Process (MFA/OTP)

RentVerse uses **Multi-Factor Authentication** for enhanced security.

### Step 1: Enter Credentials

1. Go to the **Login** page
2. Enter your registered **email** and **password**
3. Click **"Login"**

### Step 2: OTP Verification

1. If credentials are correct, the system sends an OTP to your email
2. Check your email inbox (and spam folder)
3. Enter the **6-digit OTP code**
4. Click **"Verify OTP"**

### Step 3: Access Granted

- Upon successful verification, you receive a **JWT token**
- You are redirected to the dashboard
- Session duration depends on your role:
  - ADMIN: 15 minutes
  - LANDLORD: 30 minutes
  - USER: 60 minutes

### Login Security Features

| Feature | Description |
|---------|-------------|
| **Risk Scoring** | System analyzes login patterns for suspicious activity |
| **Account Lockout** | 3-5 failed attempts locks the account for 15 minutes |
| **Unusual Time Alert** | Login outside normal hours triggers security alerts |
| **Device Verification** | New devices may require additional verification |

---

## 🏠 Browsing Properties

### Homepage

The homepage displays all available property listings:

1. **Property Cards** - Show image, title, price, location
2. **Search Bar** - Filter by location or keywords
3. **Filters** - Narrow results by:
   - Property Type (Apartment, House, Studio, etc.)
   - Price Range (min/max)
   - Number of Bedrooms
   - Number of Bathrooms

### Property Details Page

Click any property card to view full details:

| Section | Information |
|---------|-------------|
| **Gallery** | Multiple property images |
| **Description** | Detailed property description |
| **Amenities** | WiFi, Parking, Pool, Gym, etc. |
| **Location** | Interactive map with exact location |
| **Pricing** | Monthly rent and terms |
| **Owner Info** | Landlord contact details |
| **Availability** | Calendar showing available dates |

### Actions Available

- **Add to Wishlist** ❤️ - Save for later
- **Book Now** 📅 - Proceed to booking
- **Contact Owner** 📧 - Send inquiry message

---

## 📅 Making a Booking

### Step 1: Select Property

1. Browse or search for a property
2. Click **"Book Now"** on the property details page

### Step 2: Choose Dates

1. Select your **check-in date** using the calendar
2. Select your **check-out date**
3. The system calculates total rent automatically

### Step 3: Enter Booking Details

| Field | Description |
|-------|-------------|
| Number of Guests | How many people will stay |
| Special Requests | Any specific requirements (optional) |
| Contact Number | Your phone number |

### Step 4: Confirm Booking

1. Review all booking details
2. Click **"Confirm Booking"**
3. **Booking is automatically approved** ✅

### Step 5: Rental Agreement

After booking confirmation:

1. A **PDF rental agreement** is generated automatically
2. The document is **digitally signed** with SHA-256 hash
3. Both tenant and landlord can download the PDF
4. Find it in **"My Rents"** section

---

## 🏢 Property Management (Landlord)

> This section is for users with **LANDLORD** role only.

### Adding a New Property

#### Step 1: Basic Information

1. Go to **"Add Listing"** or **"New Property"**
2. Fill in:
   - Property Title
   - Detailed Description
   - Property Type (Apartment, House, Studio, etc.)

#### Step 2: Location

1. Use the **interactive MapTiler map**
2. Click to select the exact property location
3. Enter the street address manually
4. Verify the coordinates are correct

#### Step 3: Photos & Amenities

1. Upload multiple property images (drag & drop supported)
2. Images are automatically uploaded to **Cloudinary CDN**
3. Select available amenities:
   - ✅ WiFi
   - ✅ Parking
   - ✅ Air Conditioning
   - ✅ Pool
   - ✅ Gym
   - ✅ Pet Friendly
   - And more...

#### Step 4: Pricing & Terms

1. Set the **monthly rent** amount
2. Define **minimum lease period**
3. Add any **legal terms** or **house rules**
4. Click **"Publish"** to make it live

### Managing Properties

From the **"My Properties"** dashboard:

| Action | Description |
|--------|-------------|
| **Edit** | Modify property details, pricing, photos |
| **Delete** | Remove listing permanently |
| **View Bookings** | See all booking requests |
| **Toggle Availability** | Mark as available/unavailable |

### Viewing Bookings

1. Go to **"My Properties"** → **"Bookings"**
2. View all tenant booking requests
3. See booking status (Pending, Approved, Completed)
4. Download rental agreements

---

## 📋 My Rents Dashboard

### For Tenants

Access your bookings from **"My Rents"**:

| Information | Description |
|-------------|-------------|
| Active Bookings | Current rentals in progress |
| Booking History | Past completed bookings |
| Upcoming | Future reservations |
| Agreements | Download signed PDF contracts |

### Booking Status Types

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting confirmation |
| `APPROVED` | Booking confirmed |
| `ACTIVE` | Currently staying |
| `COMPLETED` | Rental period ended |
| `CANCELLED` | Booking was cancelled |

### Downloading Rental Agreements

1. Go to **"My Rents"**
2. Find the specific booking
3. Click **"Download Agreement"** 📄
4. PDF opens with:
   - Property details
   - Tenant & Landlord info
   - Terms and conditions
   - Digital signature with QR code
   - SHA-256 document hash

---

## ⚙️ Account Settings

### Profile Settings

Path: **Account** → **Profile**

- Update your first name, last name
- Change profile picture
- Update phone number
- Modify bio/description

### Security Settings

Path: **Account** → **Security**

#### Change Password

1. Enter current password
2. Enter new password (min 6 characters)
3. Confirm new password
4. Click **"Update Password"**

#### Multi-Factor Authentication (MFA)

| Role | MFA Options |
|------|-------------|
| USER | Optional - can enable/disable |
| LANDLORD | Mandatory - always enabled |
| ADMIN | Mandatory - always enabled |

To toggle MFA (USER role only):

1. Go to **Security Settings**
2. Find **"Two-Factor Authentication"**
3. Toggle the switch ON/OFF
4. Confirm with your password

---

## 👑 Admin Dashboard

> This section is for **ADMIN** users only.

### Accessing Admin Panel

1. Login with admin credentials
2. Navigate to `/admin` or click **"Admin Dashboard"**

### Available Features

#### 📊 Platform Statistics

- Total users, properties, bookings
- Revenue analytics
- Growth trends

#### 👥 User Management

- View all registered users
- Search by email or role
- Monitor user activity

#### 🏠 Property Management

- View all property listings
- Remove inappropriate listings
- Feature properties on homepage

#### 🔐 Security Monitoring

- **Unresolved Anomalies**: View security alerts
- **Activity Logs**: Browse all user actions
- **Resolve Alerts**: Mark anomalies as resolved

#### 📋 Booking Management

- View all platform bookings
- Access rental agreements
- Monitor booking statistics

---

## 📱 Mobile App Usage

### Installation

1. Download the APK from `MobileAppBuild/rentverse-vecna.apk`
2. Enable **"Install from Unknown Sources"** on Android
3. Install the APK
4. Open RentVerse app

### Features

The mobile app includes all web features:

- ✅ User registration & login with OTP
- ✅ Browse and search properties
- ✅ View property details with map
- ✅ Make bookings
- ✅ View My Rents
- ✅ Account settings
- ✅ Push notifications (when configured)

### Deep Linking

The app supports deep links with the scheme:
```
rentverseclarity://
```

---

## ❓ Troubleshooting

### OTP Not Received

1. Check your **spam/junk folder**
2. Wait 1-2 minutes (email may be delayed)
3. Click **"Resend OTP"** after 60 seconds
4. Verify you entered the correct email address

### Login Blocked

**Reason**: Too many failed attempts or suspicious activity

**Solution**:
- Wait **15 minutes** for automatic unlock
- Or contact admin to manually unlock

### Booking Failed

1. Check if property is still available
2. Verify your dates are valid (check-out > check-in)
3. Ensure you're logged in
4. Try refreshing the page

### PDF Not Downloading

1. Check browser popup blocker settings
2. Try right-click → "Save As"
3. Clear browser cache and retry
4. Try a different browser

### Mobile App Crashes

1. Clear app cache in Android settings
2. Reinstall the APK
3. Ensure Android version is 8.0+
4. Check for sufficient storage space

---

<div align="center">
  <p><i>Need more help? Contact the admin at admin@rentverse.com</i></p>
  <p><i>© 2025 Team VECNA - RentVerse Platform</i></p>
</div>
