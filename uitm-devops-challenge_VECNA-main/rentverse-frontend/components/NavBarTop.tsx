'use client'

import clsx from 'clsx'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import TextAction from '@/components/TextAction'
import SignUpButton from '@/components/SignUpButton'
import Avatar from '@/components/Avatar'
import UserDropdown from '@/components/UserDropdown'
import LanguageSelector from '@/components/LanguageSelector'
import SearchBoxProperty from '@/components/SearchBoxProperty'
import SearchBoxPropertyMini from '@/components/SearchBoxPropertyMini'
import ButtonSecondary from '@/components/ButtonSecondary'
import useAuthStore from '@/stores/authStore'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import type { SearchBoxType } from '@/types/searchbox'

interface NavBarTopProps {
  searchBoxType?: SearchBoxType
  isQuestionnaire?: boolean
}

function NavBarTop({ searchBoxType = 'none', isQuestionnaire = false }: Readonly<NavBarTopProps>): React.ReactNode {
  // 1. DIRECT STORE ACCESS
  const user = useAuthStore((state) => state.user)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  
  // 2. ROUTER ACCESS (properly at top level)
  const router = useRouter()
  
  // 3. HYDRATION AND ROUTER MOUNTING HANDLING
  const [isMounted, setIsMounted] = useState(false)
  const [routerReady, setRouterReady] = useState(false)
  
  useEffect(() => {
    // Set mounted state
    setIsMounted(true)
    
    // Debug: Check if store has data immediately on mount
    console.log("NavBar Mounted. LoggedIn:", useAuthStore.getState().isLoggedIn);
    
    // Wait for router to be ready
    const checkRouter = () => {
      try {
        // Try to access router to verify it's mounted
        if (typeof window !== 'undefined' && router) {
          setRouterReady(true)
        }
      } catch (error) {
        console.warn('Router not ready yet:', error)
        // Retry after a short delay
        setTimeout(checkRouter, 100)
      }
    }
    
    checkRouter()
  }, [router])

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { clearTemporaryData, isDirty } = usePropertyListingStore()

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)
  const closeDropdown = () => setIsDropdownOpen(false)

  const handleExit = () => {
    if (isDirty) {
      if (window.confirm('Exit? Unsaved changes will be lost.')) {
        clearTemporaryData()
        // Safe navigation with fallback - only if router is ready
        if (routerReady) {
          try {
            router.push('/')
          } catch (error) {
            console.warn('Router navigation failed, using fallback:', error)
            window.location.href = '/'
          }
        } else {
          window.location.href = '/'
        }
      }
    } else {
      // Safe navigation with fallback - only if router is ready
      if (routerReady) {
        try {
          router.push('/')
        } catch (error) {
          console.warn('Router navigation failed, using fallback:', error)
          window.location.href = '/'
        }
      } else {
        window.location.href = '/'
      }
    }
  }

  // 4. ENHANCED RENDER LOGIC
  // Only show full navigation if both mounted and router is ready
  const showFullNavigation = isMounted && routerReady
  const showProfile = isMounted && isLoggedIn && user

  return (
    <div className={clsx([
      'w-full fixed top-0 left-0 right-0 z-50',
      'px-6 py-4 bg-white list-none border-b border-slate-200',
      'transform-none transition-none duration-0',
      'shadow-sm backdrop-blur-sm bg-white/95'
    ])}>
      <div className={clsx(['w-full flex items-center justify-between relative', searchBoxType === 'full' && 'mb-8'])}>
        <Link href="/">
          <Image
            src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758183655/rentverse-base/logo-nav_j8pl7d.png"
            alt="Logo Rentverse"
            className="w-auto h-12"
            width={150}
            height={48} />
        </Link>

        {(searchBoxType === 'compact' && !isQuestionnaire && showFullNavigation) &&
          <SearchBoxPropertyMini className="hidden lg:block absolute ml-[16%]" />}

        {!isQuestionnaire && showFullNavigation && (
          <nav className="hidden md:flex items-center space-x-8">
            <li><TextAction href={'/property'} text={'Browse Properties'} /></li>
            <li><TextAction href={'/property/new'} text={'List your property'} /></li>
            <li><LanguageSelector /></li>
            <li className="relative">
              {/* 4. CONDITIONAL RENDERING */}
              {showProfile ? (
                <>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
                    <Avatar 
                      user={user} 
                      onClick={() => {}} 
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                       {user.firstName || 'User'}
                    </span>
                  </div>
                  <UserDropdown isOpen={isDropdownOpen} onClose={closeDropdown} />
                </>
              ) : (
                <SignUpButton />
              )}
            </li>
          </nav>
        )}
        
        {/* Show loading state if router is not ready yet */}
        {!routerReady && isMounted && (
          <div className="hidden md:flex items-center space-x-8">
            <div className="animate-pulse bg-slate-200 h-4 w-24 rounded"></div>
            <div className="animate-pulse bg-slate-200 h-4 w-32 rounded"></div>
          </div>
        )}
        
        {isQuestionnaire && (
          <ButtonSecondary 
            label="Exit" 
            onClick={handleExit}
            disabled={!routerReady}
          />
        )}
      </div>
      {(searchBoxType === 'full' && !isQuestionnaire && showFullNavigation) && <SearchBoxProperty />}
    </div>
  )
}

export default NavBarTop