import type { Property } from '@/types/property'

// --- FIX 1: Define URL directly to be safe (no dependency on apiConfig) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';
const BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Backend response property structure
interface BackendProperty {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  price: string
  currencyCode: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
  furnished: boolean
  isAvailable: boolean
  images: string[]
  latitude: number
  longitude: number
  placeId?: string | null
  projectName?: string | null
  developer?: string | null
  code: string
  status: string
  createdAt: string
  updatedAt: string
  ownerId: string
  propertyTypeId: string
  propertyType: {
    id: string
    code: string
    name: string
    description: string
    icon: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  owner: {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
  }
  amenities: Array<{
    propertyId: string
    amenityId: string
    amenity: {
      id: string
      name: string
      category: string
    }
  }>
  mapsUrl: string
  viewCount: number
  averageRating: number
  totalRatings: number
  isFavorited: boolean
  favoriteCount: number
}

export interface FavoritesResponse {
  success: boolean
  data: {
    favorites: Property[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

// Transform backend property to frontend Property format
function transformProperty(backendProperty: BackendProperty): Property {
  return {
    id: backendProperty.id,
    code: backendProperty.code,
    title: backendProperty.title,
    description: backendProperty.description,
    address: backendProperty.address,
    city: backendProperty.city,
    state: backendProperty.state,
    zipCode: backendProperty.zipCode,
    country: backendProperty.country,
    price: parseFloat(backendProperty.price.toString()), // Ensure number
    currencyCode: backendProperty.currencyCode,
    type: backendProperty.propertyType.code as 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'CONDO' | 'VILLA' | 'ROOM',
    bedrooms: backendProperty.bedrooms,
    bathrooms: backendProperty.bathrooms,
    area: backendProperty.areaSqm,
    areaSqm: backendProperty.areaSqm,
    furnished: backendProperty.furnished,
    isAvailable: backendProperty.isAvailable,
    viewCount: backendProperty.viewCount,
    averageRating: backendProperty.averageRating,
    totalRatings: backendProperty.totalRatings,
    isFavorited: backendProperty.isFavorited,
    favoriteCount: backendProperty.favoriteCount,
    images: backendProperty.images,
    amenities: backendProperty.amenities.map(a => a.amenity.name),
    latitude: backendProperty.latitude,
    longitude: backendProperty.longitude,
    placeId: backendProperty.placeId || '',
    projectName: backendProperty.projectName || '',
    developer: backendProperty.developer || '',
    status: backendProperty.status as any,
    createdAt: backendProperty.createdAt,
    updatedAt: backendProperty.updatedAt,
    ownerId: backendProperty.ownerId,
    propertyTypeId: backendProperty.propertyTypeId,
    owner: {
      ...backendProperty.owner,
      phone: '', // Fallback
    },
    propertyType: backendProperty.propertyType,
    mapsUrl: backendProperty.mapsUrl,
  }
}

export class FavoritesApiClient {
  // --- FIX 2: Correctly retrieve token from Zustand Storage ---
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null

    // 1. Try getting from Zustand Store (Primary)
    const storedState = localStorage.getItem('rentverse-auth-store')
    if (storedState) {
        try {
            const data = JSON.parse(storedState)
            if (data.state && data.state.token) {
                return data.state.token
            }
        } catch (e) {
            console.error("Failed to parse auth store", e)
        }
    }

    // 2. Try getting from direct key (Fallback/Legacy)
    return localStorage.getItem('authToken')
  }

  static async getFavorites(page: number = 1, limit: number = 10): Promise<FavoritesResponse> {
    const token = this.getAuthToken()
    
    if (!token) {
        throw new Error("Authentication token not found. Please log in.")
    }

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Add Header
    }
    
    try {
      console.log('Fetching favorites from API...')
      // Correct Endpoint path (make sure backend route matches /api/properties/favorites)
      const url = `${BASE_URL}/api/properties/favorites?page=${page}&limit=${limit}`
      console.log('URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers,
        // mode: 'cors', // Next.js rewrites handle CORS usually, but keeping it is fine
        cache: 'no-cache',
      })

      console.log('Response status:', response.status)

      if (response.status === 401) {
         throw new Error("Session expired or invalid token. Please login again.");
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      // Handle case where data.data is missing or structure is different
      if (!data.success) {
          throw new Error(data.message || 'Failed to fetch favorites');
      }

      console.log('Successfully fetched favorites items')
      
      // Transform backend properties to frontend format
      const favoritesList = data.data?.favorites || data.data || []; // Handle structure variations
      
      const transformedData = {
        success: true,
        data: {
          favorites: Array.isArray(favoritesList) ? favoritesList.map(transformProperty) : [],
          pagination: data.data?.pagination || {
             page: 1, limit: 10, total: 0, pages: 0
          }
        }
      }
      
      return transformedData
    } catch (error) {
      console.error('Error fetching favorites:', error)
      throw error
    }
  }

  static async addToFavorites(propertyId: string): Promise<{ 
    success: boolean
    message: string
    data: {
      action: string
      isFavorited: boolean
      favoriteCount: number
    }
  }> {
    const token = this.getAuthToken()
    
    if (!token) throw new Error("No token found")

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    
    try {
      console.log('Toggling favorite for property:', propertyId)
      // Endpoint to toggle favorite
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}/favorite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}), // Empty body for POST
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Successfully toggled favorite:', data)
      return data
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  static async removeFromFavorites(propertyId: string) {
    // Use the same POST endpoint - backend handles the toggle logic
    return this.addToFavorites(propertyId)
  }

  static async toggleFavorite(propertyId: string) {
    return this.addToFavorites(propertyId)
  }
}

export const favoritesApiClient = new FavoritesApiClient(); // Export instance for consistency