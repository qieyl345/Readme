'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import { User, Settings, Shield, Bell, Key, LogOut } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { createApiUrl } from '@/utils/apiConfig'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  dateOfBirth: string
  phone: string
  role: string
  birthdate?: string
}

interface AuthMeResponse {
  success: boolean
  data: {
    user: UserProfile
  }
}

function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const { isLoggedIn, logout } = useAuthStore()

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      try {
        // First try to get from localStorage
        let token = localStorage.getItem('authToken')

        // If not found, try to get from auth store (might be more up-to-date)
        if (!token && useAuthStore.getState().token) {
          token = useAuthStore.getState().token
        }

        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const data: AuthMeResponse = await response.json()

        if (data.success) {
          setUser(data.data.user)
          setFormData({
            firstName: data.data.user.firstName,
            lastName: data.data.user.lastName,
            email: data.data.user.email,
            phone: data.data.user.phone,
            dateOfBirth: data.data.user.dateOfBirth || data.data.user.birthdate || ''
          })
        } else {
          setError('Failed to load user data')
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [isLoggedIn])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(createApiUrl('users/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setUser(prev => prev ? { ...prev, ...formData, name: `${formData.firstName} ${formData.lastName}` } : null)
        setIsEditing(false)
        // Show success message (optional)
        console.log('Profile updated successfully')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  // Show loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Loading account...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Show error state
  if (error || !user) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || 'Access denied'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                <p className="text-slate-600">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg">
                  <User className="w-5 h-5 text-teal-600" />
                  <span className="text-slate-900 font-medium">Profile</span>
                </div>
                <Link 
                  href="/account/settings"
                  className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <div className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <Shield className="w-5 h-5" />
                  <span>Privacy</span>
                </div>
                <div className="flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </div>
              </nav>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                          phone: user.phone,
                          dateOfBirth: user.dateOfBirth || user.birthdate || ''
                        })
                      }}
                      className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                      <p className="text-slate-900">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                      <p className="text-slate-900">{user.lastName}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <p className="text-slate-900">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <p className="text-slate-900">{user.phone}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                    <p className="text-slate-900">
                      {user.dateOfBirth || user.birthdate ? new Date(user.dateOfBirth || user.birthdate || '').toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Account Role</label>
                    <p className="text-slate-900 capitalize">{user.role}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default AccountPage