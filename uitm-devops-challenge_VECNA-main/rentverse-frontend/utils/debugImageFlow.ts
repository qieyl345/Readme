/**
 * Image Upload Flow Debugger
 * Comprehensive debugging to identify where images get lost in the upload process
 */

import { usePropertyListingStore } from '@/stores/propertyListingStore'
import { uploadImages } from '@/utils/uploadService'
import { uploadProperty, mapPropertyListingToUploadRequest } from '@/utils/propertyUploadApi'

interface DebugStep {
  step: string
  timestamp: string
  data: any
  status: 'success' | 'error' | 'warning'
}

class ImageFlowDebugger {
  private debugSteps: DebugStep[] = []

  private addStep(step: string, data: any, status: DebugStep['status'] = 'success') {
    const debugStep: DebugStep = {
      step,
      timestamp: new Date().toISOString(),
      data,
      status
    }
    this.debugSteps.push(debugStep)
    console.log(`🔍 [${step}]`, data)
  }

  async testCompleteImageFlow() {
    console.log('🚀 STARTING COMPREHENSIVE IMAGE FLOW DEBUG')
    console.log('==========================================\n')

    this.debugSteps = []

    try {
      // Step 1: Check store state
      this.addStep('STORE_INITIAL', {
        storeData: usePropertyListingStore.getState().data,
        images: usePropertyListingStore.getState().data.images,
        imagesCount: usePropertyListingStore.getState().data.images?.length || 0
      })

      // Step 2: Simulate image upload (if we have files)
      const testImageUrl = 'https://res.cloudinary.com/dqhuvu22u/image/upload/v1758183655/rentverse-base/logo-nav_j8pl7d.png'
      
      // Update store with test images
      usePropertyListingStore.getState().updateData({
        images: [testImageUrl, testImageUrl, testImageUrl]
      })

      this.addStep('STORE_UPDATED', {
        newImages: usePropertyListingStore.getState().data.images,
        newImagesCount: usePropertyListingStore.getState().data.images?.length || 0
      })

      // Step 3: Test mapping function
      const storeData = usePropertyListingStore.getState().data
      const mappedData = mapPropertyListingToUploadRequest(storeData)

      this.addStep('DATA_MAPPED', {
        originalImages: storeData.images,
        mappedImages: mappedData.images,
        mappingSuccess: Array.isArray(mappedData.images) && mappedData.images.length > 0
      })

      // Step 4: Test if we can simulate upload (without actually uploading)
      try {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        this.addStep('FILE_CREATED', {
          fileName: mockFile.name,
          fileSize: mockFile.size,
          fileType: mockFile.type
        })
      } catch (error) {
        this.addStep('FILE_CREATION_FAILED', { error: error instanceof Error ? error.message : String(error) }, 'error')
      }

      // Step 5: Check if auth token exists
      let authToken = null
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
      }

      this.addStep('AUTH_CHECK', {
        hasToken: !!authToken,
        tokenPreview: authToken ? authToken.substring(0, 20) + '...' : null
      })

      // Generate summary
      this.generateSummary()

    } catch (error) {
      this.addStep('GENERAL_ERROR', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'error')
      this.generateSummary()
    }
  }

  private generateSummary() {
    console.log('\n📋 IMAGE FLOW DEBUG SUMMARY')
    console.log('===========================')

    const successfulSteps = this.debugSteps.filter(s => s.status === 'success')
    const errorSteps = this.debugSteps.filter(s => s.status === 'error')
    const warningSteps = this.debugSteps.filter(s => s.status === 'warning')

    console.log(`✅ Successful steps: ${successfulSteps.length}`)
    console.log(`⚠️ Warning steps: ${warningSteps.length}`)
    console.log(`❌ Error steps: ${errorSteps.length}`)

    console.log('\n📊 DETAILED RESULTS:')
    this.debugSteps.forEach((step, index) => {
      const icon = step.status === 'success' ? '✅' : step.status === 'warning' ? '⚠️' : '❌'
      console.log(`${index + 1}. ${icon} ${step.step}`)
      console.log(`   Data:`, JSON.stringify(step.data, null, 2))
    })

    // Identify potential issues
    console.log('\n🔍 POTENTIAL ISSUES IDENTIFIED:')
    const issues = this.identifyIssues()
    issues.forEach(issue => {
      console.log(`❌ ${issue}`)
    })

    if (issues.length === 0) {
      console.log('✅ No obvious issues found in the data flow')
      console.log('🔍 The issue might be in:')
      console.log('   1. Actual file upload to Cloudinary')
      console.log('   2. Backend API communication')
      console.log('   3. Database storage')
      console.log('   4. Frontend state management timing')
    }

    console.log('\n🎯 RECOMMENDED NEXT STEPS:')
    this.recommendNextSteps()
  }

  private identifyIssues(): string[] {
    const issues: string[] = []

    // Check for missing images in store
    const storeStep = this.debugSteps.find(s => s.step === 'STORE_INITIAL')
    if (storeStep && (!storeStep.data.images || storeStep.data.images.length === 0)) {
      issues.push('No images found in store initially')
    }

    // Check for mapping issues
    const mappedStep = this.debugSteps.find(s => s.step === 'DATA_MAPPED')
    if (mappedStep && !mappedStep.data.mappingSuccess) {
      issues.push('Image mapping failed - images not properly transferred to upload request')
    }

    // Check for auth issues
    const authStep = this.debugSteps.find(s => s.step === 'AUTH_CHECK')
    if (authStep && !authStep.data.hasToken) {
      issues.push('No authentication token found - uploads will fail')
    }

    return issues
  }

  private recommendNextSteps() {
    console.log('1. 🔧 Test actual file upload to Cloudinary')
    console.log('2. 🌐 Check network requests in browser dev tools')
    console.log('3. 🗄️ Verify backend is receiving image data correctly')
    console.log('4. 📊 Check database directly for stored images')
    console.log('5. ⏱️ Add timing checks for async operations')
  }

  // Method to test actual image upload
  async testActualImageUpload(imageUrls: string[]) {
    console.log('\n🧪 TESTING ACTUAL IMAGE UPLOAD')
    console.log('===============================')

    try {
      // Test if we can create a file from URL
      for (const url of imageUrls) {
        console.log(`Testing URL: ${url}`)
        
        // Check if URL is accessible
        const response = await fetch(url, { method: 'HEAD' })
        console.log(`URL status: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
          console.log(`❌ Image URL not accessible: ${url}`)
          continue
        }
        
        console.log(`✅ Image URL accessible: ${url}`)
      }
    } catch (error) {
      console.error('❌ Image upload test failed:', error)
    }
  }
}

// Export singleton instance
export const imageFlowDebugger = new ImageFlowDebugger()

// Hook for React components
export function useImageFlowDebug() {
  return {
    testImageFlow: () => imageFlowDebugger.testCompleteImageFlow(),
    testImageUpload: (urls: string[]) => imageFlowDebugger.testActualImageUpload(urls)
  }
}