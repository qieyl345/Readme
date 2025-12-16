'use client'

import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import CardProperty from '@/components/CardProperty'
import { Search, Heart, RefreshCw } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import useAuthStore from '@/stores/authStore'
import { useEffect } from 'react'

function WishlistPage() {
  const { isLoggedIn } = useAuthStore()
  const { favorites, isLoading, error, fetchFavorites } = useFavorites()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      // You might want to redirect to login page here
      console.log('User not authenticated')
    }
  }, [isLoggedIn])

  const handleRefresh = () => {
    fetchFavorites()
  }

  if (!isLoggedIn) {
    return (
      <ContentWrapper>
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <Heart className="w-16 h-16 text-slate-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                Please log in to view your wishlist
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Sign in to save and manage your favorite properties
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      {/* Header */}
      <div className="space-y-4 mb-8">
        <h3 className="text-2xl font-sans font-medium text-slate-900">My Wishlist</h3>
        
        {/* Mobile-first button layout */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            <span className="font-semibold">Refresh</span>
          </button>
          <Link
            href="/property"
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-sm font-semibold"
          >
            <Search size={20} />
            <span>Browse Properties</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-slate-600">Loading your favorites...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                Unable to load wishlist
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                {error}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Property Grid */}
      {!isLoading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((property) => (
            <div key={property.id} className="group">
              <CardProperty property={property} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && favorites.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <Image
                src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png"
                alt="No wishlist items"
                width={240}
                height={240}
                className="w-60 h-60 object-contain"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                Your wishlist is empty
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Start exploring properties to add them to your wishlist
              </p>
            </div>
            <Link
              href="/property"
              className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
            >
              Explore Properties
            </Link>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}

export default WishlistPage