'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft, Save, Trash2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import useAuthStore from '@/stores/authStore'
import { createApiUrl } from '@/utils/apiConfig'

interface Property {
  id: string
  title: string
  description: string
  price: string
  furnished: boolean
  isAvailable: boolean
  status: string
  ownerId: string
  propertyType: {
    id: string
    code: string
    name: string
  }
  owner?: {
    id: string
    name: string
    email: string
  }
  images: string[]
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  currencyCode: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
}

interface PropertyResponse {
  success: boolean
  message: string
  data: {
    property: Property
  }
}

function ModifyPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { propertyTypes, isLoading: isLoadingTypes } = usePropertyTypes()
  const { isLoggedIn, user } = useAuthStore()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  // Form state - Initialize with empty values, will be populated from API
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    price: '',
    furnished: false,
    isAvailable: true,
    status: 'APPROVED'
  })

  // Form validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters'
    }
    
    if (!formData.propertyType.trim()) {
      errors.propertyType = 'Property type is required'
    }
    
    if (!formData.price.trim()) {
      errors.price = 'Price is required'
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a valid positive number'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Fetch property data and pre-fill form
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || propertyId === 'undefined' || propertyId === 'null') {
        setError('Property ID not found in URL')
        setIsLoading(false)
        return
      }

      // Don't redirect immediately - just return if not logged in
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      // Wait for user data to load before proceeding
      if (!user) {
        console.log('[AUTH] User data not yet loaded, waiting...')
        setIsLoading(false)
        return
      }

      try {
        console.log('[PROPERTY] Fetching property with ID:', propertyId)
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch(createApiUrl(`properties/${propertyId}`), {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch property: ${response.status}`)
        }

        const data: PropertyResponse = await response.json()
        
        if (data.success && data.data.property) {
          const propertyData = data.data.property
          console.log('[PROPERTY] Successfully loaded property:', propertyData)
          
          // Check if the current user is the owner of this property
          if (user && propertyData.ownerId !== user.id) {
            console.log('[AUTH] User is not the owner of this property:', {
              currentUserId: user.id,
              propertyOwnerId: propertyData.ownerId
            })
            setIsUnauthorized(true)
            setError('You are not authorized to modify this property. Only the property owner can make changes.')
            return
          }
          
          setProperty(propertyData)
          
          // Pre-fill form data with fetched property data - ensure all fields are properly set
          const newFormData = {
            title: propertyData.title || '',
            description: propertyData.description || '',
            propertyType: propertyData.propertyType?.name || '',
            price: propertyData.price?.toString() || '',
            furnished: Boolean(propertyData.furnished),
            isAvailable: propertyData.isAvailable ?? true,
            status: propertyData.status || 'APPROVED'
          }
          
          setFormData(newFormData)
          
          console.log('[PROPERTY] Form pre-filled with:', newFormData)
        } else {
          setError('Failed to load property')
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError(err instanceof Error ? err.message : 'Failed to load property')
      } finally {
        setIsLoading(false)
      }
    }

    console.log('[EFFECT] useEffect triggered, propertyId:', propertyId, 'isLoggedIn:', isLoggedIn, 'user:', user)
    fetchProperty()
  }, [propertyId, isLoggedIn, user])

  const handleBack = () => {
    router.back()
  }

  const handleSave = async () => {
    if (!isLoggedIn) {
      setError('Please log in to save changes')
      return
    }

    // Additional security check: verify user owns this property
    if (!user || !property || property.ownerId !== user.id) {
      setError('You are not authorized to modify this property')
      return
    }

    // Validate form
    if (!validateForm()) {
      setError('Please fix the validation errors before saving')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication token not found')
        return
      }

      // Only send changed fields
      const updateData: Partial<{
        title: string
        description: string
        price: number
        furnished: boolean
        isAvailable: boolean
        status: string
      }> = {}
      
      if (property) {
        if (formData.title !== property.title) updateData.title = formData.title
        if (formData.description !== property.description) updateData.description = formData.description
        if (formData.price !== property.price) updateData.price = parseFloat(formData.price)
        if (formData.furnished !== property.furnished) updateData.furnished = formData.furnished
        if (formData.isAvailable !== property.isAvailable) updateData.isAvailable = formData.isAvailable
        if (formData.status !== property.status) updateData.status = formData.status
      }

      // If no changes, just go back
      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save')
        setTimeout(() => router.back(), 1500)
        return
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}`), {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update property: ${response.status}`)
      }

      const data: PropertyResponse = await response.json()
      
      if (data.success) {
        setSuccess('Property updated successfully!')
        // Success - redirect back to property details or list after delay
        setTimeout(() => {
          router.push(`/property/${propertyId}`)
        }, 2000)
      } else {
        setError('Failed to update property')
      }
    } catch (err) {
      console.error('Error updating property:', err)
      setError(err instanceof Error ? err.message : 'Failed to update property')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!isLoggedIn) {
      setError('Please log in to delete property')
      return
    }

    // Additional security check: verify user owns this property
    if (!user || !property || property.ownerId !== user.id) {
      setError('You are not authorized to delete this property')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication token not found')
        return
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}`), {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete property: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Success - redirect to property list
        router.push('/property')
      } else {
        setError('Failed to delete property')
      }
    } catch (err) {
      console.error('Error deleting property:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete property')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  return (
    <ContentWrapper>
      <div className="flex items-center space-x-3 mb-8">
        <ButtonCircle icon={<ArrowLeft />} onClick={handleBack} />
        <h1 className="text-2xl font-sans font-medium text-slate-900">
          Edit Property
        </h1>
      </div>

      {isLoading && (
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <div className="text-slate-600">Loading property details...</div>
            <div className="text-sm text-slate-400">Preparing form with existing data...</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
            <button onClick={clearMessages} className="ml-auto">
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={clearMessages} className="ml-auto">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Show unauthorized state */}
      {!isLoading && isUnauthorized && (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="space-y-6">
            <div className="text-6xl">🚫</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-600 mb-6">
                You can only modify properties that you own. This property belongs to another landlord.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => router.push('/property')}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  View All Properties
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors duration-200"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show login required state */}
      {!isLoading && !error && !isLoggedIn && (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="space-y-6">
            <div className="text-6xl">🔒</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
              <p className="text-slate-600 mb-6">
                You need to be logged in to modify property listings.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && isLoggedIn && !isUnauthorized && (
        <div className="max-w-6xl mx-auto">
          {/* Mobile-first responsive layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                  Property Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    validationErrors.title ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter property title"
                  maxLength={100}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-600">{validationErrors.title}</p>
                )}
                <div className="flex justify-end">
                  <span className="text-xs text-slate-400">
                    {formData.title.length}/100 characters
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-colors ${
                    validationErrors.description ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter property description"
                  maxLength={1000}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description}</p>
                )}
                <div className="flex justify-end">
                  <span className="text-xs text-slate-400">
                    {formData.description.length}/1000 characters
                  </span>
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700">
                  Property Type *
                </label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    validationErrors.propertyType ? 'border-red-300' : 'border-slate-200'
                  }`}
                  disabled={isLoadingTypes}
                >
                  <option value="">Select property type</option>
                  {isLoadingTypes ? (
                    <option value="">Loading property types...</option>
                  ) : (
                    propertyTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
                {validationErrors.propertyType && (
                  <p className="text-sm text-red-600">{validationErrors.propertyType}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                  Monthly Rent (MYR) *
                </label>
                <input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                    validationErrors.price ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter rental price"
                  min="0"
                  step="0.01"
                />
                {validationErrors.price && (
                  <p className="text-sm text-red-600">{validationErrors.price}</p>
                )}
              </div>

              {/* Furnished */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Furnished Status
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="furnished"
                      checked={formData.furnished === true}
                      onChange={() => handleInputChange('furnished', true)}
                      className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">Fully Furnished</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="furnished"
                      checked={formData.furnished === false}
                      onChange={() => handleInputChange('furnished', false)}
                      className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">Unfurnished</span>
                  </label>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Availability Status
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isAvailable"
                      checked={formData.isAvailable === true}
                      onChange={() => handleInputChange('isAvailable', true)}
                      className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">Available</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isAvailable"
                      checked={formData.isAvailable === false}
                      onChange={() => handleInputChange('isAvailable', false)}
                      className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">Not Available</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                  Listing Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-serif text-slate-900 mb-2">
                      {formData.title || 'Property Title'}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {formData.description || 'Property description will appear here...'}
                    </p>
                  </div>

                  {/* Image placeholder */}
                  <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Property images</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Current images will be displayed here
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.propertyType && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                          {formData.propertyType}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        formData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {formData.status}
                      </span>
                    </div>

                    {formData.price && (
                      <p className="text-xl font-bold text-slate-900">
                        MYR {parseFloat(formData.price).toLocaleString()}
                        <span className="text-sm font-normal text-slate-500"> / month</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>Furnished: {formData.furnished ? 'Yes' : 'No'}</span>
                      <span>•</span>
                      <span>{formData.isAvailable ? 'Available' : 'Not Available'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Property'}</span>
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗑️</div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete Property
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Are you sure you want to delete this property? This action cannot be undone and all data associated with this property will be permanently removed.
              </p>
              <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                Property: <span className="font-medium">{property?.title}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}

export default ModifyPropertyPage