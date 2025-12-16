# CORS Setup for Railway + Vercel Deployment

## 🔧 Required CORS Configuration

Update your Railway backend to accept requests from Vercel:

### In your main app file (app.js or server.js):

```javascript
const cors = require('cors');

// CORS configuration for Vercel + Railway
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',        // Your Vercel frontend URL
    'http://localhost:3000',              // Local development
    'http://localhost:3001',              // Alternative local port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));
```

### Environment-Specific URLs:

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000` (Railway local)

**Production:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

## 🚀 Deployment URLs

After deployment, update your frontend API configuration:

### Frontend API Config:
```javascript
// utils/apiConfig.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.railway.app/api'  // Railway production URL
  : 'http://localhost:5000/api';             // Local development

export { API_BASE_URL };
```

## ✅ Testing Checklist

1. **Railway Backend**:
   - [ ] RESEND_API_KEY set in Railway variables
   - [ ] CORS configured for Vercel domain
   - [ ] Resend package installed

2. **Vercel Frontend**:
   - [ ] API URLs updated to Railway backend
   - [ ] Environment variables configured
   - [ ] CORS preflight requests working

3. **Email Flow**:
   - [ ] Login triggers OTP email
   - [ ] Email received from Resend
   - [ ] OTP verification works
   - [ ] Console logs show success

## 🔍 Troubleshooting

**Email Not Sending:**
- Check Railway logs for API errors
- Verify RESEND_API_KEY is set correctly
- Test Resend API key directly

**CORS Errors:**
- Ensure Vercel domain is in allowed origins
- Check browser console for specific CORS messages
- Verify HTTPS/HTTP protocol matching

**Network Issues:**
- Ensure Railway app is publicly accessible
- Check Railway deployment status
- Test API endpoints directly