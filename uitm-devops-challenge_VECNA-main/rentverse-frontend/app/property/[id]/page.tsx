'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Maximize, 
  CheckCircle,
  AlertCircle,
  Loader2 
} from 'lucide-react'
import ContentWrapper from '@/components/ContentWrapper'
import BarProperty from '@/components/BarProperty'
import ImageGallery from '@/components/ImageGallery'
import BoxPropertyPrice from '@/components/BoxPropertyPrice'
import MapViewer from '@/components/MapViewer'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import type { Property } from '@/types/property'

function DetailPage() {
  const params = useParams()
  const propertyId = params.id as string

  // State management
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔍 Fetching property with ID:', propertyId)
        
        // Fetch property from backend
        const propertyData = await PropertiesApiClient.getProperty(propertyId)
        
        console.log('✅ Property data fetched successfully:', propertyData)
        setProperty(propertyData)
        
        // Log property view
        try {
          await PropertiesApiClient.logPropertyView(propertyId)
          console.log('📊 Property view logged')
        } catch (logError) {
          console.warn('⚠️ Failed to log property view:', logError)
          // Don't fail the whole page if view logging fails
        }
        
      } catch (err) {
        console.error('❌ Error fetching property:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load property details'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  const handleFavoriteChange = async (isFavorited: boolean, favoriteCount: number) => {
    // Update local state optimistically
    if (property) {
      setProperty({
        ...property,
        isFavorited,
        favoriteCount
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Property</h2>
            <p className="text-slate-600">Fetching property details...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error state
  if (error) {
    return (
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Property Not Found</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Property ID: {propertyId}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
              <div className="pt-4">
                <button 
                  onClick={() => window.location.href = '/property'} 
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  ← Back to Properties
                </button>
              </div>
            </div>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // No property data
  if (!property) {
    return (
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Property Data</h2>
            <p className="text-slate-600">Unable to load property information.</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  try {
    return (
      <ContentWrapper>
        <BarProperty 
          title={property.title} 
          propertyId={property.id}
          isFavorited={property.isFavorited}
          onFavoriteChange={handleFavoriteChange}
          shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
          shareText={`Check out this property: ${property.title}`}
        />

        <section className="space-y-6 px-3 sm:px-0">
          <ImageGallery images={property.images || []} />

          <div className="mx-auto w-full max-w-6xl space-y-8">
            {/* Property Content */}
            <div className="space-y-6">
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
                    <Home size={16} />
                    <span>{property.propertyType?.name || property.type || 'Property'}</span>
                  </div>
                </div>
              </div>

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
                  <div className="text-lg font-semibold text-slate-900">{property.area || property.areaSqm}</div>
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

              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-base">
                  {property.address}, {property.city}, {property.state}, {property.country}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">About this place</h3>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">What this place offers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.amenities.map((amenity: any, index: number) => {
                      const amenityName = typeof amenity === 'string' ? amenity : amenity.amenity?.name || 'Amenity'
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                          <span className="text-slate-700">{amenityName}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <BoxPropertyPrice 
                price={typeof property.price === 'string' ? parseFloat(property.price) : property.price} 
                propertyId={property.id} 
                ownerId={property.ownerId}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl space-y-6 py-8 px-3 sm:px-0">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-teal-900">Where you will be</h2>
            <p className="text-base sm:text-lg text-slate-600">
              {property.address}, {property.city}, {property.state}, {property.country}
            </p>
          </div>

          {(property.latitude && property.longitude) && (
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200">
              <MapViewer
                center={{ 
                  lng: property.longitude, 
                  lat: property.latitude
                }}
                zoom={14}
                markers={[
                  {
                    lng: property.longitude,
                    lat: property.latitude,
                    popup: `<div class="p-2"><h3 class="font-semibold">${property.title}</h3><p class="text-sm text-slate-600">${property.address}, ${property.city}</p></div>`,
                    color: '#0d9488',
                  },
                ]}
              />
            </div>
          )}
        </section>
      </ContentWrapper>
    )
  } catch (err) {
    console.error('Property page render error:', err)
    
    return (
      <ContentWrapper>
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Error Loading Property</h1>
          <p className="text-slate-600 mb-6">
            An unexpected error occurred while displaying this property.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Property ID: {propertyId}
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/property'} 
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }
}

export default DetailPage