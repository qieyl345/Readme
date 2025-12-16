'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Plus, Upload, AlertCircle, Camera } from 'lucide-react'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import { uploadImages, validateImageFiles } from '@/utils/uploadService'

interface PhotoFile {
  id: string
  file: File
  preview: string
  uploaded?: boolean
  uploadUrl?: string
  isUploading?: boolean
  error?: string
}

function AddListingStepTwoPhotosOptimized() {
  const { data, updateData } = usePropertyListingStore()
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoFile[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Effect to load existing images from the store when the component mounts
  useEffect(() => {
    if (data.images && data.images.length > 0 && selectedPhotos.length === 0) {
      const existingPhotos: PhotoFile[] = data.images.map((url, index) => ({
        id: `existing-${index}`,
        file: new File([], `image-${index}.jpg`), 
        preview: url,
        uploaded: true,
        uploadUrl: url,
      }))
      setSelectedPhotos(existingPhotos)
    }
  }, [data.images])

  const handleBrowseFiles = () => {
    fileInputRef.current?.click()
  }

  // Centralized upload logic
  const handleUpload = useCallback(async (filesToUpload: PhotoFile[]) => {
    if (filesToUpload.length === 0) return

    setIsUploading(true)

    // Mark files as 'uploading' in the UI
    setSelectedPhotos(prev =>
      prev.map(p => {
        const isFileToUpload = filesToUpload.some(f => f.id === p.id)
        return isFileToUpload ? { ...p, isUploading: true, error: undefined } : p
      })
    )

    try {
      const result = await uploadImages(
        filesToUpload.map(p => p.file),
        {
          optimize: true,
          onProgress: progress => {
            // Update individual photo status based on progress
            setSelectedPhotos(prev =>
              prev.map(photo => {
                const progressItem = progress.find(p => p.file === photo.file)
                if (progressItem) {
                  return {
                    ...photo,
                    isUploading: progressItem.status === 'uploading',
                    uploaded: progressItem.status === 'completed',
                    uploadUrl: progressItem.result?.data.url,
                    error: progressItem.error,
                  }
                }
                return photo
              })
            )
          },
        }
      )

      if (result.success) {
        // Update the global store with the complete list of uploaded images
        const newlyUploadedUrls = result.data
          .filter(uploadResult => uploadResult.success)
          .map(uploadResult => uploadResult.data.url)

        const existingUrls = selectedPhotos
          .filter(photo => photo.uploaded && photo.uploadUrl)
          .map(photo => photo.uploadUrl!)
        
        const allImageUrls = [...existingUrls, ...newlyUploadedUrls]
        updateData({ images: allImageUrls })

      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.'
      setValidationErrors(prev => [...prev, errorMessage])
      // Mark the failed files with an error message
      setSelectedPhotos(prev => 
        prev.map(p => {
          if (filesToUpload.some(f => f.id === p.id)) {
            return { ...p, isUploading: false, error: 'Upload failed' }
          }
          return p
        })
      )
    } finally {
      setIsUploading(false)
    }
  }, [selectedPhotos, updateData])

  // Handles file selection from input or drag-and-drop
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const { valid, invalid } = validateImageFiles(fileArray)

    if (invalid.length > 0) {
      const errors = invalid.map(item => `${item.file.name}: ${item.reason}`)
      setValidationErrors(errors)
    } else {
      setValidationErrors([])
    }

    if (valid.length > 0) {
      const newPhotos: PhotoFile[] = valid.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file),
        uploaded: false,
        isUploading: false,
      }))

      setSelectedPhotos(prev => [...prev, ...newPhotos])
      setShowPreviewModal(true)
      
      // Automatically trigger the upload
      handleUpload(newPhotos)
    }
  }, [handleUpload])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files)
  }

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e)
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotos(prev => {
      const photoToRemove = prev.find(photo => photo.id === photoId)
      const updatedPhotos = prev.filter(photo => photo.id !== photoId)

      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview)
        
        if (photoToRemove.uploaded && photoToRemove.uploadUrl) {
          const remainingUrls = updatedPhotos
            .filter(p => p.uploaded && p.uploadUrl)
            .map(p => p.uploadUrl!)
          updateData({ images: remainingUrls })
        }
      }
      return updatedPhotos
    })
  }

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false)
  }
  
  const handleAddMorePhotos = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Showcase your property
            </h2>
            <p className="mt-2 text-base sm:text-lg text-slate-600">
              Upload at least 5 photos. High-quality images attract more interest.
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Photo Grid & Upload Area */}
          <div 
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${selectedPhotos.length > 0 ? 'mb-6' : ''}`}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
          >
            {selectedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group aspect-square">
                <Image
                  src={photo.preview}
                  alt={`Selected photo ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover rounded-xl"
                />
                
                {/* Overlays for status */}
                {photo.isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-xl">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-sm mt-2">Uploading...</span>
                  </div>
                )}
                {photo.uploaded && !photo.isUploading && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                )}
                {photo.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex flex-col items-center justify-center text-white p-2 text-center rounded-xl">
                    <AlertCircle size={24} />
                    <span className="text-xs font-semibold mt-1">{photo.error}</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 z-10"
                  disabled={photo.isUploading}
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {/* Dropzone / Upload Button */}
            <div
              className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 transition-all duration-300 cursor-pointer
                ${isDragging ? 'border-slate-500 bg-slate-100' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`
              }
              onClick={handleBrowseFiles}
              onDragLeave={handleDragEvents}
              onDrop={handleDrop}
            >
              <Camera size={40} className="text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">Add Photos</p>
              <p className="text-sm text-slate-500">or drag & drop</p>
            </div>
          </div>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Summary and action button if needed */}
          {selectedPhotos.length > 0 && (
            <div className="text-center mt-6">
              <p className="text-slate-600 text-lg">
                {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} added.
              </p>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="mt-2 text-slate-900 font-semibold hover:text-slate-700 transition-colors"
              >
                Manage Photos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Management Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClosePreviewModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Manage Your Photos</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddMorePhotos}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm"
                  title="Add more photos"
                >
                  <Plus size={16} /> Add More
                </button>
                <button onClick={handleClosePreviewModal} className="p-2 text-slate-500 hover:text-slate-800"><X size={20} /></button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group aspect-square">
                    <Image
                      src={photo.preview}
                      alt={`Photo preview ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-xl shadow-sm"
                    />
                    
                    {photo.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center rounded-xl">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {photo.uploaded && !photo.isUploading && (
                       <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                      </div>
                    )}
                    {photo.error && (
                      <div className="absolute inset-0 bg-red-600 bg-opacity-80 flex flex-col items-center justify-center text-white p-2 text-center rounded-xl">
                        <AlertCircle size={24} />
                        <span className="text-xs font-semibold mt-1">Failed</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 focus:outline-none z-10"
                      disabled={photo.isUploading}
                      aria-label="Remove photo"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5 rounded-b-xl">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
              {selectedPhotos.length === 0 && (
                 <div className="text-center py-16">
                    <p className="text-slate-500">No photos have been added yet.</p>
                 </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-5 border-t border-slate-200">
               <button
                onClick={handleClosePreviewModal}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors disabled:bg-slate-400"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddListingStepTwoPhotosOptimized