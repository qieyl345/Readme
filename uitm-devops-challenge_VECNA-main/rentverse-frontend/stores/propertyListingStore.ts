import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { uploadProperty, mapPropertyListingToUploadRequest } from '@/utils/propertyUploadApi'

// Define all the form data structure
export interface PropertyListingData {
  // Step 1: Basic Information
  propertyType: string
  propertyTypeId?: string // Store the backend property type ID
  address: string
  city: string
  state: string
  district: string
  subdistrict: string
  streetAddress: string
  houseNumber: string
  zipCode: string
  latitude?: number
  longitude?: number
  autoFillDistance?: number // Distance to closest location in km
  
  // Step 1: Property Details
  bedrooms: number
  bathrooms: number
  areaSqm: number
  amenities: string[]
  
  // Step 2: Content & Photos
  title: string
  description: string
  images: string[]
  
  // Step 3: Legal & Pricing
  price: number
  isAvailable: boolean
  legalDocuments: string[]
  maintenanceIncluded: string // 'yes' | 'no' | ''
  landlordType: string // 'individual' | 'company' | 'partnership' | ''
}

export interface PropertyListingStep {
  id: string
  title: string
  component: string
  isCompleted: boolean
  isAccessible: boolean
}

interface PropertyListingStore {
  // State
  currentStep: number
  data: PropertyListingData
  steps: PropertyListingStep[]
  isLoading: boolean
  isDirty: boolean
  
  // Actions
  setCurrentStep: (step: number) => void
  updateData: (updates: Partial<PropertyListingData>) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  markStepCompleted: (stepIndex: number) => void
  validateCurrentStep: () => boolean
  resetForm: () => void
  clearTemporaryData: () => void
  submitForm: () => Promise<void>
  canAccessStep: (stepIndex: number) => boolean
}

// Define the steps sequence
const initialSteps: PropertyListingStep[] = [
  {
    id: 'intro',
    title: 'Getting Started',
    component: 'AddListingFirst',
    isCompleted: false,
    isAccessible: true,
  },
  {
    id: 'step-one-intro',
    title: 'Tell us about your place',
    component: 'AddListingStepOne',
    isCompleted: false,
    isAccessible: true, // Make first few steps accessible by default
  },
  {
    id: 'property-type',
    title: 'Property Type',
    component: 'AddListingStepOnePlace',
    isCompleted: false,
    isAccessible: true, // Make this accessible since it's early in the flow
  },
  {
    id: 'location-map',
    title: 'Location & Map',
    component: 'AddListingStepOneMap',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'location-details',
    title: 'Address Details',
    component: 'AddListingStepOneLocationOptimized',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'basic-info',
    title: 'Basic Information',
    component: 'AddListingStepOneBasic',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'property-details',
    title: 'Property Details',
    component: 'AddListingStepOneDetails',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'step-two-intro',
    title: 'Make it stand out',
    component: 'AddListingStepTwo',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'photos',
    title: 'Add Photos & Management',
    component: 'AddListingStepTwoPhotosOptimized',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'title',
    title: 'Property Title',
    component: 'AddListingStepTwoTitle',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'description',
    title: 'Description',
    component: 'AddListingStepTwoDescription',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'step-three-intro',
    title: 'Finish and publish',
    component: 'AddListingStepThree',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'legal',
    title: 'Legal Information',
    component: 'AddListingStepThreeLegal',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'pricing',
    title: 'Set Your Price',
    component: 'AddListingStepThreePrice',
    isCompleted: false,
    isAccessible: false,
  },
]

// Initial form data
const initialData: PropertyListingData = {
  propertyType: '',
  address: '',
  city: '',
  state: '',
  district: '',
  subdistrict: '',
  streetAddress: '',
  houseNumber: '',
  zipCode: '',
  latitude: undefined,
  longitude: undefined,
  autoFillDistance: undefined,
  bedrooms: 1,
  bathrooms: 1,
  areaSqm: 0,
  amenities: [],
  title: '',
  description: '',
  images: [],
  price: 0,
  isAvailable: true,
  legalDocuments: [],
  maintenanceIncluded: '',
  landlordType: '',
}

// Create initial state with proper typing
const createInitialState = () => ({
  currentStep: 0,
  data: initialData,
  steps: initialSteps,
  isLoading: false as boolean,
  isDirty: false as boolean,
})

export const usePropertyListingStore = create<PropertyListingStore>()(
  persist(
    (set: any, get: any) => ({
      ...createInitialState(),

      setCurrentStep: (step: number) => {
        const { steps } = get()
        if (step >= 0 && step < steps.length && get().canAccessStep(step)) {
          set({ currentStep: step })
        }
      },

      updateData: (updates: Partial<PropertyListingData>) => {
        // 🔍 ENHANCED DEBUGGING: Log all data updates
        console.log('📝 Store updateData called with:', updates)
        if (updates.images) {
          console.log('📸 Images being updated:', updates.images)
          console.log('📸 Images count:', updates.images.length)
        }
        
        set((state: any) => {
          const newData = { ...state.data, ...updates }
          console.log('📝 New store data:', JSON.stringify(newData, null, 2))
          return {
            data: newData,
            isDirty: true,
          }
        })
      },

      nextStep: () => {
        const { currentStep, steps } = get()
        const nextStep = currentStep + 1
        
        if (nextStep < steps.length) {
          // Mark current step as completed and make next step accessible
          set((state: any) => ({
            currentStep: nextStep,
            steps: state.steps.map((step: any, index: number) => ({
              ...step,
              isCompleted: index === currentStep ? true : step.isCompleted,
              isAccessible: index === nextStep ? true : step.isAccessible,
            })),
          }))
        }
      },

      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      goToStep: (step: number) => {
        if (get().canAccessStep(step)) {
          set({ currentStep: step })
        }
      },

      markStepCompleted: (stepIndex: number) => {
        set((state: any) => ({
          steps: state.steps.map((step: any, index: number) => ({
            ...step,
            isCompleted: index === stepIndex ? true : step.isCompleted,
            isAccessible: index === stepIndex + 1 ? true : step.isAccessible,
          })),
        }))
      },

      validateCurrentStep: () => {
        const { currentStep, data, steps } = get()
        const currentStepData = get().steps[currentStep]
        const isLastStep = currentStep === steps.length - 1
        
        console.log('🔍 Validating step:', currentStepData.id, 'with data:', data)
        
        // More lenient validation with progressive requirements
        switch (currentStepData.id) {
          case 'property-type': {
            // Only require property type for early steps
            const isValid = !!data.propertyType
            if (!isValid) {
              console.log('❌ Property type validation failed - please select a property type')
            } else {
              console.log('✅ Property type validation passed')
            }
            return isValid
          }
          case 'location-map':
            // Location map is optional - users can proceed without it
            console.log('✅ Location map validation: Skipped (optional)')
            return true
          case 'location-details': {
            // Only require state for now, make district optional
            const isValid = !!data.state
            if (!isValid) {
              console.log('❌ Location details validation failed - please fill in the state field')
            } else {
              console.log('✅ Location details validation passed')
            }
            return isValid
          }
          case 'basic-info': {
            // More lenient - allow 0 values in early steps, validate only in final steps
            if (isLastStep) {
              const isValid = data.bedrooms > 0 && data.bathrooms > 0 && data.areaSqm > 0
              if (!isValid) {
                console.log('❌ Basic info validation failed - bedrooms, bathrooms, and area must be greater than 0')
              } else {
                console.log('✅ Basic info validation passed')
              }
              return isValid
            }
            // For early steps, allow proceeding with default values
            console.log('✅ Basic info validation: Passed (early step)')
            return true
          }
          case 'photos': {
            // Photos are optional in early stages, required only for final submission
            if (isLastStep) {
              const isValid = data.images.length >= 1
              if (!isValid) {
                console.log('❌ Photos validation failed - at least one photo is required for final submission')
              } else {
                console.log('✅ Photos validation passed')
              }
              return isValid
            }
            console.log('✅ Photos validation: Passed (early step)')
            return true
          }
          case 'title': {
            // Title is optional in early stages
            if (isLastStep) {
              const isValid = !!data.title
              if (!isValid) {
                console.log('❌ Title validation failed - property title is required for final submission')
              } else {
                console.log('✅ Title validation passed')
              }
              return isValid
            }
            console.log('✅ Title validation: Passed (early step)')
            return true
          }
          case 'description': {
            // Description is optional in early stages
            if (isLastStep) {
              const isValid = !!data.description
              if (!isValid) {
                console.log('❌ Description validation failed - property description is required for final submission')
              } else {
                console.log('✅ Description validation passed')
              }
              return isValid
            }
            console.log('✅ Description validation: Passed (early step)')
            return true
          }
          case 'legal': {
            // Legal info is required only for final submission
            if (isLastStep) {
              const isValid = !!data.maintenanceIncluded && !!data.landlordType
              if (!isValid) {
                console.log('❌ Legal validation failed - maintenance and landlord type are required')
              } else {
                console.log('✅ Legal validation passed')
              }
              return isValid
            }
            console.log('✅ Legal validation: Passed (early step)')
            return true
          }
          case 'pricing': {
            // Price is required for final step
            if (isLastStep) {
              const isValid = data.price > 0
              if (!isValid) {
                console.log('❌ Pricing validation failed - property price must be greater than 0')
              } else {
                console.log('✅ Pricing validation passed')
              }
              return isValid
            }
            console.log('✅ Pricing validation: Passed (early step)')
            return true
          }
          default:
            // For intro steps and steps without validation
            console.log('✅ Default validation: Passed')
            return true
        }
      },

      canAccessStep: (stepIndex: number) => {
        const { steps } = get()
        if (stepIndex >= steps.length || stepIndex < 0) return false
        
        // First step is always accessible
        if (stepIndex === 0) return true
        
        // Check if step is marked as accessible
        return steps[stepIndex].isAccessible
      },

      resetForm: () => {
        set(createInitialState())
      },

      clearTemporaryData: () => {
        // Clear from localStorage
        localStorage.removeItem('property-listing-storage')
        get().resetForm()
      },

      submitForm: async () => {
        set({ isLoading: true })
        try {
          const { data } = get()
          
          // Validate required fields including propertyTypeId
          if (!data.propertyType) {
            throw new Error('Property type is required')
          }
          
          if (!data.propertyTypeId) {
            console.warn('No propertyTypeId found, using fallback mapping')
          }
          
          // 🔍 CRITICAL DEBUG: Check images at the moment of submission
          console.log('🚨 FINAL SUBMISSION DEBUG:')
          console.log('Original store data images:', data.images)
          console.log('Original images count:', data.images?.length || 0)
          console.log('Store data full:', JSON.stringify(data, null, 2))
          
          // Map property data to upload format (now includes dynamic propertyTypeId)
          const uploadData = mapPropertyListingToUploadRequest(data)
          
          console.log('🚨 MAPPED UPLOAD DATA DEBUG:')
          console.log('Mapped upload data images:', uploadData.images)
          console.log('Mapped images count:', uploadData.images?.length || 0)
          console.log('Property submission data:', JSON.stringify(uploadData, null, 2))
          console.log('Submitting property with propertyTypeId:', uploadData.propertyTypeId)
          
          // Check multiple ways to get auth token
          let token = null
          
          // Try localStorage
          if (typeof window !== 'undefined') {
            token = localStorage.getItem('authToken')
          }
          
          // If no token, check if it's in a different format or location
          if (!token && typeof window !== 'undefined') {
            // Check for alternative token storage
            const authData = localStorage.getItem('auth-storage')
            if (authData) {
              try {
                const parsed = JSON.parse(authData)
                token = parsed.state?.token || parsed.token
              } catch {
                // Silent fail for parsing errors
              }
            }
          }
          
          if (!token) {
            // Redirect to login page instead of throwing an error
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
            return
          }
          
          // Upload property to backend
          await uploadProperty(uploadData, token)
          
          // Clear temporary data after successful submission
          get().clearTemporaryData()
          
        } catch (error) {
          console.error('Error submitting property listing:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'property-listing-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: any) => ({
        currentStep: state.currentStep,
        data: state.data,
        steps: state.steps,
        isDirty: state.isDirty,
      }),
    }
  )
)

export default usePropertyListingStore