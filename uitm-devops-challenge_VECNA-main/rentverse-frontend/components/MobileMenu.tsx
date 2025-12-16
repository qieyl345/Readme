'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, Settings, Home, Heart, Search, LogOut, Calendar, Shield, Building, MapPin, X } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useCurrentUser from '@/hooks/useCurrentUser'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

function MobileMenu({ isOpen, onClose }: Readonly<MobileMenuProps>): React.ReactNode {
  const menuRef = useRef<HTMLDivElement>(null)
  const { user } = useCurrentUser()
  const { logout } = useAuthStore()

  // Generate initials from first and last name
  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    if (firstInitial && lastInitial) return firstInitial + lastInitial
    if (firstInitial) return firstInitial
    if (lastInitial) return lastInitial
    return user?.email?.charAt(0)?.toUpperCase() || 'U'
  }

  // Get full name
  const getFullName = (): string => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`
    if (user?.name) return user.name
    if (user?.firstName) return user.firstName
    if (user?.lastName) return user.lastName
    return 'User'
  }

  // Handle ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleLogout = () => {
    logout()
    onClose()
    window.location.href = '/'
  }

  if (!isOpen) return null

  const fullName = getFullName()
  const initials = getInitials(user?.firstName || '', user?.lastName || '')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex flex-col justify-end">
      <div
        ref={menuRef}
        className="bg-white w-full rounded-t-2xl shadow-xl p-6 animate-slide-up"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-500 hover:text-slate-800">
                <X size={24} />
            </button>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-teal-600 text-white font-semibold flex items-center justify-center text-2xl">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-slate-900 truncate">
              {fullName}
            </p>
            <p className="text-base text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
            <Link href="/account" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <User size={20} className="mr-4 text-teal-500" />
                <span className="font-medium text-base">My Profile</span>
            </Link>
            <Link href="/property" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <Search size={20} className="mr-4 text-blue-500" />
                <span className="font-medium text-base">Browse Properties</span>
            </Link>
            <Link href="/property/all" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <Building size={20} className="mr-4 text-orange-500" />
                <span className="font-medium text-base">My Properties</span>
            </Link>
            <Link href="/rents" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <Calendar size={20} className="mr-4 text-green-500" />
                <span className="font-medium text-base">My Rentals</span>
            </Link>
            <Link href="/wishlist" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <Heart size={20} className="mr-4 text-red-500" />
                <span className="font-medium text-base">My Wishlists</span>
            </Link>
            {user?.role === 'ADMIN' && (
                <Link href="/admin" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                    <Shield size={20} className="mr-4 text-purple-500" />
                    <span className="font-medium text-base">Admin Dashboard</span>
                </Link>
            )}
            <Link href="/account/settings" onClick={onClose} className="flex items-center p-4 text-slate-700 hover:bg-slate-50 rounded-lg">
                <Settings size={20} className="mr-4 text-gray-500" />
                <span className="font-medium text-base">Settings</span>
            </Link>
            <div className="pt-4">
                <button onClick={handleLogout} className="flex items-center w-full p-4 text-red-600 hover:bg-red-50 rounded-lg">
                    <LogOut size={20} className="mr-4 text-red-500" />
                    <span className="font-medium text-base">Log out</span>
                </button>
            </div>
        </nav>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default MobileMenu
