'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, Bell, Shield, Moon, Sun, Globe, Key, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { userSettingsApiClient, UserSettings, UserSettingsInput } from '@/utils/userSettingsApiClient'
import NavBarBottom from '@/components/NavBarBottom'

function AccountSettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [language, setLanguage] = useState('en')
  const [currency, setCurrency] = useState('MYR')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [message, setMessage] = useState('')
  const { isLoggedIn, token } = useAuthStore()

  // Load user settings from backend
  useEffect(() => {
    if (!isLoggedIn) return

    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true)
        const settings = await userSettingsApiClient.getCurrentUserSettings()
        
        // Map backend settings to local state
        setLanguage(settings.language || 'en')
        setCurrency(settings.currency || 'MYR')
        
        // Parse notifications from backend
        const notifications = settings.notifications || {}
        setEmailNotifications(notifications.email !== false)
        setPushNotifications(notifications.push !== false)
        setMarketingEmails(notifications.marketing === true)
        
        // Parse preferences from backend
        const preferences = settings.preferences || {}
        setDarkMode(preferences.darkMode === true)
        
      } catch (error) {
        console.error('Error loading settings:', error)
        setMessage('Failed to load settings. Please try again.')
      } finally {
        setIsLoadingSettings(false)
      }
    }

    loadSettings()
  }, [isLoggedIn])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const settings: UserSettingsInput = {
        language,
        currency,
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          marketing: marketingEmails,
        },
        preferences: {
          darkMode,
        },
      }

      await userSettingsApiClient.updateCurrentUserSettings(settings)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleChangePassword = () => {
    alert('Password change functionality will be implemented soon!')
  }

  const handlePrivacySettings = () => {
    alert('Privacy settings functionality will be implemented soon!')
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    if (confirmed) {
      alert('Account deletion functionality will be implemented soon!')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Please log in to access settings.</p>
          <a
            href="/auth/login"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    )
  }

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account preferences and privacy settings</p>
      </div>

      <div className="space-y-8">
        {/* Appearance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-slate-600" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-600" />
                )}
                <div>
                  <p className="font-medium text-slate-900">Dark Mode</p>
                  <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">Language</p>
                    <p className="text-sm text-slate-500">Choose your preferred language</p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="ms">Bahasa Malaysia</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Currency</p>
                  <p className="text-sm text-slate-500">Choose your preferred currency</p>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="MYR">MYR (Malaysian Ringgit)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="SGD">SGD (Singapore Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive notifications via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Push Notifications</p>
                <p className="text-sm text-slate-500">Receive push notifications in your browser</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotifications ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Marketing Emails</p>
                <p className="text-sm text-slate-500">Receive emails about new features and promotions</p>
              </div>
              <button
                onClick={() => setMarketingEmails(!marketingEmails)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  marketingEmails ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    marketingEmails ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-500">Update your account password</p>
                </div>
              </div>
              <button 
                onClick={handleChangePassword}
                className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Privacy Settings</p>
                  <p className="text-sm text-slate-500">Control who can see your information</p>
                </div>
              </div>
              <button 
                onClick={handlePrivacySettings}
                className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Manage
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 text-red-600">⚠️</div>
                <div>
                  <p className="font-medium text-slate-900">Delete Account</p>
                  <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
                </div>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <p className="font-medium text-slate-900">Save Changes</p>
            <p className="text-sm text-slate-500">Apply your new settings</p>
          </div>
          <div className="flex items-center space-x-3">
            {message && (
              <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <NavBarBottom />
    </div>
  )
}

export default AccountSettingsPage