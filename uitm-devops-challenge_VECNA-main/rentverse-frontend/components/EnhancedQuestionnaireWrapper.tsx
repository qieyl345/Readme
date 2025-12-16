'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBarTop from '@/components/NavBarTop'
import NavbarStepperBottom from '@/components/NavbarStepperBottom'
import ProgressTracker from '@/components/ProgressTracker'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import useAuthStore from '@/stores/authStore'

interface EnhancedQuestionnaireWrapperProps {
  children: React.ReactNode
  showProgressTracker?: boolean
}

function EnhancedQuestionnaireWrapper({ 
  children, 
  showProgressTracker = false 
}: EnhancedQuestionnaireWrapperProps) {
  const router = useRouter()
  const [validationError, setValidationError] = useState<string | null>(null)
  const {
    currentStep,
    steps,
    nextStep,
    previousStep,
    validateCurrentStep,
    submitForm,
  } = usePropertyListingStore()
  
  const { isLoggedIn } = useAuthStore()

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const totalSteps = steps.length
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    // Clear previous validation errors
    setValidationError(null)
    
    if (validateCurrentStep()) {
      if (isLastStep) {
        handleFinish()
      } else {
        nextStep()
      }
    } else {
      // Show specific validation error based on current step
      const currentStepData = steps[currentStep]
      let errorMessage = 'Please complete all required fields before proceeding to the next step.'
      
      switch (currentStepData.id) {
        case 'property-type':
          errorMessage = 'Please select a property type to continue.'
          break
        case 'location-map':
          errorMessage = 'Please select a location on the map to continue.'
          break
        case 'location-details':
          errorMessage = 'Please fill in the state and district information.'
          break
        case 'basic-info':
          errorMessage = 'Please enter valid bedrooms, bathrooms, and area information.'
          break
        case 'photos':
          errorMessage = 'Please upload at least one property photo to continue.'
          break
        case 'title':
          errorMessage = 'Please enter a property title to continue.'
          break
        case 'description':
          errorMessage = 'Please enter a property description to continue.'
          break
        case 'legal':
          errorMessage = 'Please complete the maintenance and landlord type information.'
          break
        case 'pricing':
          errorMessage = 'Please enter a valid property price to continue.'
          break
      }
      
      console.warn('Validation failed for step:', currentStepData.id)
      setValidationError(errorMessage)
      
      // Auto-hide the error after 5 seconds
      setTimeout(() => {
        setValidationError(null)
      }, 5000)
    }
  }

  const handleBack = () => {
    setValidationError(null) // Clear errors when going back
    previousStep()
  }

  const handleFinish = async () => {
    // Check if user is logged in before submitting
    if (!isLoggedIn) {
      // Redirect to login page
      router.push('/auth/login')
      return
    }
    
    try {
      setValidationError(null)
      await submitForm()
      router.push('/property/success') // Redirect to success page
    } catch (error) {
      console.error('Failed to submit property listing:', error)
      setValidationError('Failed to submit property listing. Please try again.')
    }
  }

  return (
    <>
      <NavBarTop isQuestionnaire={true} />

      <div className="mx-auto w-full max-w-7xl min-h-screen flex pt-20 pb-32">
        {/* Progress Tracker Sidebar */}
        {showProgressTracker && (
          <div className="hidden lg:block w-80 p-6 flex-shrink-0">
            <div className="sticky top-24">
              <ProgressTracker />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex items-start justify-center ${showProgressTracker ? 'pl-6' : ''}`}>
          <div className="w-full max-w-6xl">
            {/* Validation Error Display */}
            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Validation Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {validationError}
                    </div>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setValidationError(null)}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {children}
          </div>
        </div>
      </div>

      <NavbarStepperBottom
        level={Math.ceil((currentStep + 1) / (totalSteps / 3))}
        progress={progressPercentage}
        isLastStep={isLastStep}
        isBackHidden={isFirstStep}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
      />
    </>
  )
}

export default EnhancedQuestionnaireWrapper