'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import SearchBoxProperty from '@/components/SearchBoxProperty'
import CardProperty from '@/components/CardProperty'
import MapViewer from '@/components/MapViewer'
import ButtonMapViewSwitcher from '@/components/ButtonMapViewSwitcher'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import type { Property } from '@/types/property'
import { MapPin, Grid, List, Filter } from 'lucide-react'

interface PropertiesState {
  properties: Property[]
  filteredProperties: Property[]
  isLoading: boolean
  error: string | null
  viewMode: 'grid' | 'map'
  showFilters: boolean
}

function PropertyIndexPage() {
  const router = useRouter()
  const [state, setState] = useState<PropertiesState>({
    properties: [],
    filteredProperties: [],
    isLoading: true,
    error: null,
    viewMode: 'grid',
    showFilters: false
  })

  // Fetch properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        console.log('🔍 Fetching all properties...')
        
        // Fetch properties from backend
        const response = await PropertiesApiClient.searchProperties({})
        
        if (response.success && response.data.properties) {
          console.log('✅ Properties fetched successfully:', response.data.properties.length)
          setState(prev => ({
            ...prev,
            properties: response.data.properties,
            filteredProperties: response.data.properties,
            isLoading: false
          }))
        } else {
          throw new Error('Failed to fetch properties')
        }
      } catch (err) {
        console.error('❌ Error fetching properties:', err)
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load properties',
          isLoading: false
        }))
      }
    }

    fetchProperties()
  }, [])

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/property/${propertyId}`)
  }

  const handleSearch = (searchResults: Property[]) => {
    setState(prev => ({
      ...prev,
      filteredProperties: searchResults
    }))
  }

  const toggleViewMode = () => {
    setState(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'grid' ? 'map' : 'grid'
    }))
  }

  const toggleFilters = () => {
    setState(prev => ({
      ...prev,
      showFilters: !prev.showFilters
    }))
  }

  // Loading state
  if (state.isLoading) {
    return (
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Properties</h2>
            <p className="text-slate-600">Finding available rentals for you...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error state
  if (state.error) {
    return (
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load Properties</h2>
            <p className="text-slate-600 mb-6">{state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Find Your Perfect Home
            </h1>
            <p className="text-xl text-teal-100">
              Discover amazing rental properties across Malaysia
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBoxProperty />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Available Properties
            </h2>
            <p className="text-slate-600 mt-1">
              {state.filteredProperties.length} properties found
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
            
            <ButtonMapViewSwitcher 
              onClick={toggleViewMode}
              isMapView={state.viewMode === 'map'}
            />
          </div>
        </div>

        {/* No Results */}
        {state.filteredProperties.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Properties Found</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your search criteria or browse all available properties
            </p>
            <button 
              onClick={() => handleSearch(state.properties)}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              View All Properties
            </button>
          </div>
        )}

        {/* Grid View */}
        {state.viewMode === 'grid' && state.filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.filteredProperties.map((property) => (
              <CardProperty
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}

        {/* Map View */}
        {state.viewMode === 'map' && state.filteredProperties.length > 0 && (
          <div className="bg-slate-100 rounded-xl overflow-hidden" style={{ height: '600px' }}>
            {state.properties.length > 0 && (
              <MapViewer
                center={{
                  lng: state.properties[0].longitude || 101.6958,
                  lat: state.properties[0].latitude || 3.1390
                }}
                zoom={11}
                style="streets-v2"
                className="w-full h-full"
                markers={state.filteredProperties
                  .filter(p => p.latitude && p.longitude)
                  .map(property => ({
                    lng: property.longitude!,
                    lat: property.latitude!,
                    popup: `
                      <div class="p-3 max-w-xs">
                        <h3 class="font-semibold text-slate-900 mb-2">${property.title}</h3>
                        <p class="text-sm text-slate-600 mb-2">${property.address}, ${property.city}</p>
                        <p class="text-lg font-bold text-teal-600">RM ${property.price}/month</p>
                        <button onclick="window.location.href='/property/${property.id}'" 
                                class="mt-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">
                          View Details
                        </button>
                      </div>
                    `,
                    color: '#0d9488'
                  }))
                }
                interactive={true}
              />
            )}
          </div>
        )}

        {/* Property List View (Mobile) */}
        {state.filteredProperties.length > 0 && (
          <div className="block lg:hidden mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">List View</h3>
            <div className="space-y-4">
              {state.filteredProperties.slice(0, 5).map((property) => (
                <div 
                  key={property.id}
                  onClick={() => handlePropertyClick(property.id)}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {property.images && property.images[0] && (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{property.title}</h4>
                      <div className="flex items-center text-slate-600 text-sm mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span className="truncate">{property.city}, {property.state}</span>
                      </div>
                      <p className="text-teal-600 font-bold mt-1">RM {property.price}/month</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ContentWrapper>
  )
}

export default PropertyIndexPage
