import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthState } from '@/types/auth'
import { AuthApiClient } from '@/utils/authApiClient'
import { setCookie, deleteCookie } from '@/utils/cookies'

interface AuthActions {
  // Login functionality - Step 1: Password check
  setPassword: (password: string) => void
  setEmail: (email: string) => void
  submitLogIn: () => Promise<void>
  
  // Login functionality - Step 2: OTP verification
  setOtp: (otp: string) => void
  submitOtpVerification: () => Promise<void>
  
  // Direct login (called after OTP verification)
  login: (user: User, token: string) => void

  // MFA State management
  setRequireOTP: (requireOTP: boolean) => void
  setMfaEmail: (email: string) => void

  // Signup functionality
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setBirthdate: (birthdate: string) => void
  setPhone: (phone: string) => void
  setSignUpPassword: (password: string) => void
  submitSignUp: () => Promise<void>

  // Email check functionality
  validateEmail: (email: string) => boolean
  submitEmailCheck: () => Promise<{ exists: boolean; isActive: boolean; role: string | null } | null>

  // General auth actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  resetForm: () => void
  isLoginFormValid: () => boolean
  isSignUpFormValid: () => boolean
  
  // Auth persistence
  initializeAuth: () => void
  validateToken: () => Promise<boolean>
  refreshUserData: () => Promise<boolean>
}

interface AuthFormState {
  password: string
  otp: string
  firstName: string
  lastName: string
  birthdate: string
  email: string
  phone: string
  signUpPassword: string
  requireOTP: boolean
  mfaEmail: string
}

type AuthStore = AuthState & AuthFormState & AuthActions

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      token: null,

      // Form state
      password: '',
      otp: '',
      firstName: '',
      lastName: '',
      birthdate: '',
      email: '',
      phone: '',
      signUpPassword: '',
      
      // MFA state
      requireOTP: false,
      mfaEmail: '',

      // Actions
      setPassword: (password: string) => set({ password }),
      setEmail: (email: string) => set({ email }),
      setOtp: (otp: string) => set({ otp }),
      setRequireOTP: (requireOTP: boolean) => set({ requireOTP }),
      setMfaEmail: (email: string) => set({ mfaEmail: email }),
      setFirstName: (firstName: string) => set({ firstName }),
      setLastName: (lastName: string) => set({ lastName }),
      setBirthdate: (birthdate: string) => set({ birthdate }),
      setPhone: (phone: string) => set({ phone }),
      setSignUpPassword: (signUpPassword: string) => set({ signUpPassword }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),

      validateEmail: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },

      isLoginFormValid: () => {
        const { password } = get()
        return password.length >= 6
      },

      isSignUpFormValid: () => {
        const { firstName, lastName, email, signUpPassword, birthdate, phone } = get()
        const { validateEmail } = get()
        return (
          firstName.trim().length > 0 &&
          lastName.trim().length > 0 &&
          validateEmail(email) &&
          signUpPassword.length >= 6 &&
          birthdate.length > 0 &&
          phone.trim().length > 0
        )
      },

      // New login action called by the MFA page
      login: (user: User, token: string) => {
        console.log("✅ AuthStore: Logging in user", user.name);
        // Update state
        set({
          user,
          token,
          isLoggedIn: true,
          error: null
        });

        // Sync with cookies for server-side middleware usage
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          setCookie('authToken', token, 7);
        }
      },

      submitLogIn: async () => {
        const { email, password, setLoading, setError, setRequireOTP, setMfaEmail } = get()
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

        if (!email || !password) {
          setError('Please enter email and password')
          return
        }

        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            if (result.requireOTP) {
              // MFA required - save email and show OTP step
              setRequireOTP(true)
              setMfaEmail(email)
              console.log('✅ OTP sent to email, awaiting verification')
              return
            }
            // Fallback for non-MFA direct login
            get().login(result.data.user, result.data.token)
            window.location.href = '/'
          } else {
            setError(result.message || 'Login failed.')
          }
        } catch (error) {
          console.error('Login error:', error)
          setError('Login failed. Please try again.')
        } finally {
          setLoading(false)
        }
      },

      submitOtpVerification: async () => {
        const { mfaEmail, otp, setLoading, setError, setRequireOTP } = get()
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

        if (!mfaEmail || !otp) {
          setError('Please enter email and OTP')
          return
        }

        if (otp.length !== 6) {
          setError('OTP must be 6 digits')
          return
        }

        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: mfaEmail, otp }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            console.log('✅ OTP Verified! Logging in...')
            // Update store with user and token
            get().login(result.data.user, result.data.token)
            // Clear MFA state
            setRequireOTP(false)
            // Redirect to home
            window.location.href = '/'
          } else {
            setError(result.message || 'OTP verification failed.')
          }
        } catch (error) {
          console.error('OTP verification error:', error)
          setError('OTP verification failed. Please try again.')
        } finally {
          setLoading(false)
        }
      },

      submitSignUp: async () => {
        const { firstName, lastName, email, signUpPassword, birthdate, phone, setLoading, setError } = get()

        if (!get().isSignUpFormValid()) {
          setError('Please fill in all fields correctly')
          return
        }

        setLoading(true)
        setError(null)

        try {
          const result = await AuthApiClient.register({
            email,
            password: signUpPassword,
            firstName,
            lastName,
            dateOfBirth: birthdate,
            phone,
          })

          if (result.success) {
            get().login(result.data.user, result.data.token || '');
            window.location.href = '/'
          } else {
            setError(result.message || 'Sign up failed. Please try again.')
          }
        } catch (error) {
          console.error('Sign up error:', error)
          setError(error instanceof Error ? error.message : 'Sign up failed.')
        } finally {
          setLoading(false)
        }
      },

      submitEmailCheck: async () => {
        const { email, validateEmail, setLoading, setError } = get()

        if (!validateEmail(email)) {
          setError('Please enter a valid email address')
          return null
        }

        setLoading(true)
        setError(null)

        try {
          // Note: Update this URL if your proxy isn't handling /api routes correctly
          const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          const result = await response.json()
          if (response.ok && result.success) return result.data
          setError(result.message || 'Email check failed.')
          return null
        } catch (error) {
          setError('Email check failed.')
          return null
        } finally {
          setLoading(false)
        }
      },

      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
          error: null,
          password: '',
          email: '',
          phone: '',
          signUpPassword: '',
        })
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken') // Clean up legacy keys if any
          deleteCookie('authToken')
        }
      },

      resetForm: () => set({
        password: '',
        firstName: '',
        lastName: '',
        birthdate: '',
        email: '',
        phone: '',
        signUpPassword: '',
        error: null,
      }),

      // Deprecated: Handled by persist middleware now
      initializeAuth: () => {},

      validateToken: async () => {
        // Used for background checks
        // In persisted state, we assume logged in until API fails with 401
        return true; 
      },

      refreshUserData: async () => {
        return true;
      },
    }),
    {
      name: 'rentverse-auth-store', // Unique name for localStorage
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn,
        token: state.token //
      }), // Only save user and login status
      onRehydrateStorage: () => (state) => {
        console.log('💧 AuthStore Hydrated:', state?.isLoggedIn ? 'User Logged In' : 'Guest Mode');
      }
    }
  )
)

export default useAuthStore