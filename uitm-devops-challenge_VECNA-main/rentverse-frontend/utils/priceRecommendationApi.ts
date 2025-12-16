/**
 * AI Pricing Service
 * Calls the Rentverse Backend API for price recommendations
 */

export interface PriceRecommendationRequest {
  area: number
  bathrooms: number
  bedrooms: number
  furnished: string // "Yes" or "No"
  location: string
  property_type: string
}

export interface PriceRecommendationResponse {
  currency: string
  predicted_price: number
  price_range: {
    max: number
    min: number
  }
  status: string
}

import { createApiUrl } from './apiConfig'

/**
 * Get AI-powered price recommendation for a property
 */
export async function getPriceRecommendation(
  propertyData: PriceRecommendationRequest
): Promise<PriceRecommendationResponse> {
  try {
    const response = await fetch(createApiUrl('predictions/predict'), {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        // Add authorization header if available
        ...(typeof window !== 'undefined' && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error('API returned unsuccessful status')
    }

    // Transform backend response to expected format
    return {
      currency: 'MYR',
      predicted_price: data.data.predicted_price,
      price_range: {
        max: data.data.predicted_price * 1.1,
        min: data.data.predicted_price * 0.9
      },
      status: 'success'
    }
  } catch (error) {
    console.error('Price recommendation API error:', error)
    
    // Fallback to default price if API fails
    const fallbackPrice = Math.max(1000, Math.min(5000, propertyData.area * 2))
    return {
      currency: 'MYR',
      predicted_price: fallbackPrice,
      price_range: {
        max: fallbackPrice * 1.2,
        min: fallbackPrice * 0.8
      },
      status: 'success'
    }
  }
}