'use client'

import Link from "next/link"
import { Search, Heart, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import useAuthStore from '@/stores/authStore'
import useCurrentUser from '@/hooks/useCurrentUser'
import Avatar from '@/components/Avatar'
import MobileMenu from '@/components/MobileMenu'

type NavItem = 'explore' | 'wishlists' | 'login'

function NavBarBottom() {
  const [activeTab, setActiveTab] = useState<NavItem>('explore')
  const [isMounted, setIsMounted] = useState(false)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const { user } = useCurrentUser()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)
  const closeDropdown = () => setIsDropdownOpen(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleTabClick = (tab: NavItem) => {
    setActiveTab(tab)
  }

  return (
    <nav className={clsx([
        'fixed z-50',
        'block md:hidden',
        'bottom-0 left-0 right-0 bg-white border-t border-slate-200'
      ])}>
      <ul className="flex items-center justify-around py-3 px-4">
        <li>
          <Link
            href='/property'
            onClick={() => handleTabClick('explore')}
            className="flex flex-col items-center space-y-1 group"
          >
            <Search
              size={24}
              className={`transition-colors duration-200 ${
                activeTab === 'explore'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                activeTab === 'explore'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              Explore
            </span>
          </Link>
        </li>
        <li>
          <Link
            href='/wishlist'
            onClick={() => handleTabClick('wishlists')}
            className="flex flex-col items-center space-y-1 group"
          >
            <Heart
              size={24}
              className={`transition-colors duration-200 ${
                activeTab === 'wishlists'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                activeTab === 'wishlists'
                  ? 'text-teal-600'
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              Wishlists
            </span>
          </Link>
        </li>
        <li className="relative">
          {isMounted && isLoggedIn && user ? (
            <div
              onClick={toggleDropdown}
              className="flex flex-col items-center space-y-1 group cursor-pointer"
            >
              <Avatar user={user} className="w-6 h-6" />
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isDropdownOpen
                    ? 'text-teal-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                Settings
              </span>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => handleTabClick('login')}
              className="flex flex-col items-center space-y-1 group"
            >
              <User
                size={24}
                className={`transition-colors duration-200 ${
                  activeTab === 'login'
                    ? 'text-teal-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  activeTab === 'login'
                    ? 'text-teal-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                Log in
              </span>
            </Link>
          )}
          {isDropdownOpen && <MobileMenu isOpen={isDropdownOpen} onClose={closeDropdown} />}
        </li>
      </ul>
    </nav>
  )
}

export default NavBarBottom