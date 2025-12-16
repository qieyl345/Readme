import type { PropertyTypesResponse } from '@/types/property'
import { createApiUrl } from './apiConfig'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000'

export class PropertyTypesApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  static async getPropertyTypes(): Promise<PropertyTypesResponse> {
    const token = this.getAuthToken()
    
    const headers: Record<string, string> = {
      'accept': 'application/json',
    }
    
    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      console.log('Making request to property types API...')
      console.log('URL:', createApiUrl('property-types'))
      console.log('Headers:', headers)

      const response = await fetch(createApiUrl('property-types'), {
        method: 'GET',
        headers,
        mode: 'cors',
        cache: 'no-cache',
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Successfully fetched property types:', data.data?.length || 0, 'items')
      
      return data
    } catch (error) {
      console.error('Error fetching property types:', error)
      throw error
    }
  }
}