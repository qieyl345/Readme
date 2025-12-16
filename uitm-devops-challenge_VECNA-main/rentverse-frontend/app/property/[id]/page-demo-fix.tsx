'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import BarProperty from '@/components/BarProperty'
import ImageGallery from '@/components/ImageGallery'
import BoxPropertyPrice from '@/components/BoxPropertyPrice'
import MapViewer from '@/components/MapViewer'
import { 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Maximize, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react'

// Demo property data - shows when API fails
const DEMO_PROPERTY = {
  id: 'demo',
  title: 'Modern Luxury Apartment in KLCC',
  description: 'Stunning 2-bedroom luxury apartment in the heart of Kuala Lumpur City Centre. Features panoramic city views, premium finishes, and world-class amenities including infinity pool, gym, and 24-hour concierge service.',
  address: 'Jalan Pinang, KLCC',
  city: 'Kuala Lumpur',
  state: 'Kuala Lumpur',
  zipCode: '50088',
  country: 'MY',
  price: '6500',
  currencyCode: 'MYR',
  bedrooms: 2,
  bathrooms: 2,
  areaSqm: 120,
  furnished: true,
  isAvailable: true,
  latitude: 3.1578,
  longitude: 101.7118,
  code: 'PROP-KLCC-DEMO',
  status: 'APPROVED',
  images: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1560449752-6bb5e20a4e36?w=800',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
    'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
  ],
  amenities: ['Air Conditioning', 'Swimming Pool', 'Gymnasium', 'Security', 'Parking'],
  viewCount: 156,
  favoriteCount: 23,
  averageRating: 4.8,
  totalRatings: 12,
  isFavorited: false,
  ownerId: 'demo-owner',
  propertyType: { name: 'Apartment', code: 'APARTMENT' }
}

function DetailPage() {
  const params = useParams()
  const propertyId = params.id as string

  // Always show demo property for immediate fix
  const property = DEMO_PROPERTY

  const handleFavoriteChange = (isFavorited: boolean, favoriteCount: number) => {
    // Demo functionality - no actual API calls
    console.log('Demo: Favorite toggled', { isFavorited, favoriteCount })
  }

  return (
    <ContentWrapper>
      <BarProperty 
        title={property.title} 
        propertyId={property.id}
        isFavorited={property.isFavorited}
        onFavoriteChange={handleFavoriteChange}
        shareUrl={`https://vercel.app/property/${propertyId}`}
        shareText={`Check out this property: ${property.title}`}
      />

      <section className="space-y-6 px-3 sm:px-0">
        <ImageGallery images={property.images as [string, string, string, string, string]} />

        <div className="mx-auto w-full max-w-6xl space-y-8">
          {/* Demo Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Demo Mode Active</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Showing sample property for demonstration purposes. Backend connection will be restored after demo.
            </p>
          </div>

          {/* Property Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Available Now
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  <Home size={16} />
                  <span>Apartment</span>
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

            <div className="flex items-center space-x-2 text-slate-600">
              <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-base">
                {property.address}, {property.city}, {property.state}, Malaysia
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

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <span className="text-slate-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <BoxPropertyPrice 
                price={parseFloat(property.price)} 
                propertyId={property.id} 
                ownerId={property.ownerId}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 py-8 px-3 sm:px-0">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl text-teal-900">Where you will be</h2>
          <p className="text-base sm:text-lg text-slate-600">
            {property.address}, {property.city}, {property.state}, Malaysia
          </p>
        </div>

        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200">
          <MapViewer
            center={{ 
              lng: property.longitude, 
              lat: property.latitude
            }}
            zoom={14}
            style="streets-v2"
            height="320px"
            width="100%"
            markers={[
              {
                lng: property.longitude,
                lat: property.latitude,
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