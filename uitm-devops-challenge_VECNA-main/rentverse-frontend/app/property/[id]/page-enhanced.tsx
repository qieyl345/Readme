'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import BarProperty from '@/components/BarProperty'
import ImageGallery from '@/components/ImageGallery'
import BoxPropertyPrice from '@/components/BoxPropertyPrice'
import MapViewer from '@/components/MapViewer'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import { ShareService } from '@/utils/shareService'
import type { Property } from '@/types/property'
import { 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Maximize, 
  Car, 
  Wifi, 
  Tv, 
  Utensils,
  Waves,
  Shield,
  Thermometer,
  Wind,
  TreePine,
  Dumbbell,
  Coffee,
  Sparkles,
  Phone,
  Mail,
  Star,
  Eye,
  Heart,
  Share2,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Property type icons mapping
const propertyTypeIcons: { [key: string]: any } = {
  'apartment': Home,
  'condo': Home,
  'house': Home,
  'villa': Home,
  'studio': Home,
  'room': Home,
}

// Amenity icons mapping
const amenityIcons: { [key: string]: any } = {
  'wifi': Wifi,
  'parking': Car,
  'tv': Tv,
  'kitchen': Utensils,
  'pool': Waves,
  'security': Shield,
  'aircon': Thermometer,
  'fan': Wind,
  'garden': TreePine,
  'gym': Dumbbell,
  'balcony': Home,
  'laundry': Coffee,
  'cleaning': Sparkles,
  'furnished': Home,
}

// Property feature highlights
const getPropertyHighlights = (property: Property) => {
  const highlights = []
  
  if (property.furnished) highlights.push('Fully Furnished')
  if (property.isAvailable) highlights.push('Available Now')
  if (property.areaSqm > 100) highlights.push('Spacious')
  if (property.bedrooms >= 3) highlights.push('Large Property')
  if (property.bathrooms >= 2) highlights.push('Multiple Bathrooms')
  
  return highlights
}

function DetailPage() {
  const params = useParams()
  const propertyId = params.id as string
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  // Fetch property data and log view in one call
  useEffect(() => {
    const fetchPropertyAndLogView = async () => {
      if (!propertyId) return
      
      try {
        setIsLoading(true)
        // Use the view logging API which returns complete property data
        const viewResponse = await PropertiesApiClient.logPropertyView(propertyId)
        
        if (viewResponse.success && viewResponse.data.property) {
          setProperty(viewResponse.data.property)
        } else {
          setError('Failed to load property details')
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError('Failed to load property details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyAndLogView()
  }, [propertyId])

  // Handle favorite change callback
  const handleFavoriteChange = (isFavorited: boolean, favoriteCount: number) => {
    if (property) {
      setProperty(prev => prev ? {
        ...prev,
        isFavorited,
        favoriteCount
      } : null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <div className="text-lg text-slate-600">Loading property details...</div>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg text-red-600 mb-4">{error || 'Property not found'}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Fallback images if property doesn't have images
  const tempImage: [string, string, string, string, string] = [
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758016984/rentverse-rooms/Gemini_Generated_Image_5hdui35hdui35hdu_s34nx6.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_ockiwbockiwbocki_vmmlhm.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_5ckgfc5ckgfc5ckg_k9uzft.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_7seyqi7seyqi7sey_jgzhig.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211362/rentverse-rooms/Gemini_Generated_Image_2wt0y22wt0y22wt0_ocdafo.png',
  ]

  // Use property images or fallback to temp images
  const displayImages = property.images && property.images.length >= 5 
    ? property.images.slice(0, 5) as [string, string, string, string, string]
    : tempImage

  // Format price for display
  const displayPrice = typeof property.price === 'string' ? parseFloat(property.price) : property.price

  // Get property highlights
  const highlights = getPropertyHighlights(property)

  // Get property type display name and icon
  const propertyTypeName = typeof property.propertyType === 'string' 
    ? property.propertyType 
    : property.propertyType?.name || 'Property'
  const propertyTypeKey = propertyTypeName.toLowerCase().replace(/\s+/g, '-')
  const PropertyTypeIcon = propertyTypeIcons[propertyTypeKey] || Home

  // Process amenities - handle both string and object formats
  const processedAmenities = (property.amenities || []).map((amenity: any) => {
    if (typeof amenity === 'string') {
      return { name: amenity, icon: amenityIcons[amenity.toLowerCase()] || CheckCircle }
    } else {
      const name = amenity.name || amenity.amenity?.name || 'Amenity'
      return { 
        name, 
        icon: amenityIcons[name.toLowerCase()] || CheckCircle 
      }
    }
  })

  // Create share data using ShareService
  const shareData = ShareService.createPropertyShareData({
    title: property.title,
    bedrooms: property.bedrooms,
    city: property.city,
    state: property.state,
    price: property.price
  })

  return (
    <ContentWrapper>
      <BarProperty 
        title={property.title} 
        propertyId={property.id}
        isFavorited={property.isFavorited}
        onFavoriteChange={handleFavoriteChange}
        shareUrl={shareData.url}
        shareText={shareData.text}
      />

      <section className="space-y-6 px-3 sm:px-0">
        <ImageGallery images={displayImages} />

        {/* Main content area - Mobile first responsive layout */}
        <div className="mx-auto w-full max-w-6xl space-y-8">
          {/* Property header and key info */}
          <div className="space-y-6">
            {/* Title and availability status */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  property.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {property.isAvailable ? 'Available Now' : 'Not Available'}
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  <PropertyTypeIcon size={16} />
                  <span className="capitalize">{propertyTypeName.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Property highlights */}
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center space-x-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                    <CheckCircle size={14} />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick stats grid - Mobile optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Bed className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{property.bedrooms}</div>
                <div className="text-xs text-slate-500">Bedrooms</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Bath className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{property.bathrooms}</div>
                <div className="text-xs text-slate-500">Bathrooms</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Maximize className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{property.areaSqm}</div>
                <div className="text-xs text-slate-500">Sq.m</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Home className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{property.furnished ? 'Yes' : 'No'}</div>
                <div className="text-xs text-slate-500">Furnished</div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 text-slate-600">
              <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-base">
                {property.address}, {property.city}, {property.state}, {property.country === 'MY' ? 'Malaysia' : property.country}
              </span>
            </div>

            {/* Rating and views */}
            <div className="flex items-center space-x-6 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold text-slate-900">
                  {property.averageRating > 0 ? property.averageRating.toFixed(1) : '4.8'}
                </span>
                <span className="text-slate-500">
                  ({property.totalRatings > 0 ? `${property.totalRatings} reviews` : 'No reviews yet'})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-slate-400" />
                <span className="text-slate-500">
                  {property.viewCount > 1000 ? `${Math.floor(property.viewCount / 1000)}K` : property.viewCount} views
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-slate-400" />
                <span className="text-slate-500">
                  {property.favoriteCount || 0} favorites
                </span>
              </div>
            </div>
          </div>

          {/* Description section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">About this place</h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed">
                {property.description || 'Beautiful property in a prime location. This well-maintained space offers comfort and convenience for modern living. Features include modern amenities, excellent location, and thoughtful design elements throughout.'}
              </p>
            </div>
          </div>

          {/* Amenities section */}
          {processedAmenities.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedAmenities.map((amenity, index) => {
                  const IconComponent = amenity.icon
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <IconComponent className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <span className="text-slate-700">{amenity.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* House rules and policies */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">House rules</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Check-in: After 3:00 PM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Check-out: Before 11:00 AM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Maximum {property.bedrooms * 2} guests</span>
              </div>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">No smoking • No pets • No parties</span>
              </div>
            </div>
          </div>

          {/* Contact information */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Contact host</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Property Owner</div>
                <div className="text-sm text-slate-500">Verified host</div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Mail className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Booking section - Always visible on mobile */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <BoxPropertyPrice 
              price={displayPrice} 
              propertyId={property.id} 
              ownerId={property.ownerId}
            />
          </div>
        </div>
      </section>

      {/* Location section */}
      <section className="mx-auto w-full max-w-6xl space-y-6 py-8 px-3 sm:px-0">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl text-teal-900">Where you will be</h2>
          <p className="text-base sm:text-lg text-slate-600">
            {property.address}, {property.city}, {property.state}, {property.country === 'MY' ? 'Malaysia' : property.country}
          </p>
        </div>

        {/* MapTiler Map */}
        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200">
          <MapViewer
            center={{ 
              lng: property.longitude || 102.2386, 
              lat: property.latitude || 6.1254 
            }}
            zoom={14}
            style="streets-v2"
            height="320px"
            width="100%"
            markers={[
              {
                lng: property.longitude || 102.2386,
                lat: property.latitude || 6.1254,
                popup: `<div class="p-2"><h3 class="font-semibold">${property.title}</h3><p class="text-sm text-slate-600">${property.address}, ${property.city}</p></div>`,
                color: '#0d9488',
              },
            ]}
            className="rounded-2xl"
          />
        </div>
      </section>
    </ContentWrapper>
  )
}

export default DetailPage