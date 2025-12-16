'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Heart } from 'lucide-react'
import { Property } from '@/types/property'
import { FavoritesApiClient } from '@/utils/favoritesApiClient'
import useAuthStore from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface CardPropertyFeaturedProps {
  property: Property
}

export default function CardPropertyFeatured({ property }: CardPropertyFeaturedProps) {
  const [imageError, setImageError] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [favoritedState, setFavoritedState] = useState(property.isFavorited || false)
  
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()
  
  // Format price - SUPPORT string | number
  const formatPrice = (price: string | number, currencyCode: string) => {
    // Convert to number if string
    const priceNumber = typeof price === 'string' ? parseFloat(price) : price
    
    // Check if valid number
    if (isNaN(priceNumber as number)) {
      return currencyCode === 'IDR' ? 'Rp 0' : 'RM 0'
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode === 'IDR' ? 'IDR' : 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return formatter.format(priceNumber)
  }

  // Handle image error
  const handleImageError = () => {
    console.log('Image failed to load:', property.images[0])
    setImageError(true)
  }

  // Process image URL
  const getImageUrl = (url: string) => {
    if (!url) return null
    return url
  }

  // Handle favorite button click
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      router.push('/auth/login')
      return
    }

    if (isFavoriting) return // Prevent multiple clicks

    setIsFavoriting(true)
    
    try {
      const result = await FavoritesApiClient.toggleFavorite(property.id)
      
      if (result.success) {
        // Update local state
        setFavoritedState(result.data.isFavorited)
        
        // Optionally update the parent component or global state here
        // For now, we'll just log the result
        console.log(`Property ${property.id} ${result.data.isFavorited ? 'added to' : 'removed from'} favorites`)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Show user-friendly error message
      alert('Failed to update favorite. Please try again.')
    } finally {
      setIsFavoriting(false)
    }
  }

  // Fallback image URL
  const fallbackImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop'

  return (
    <Link href={`/property/${property.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300">
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          {getImageUrl(property.images[0]) && !imageError ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={handleImageError}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <Image
              src={fallbackImage}
              alt={property.title}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          
          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isFavoriting}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50"
            title={isLoggedIn ? (favoritedState ? 'Remove from favorites' : 'Add to favorites') : 'Login to save favorites'}
          >
            <Heart
              size={18}
              className={`${favoritedState ? 'fill-red-500 text-red-500' : 'text-slate-700'} ${
                isFavoriting ? 'animate-pulse' : ''
              }`}
            />
          </button>
        </div>

        {/* Simplified Property Details - Only Name, Price, Location */}
        <div className="p-4">
          {/* Property Name */}
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 text-lg leading-tight">
            {property.title}
          </h3>

          {/* Price */}
          <div className="mb-3">
            <span className="text-xl font-bold text-teal-600">
              {formatPrice(property.price, property.currencyCode)}
              <span className="text-sm font-normal text-slate-500">/month</span>
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin size={16} className="mr-2 shrink-0 text-slate-400" />
            <span className="line-clamp-1">
              {property.address}, {property.city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}