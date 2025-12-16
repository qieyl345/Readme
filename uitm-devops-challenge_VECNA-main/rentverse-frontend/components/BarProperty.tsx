'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft, Share, Heart } from 'lucide-react'
import { FavoritesApiClient } from '@/utils/favoritesApiClient'
import { ShareService } from '@/utils/shareService'
import useAuthStore from '@/stores/authStore'
import clsx from 'clsx'

interface BarPropertyProps {
  title: string
  propertyId?: string
  isFavorited?: boolean
  onFavoriteChange?: (isFavorited: boolean, favoriteCount: number) => void
  shareUrl?: string
  shareText?: string
}

function BarProperty(props: Readonly<BarPropertyProps>) {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()
  const [isFavorited, setIsFavorited] = useState(props.isFavorited || false)
  const [isToggling, setIsToggling] = useState(false)

  const handleBackButton = () => {
    try {
      if (typeof window !== 'undefined' && router) {
        router.back()
      } else {
        // Fallback: navigate to property listing
        if (typeof window !== 'undefined') {
          window.location.href = '/property'
        }
      }
    } catch (error) {
      console.warn('Router not available, using fallback navigation')
      if (typeof window !== 'undefined') {
        window.location.href = '/property'
      }
    }
  }

  const handleFavoriteToggle = async () => {
    if (!props.propertyId) {
      console.warn('No property ID provided for favorite toggle')
      return
    }

    if (!isLoggedIn) {
      // Redirect to login or show login modal
      console.log('User not logged in, should redirect to login')
      return
    }

    try {
      setIsToggling(true)
      const response = await FavoritesApiClient.toggleFavorite(props.propertyId)
      
      if (response.success) {
        setIsFavorited(response.data.isFavorited)
        // Notify parent component about the change
        props.onFavoriteChange?.(response.data.isFavorited, response.data.favoriteCount)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // You might want to show a toast notification here
    } finally {
      setIsToggling(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: props.title || 'Check out this property',
      text: props.shareText || `Check out this amazing property: ${props.title}`,
      url: props.shareUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    }

    try {
      const success = await ShareService.share(shareData, {
        showToast: true,
        fallbackMessage: 'Property link copied to clipboard!'
      })
      
      if (success) {
        console.log('Property shared successfully')
      }
    } catch (error) {
      console.error('Error sharing property:', error)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-100">
      {/* Left side - Back button and title */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
        <ButtonCircle icon={<ArrowLeft />} onClick={handleBackButton} />
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
          {props.title}
        </h1>
      </div>

      {/* Right side - Share and Favourites buttons - Mobile friendly */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Share Button - Mobile optimized */}
        <button 
          onClick={handleShare}
          className={clsx([
            'flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2',
            'bg-slate-100 hover:bg-slate-200 rounded-full sm:rounded-lg',
            'text-slate-600 hover:text-slate-900 transition-all duration-200',
            'shadow-sm hover:shadow-md'
          ])}
        >
          <Share size={18} className="sm:mr-2" />
          <span className="hidden sm:inline text-sm font-medium">Share</span>
        </button>
        
        {/* Favorites Button - Mobile optimized */}
        <button 
          onClick={handleFavoriteToggle}
          disabled={isToggling || !props.propertyId}
          className={clsx([
            'flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2',
            'rounded-full sm:rounded-lg transition-all duration-200',
            'shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
            isFavorited 
              ? 'bg-red-100 hover:bg-red-200 text-red-600' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
          ])}
        >
          <Heart 
            size={18} 
            className={clsx('sm:mr-2', isFavorited ? 'fill-current' : '')} 
          />
          <span className="hidden sm:inline text-sm font-medium">
            {(() => {
              if (isToggling) return 'Updating...'
              return isFavorited ? 'Remove' : 'Save'
            })()}
          </span>
        </button>
      </div>
    </div>
  )
}

export default BarProperty