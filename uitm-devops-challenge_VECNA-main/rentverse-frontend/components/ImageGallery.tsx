import Image from 'next/image'
import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
}

function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})
  
  // Debug logging
  console.log('🖼️ ImageGallery received images:', images)
  console.log('🖼️ Images length:', images?.length)
  
  // Ensure we have at least one image
  if (!images || images.length === 0) {
    console.log('⚠️ No images provided to ImageGallery')
    return (
      <div className="w-full max-w-7xl mx-auto h-96 bg-slate-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📷</div>
          <span className="text-slate-500">No images available</span>
          <p className="text-xs text-slate-400 mt-2">Property has no uploaded images</p>
        </div>
      </div>
    )
  }

  // Filter out empty or invalid images
  const validImages = images.filter((image, index) => {
    if (!image || image.trim() === '') {
      console.warn(`⚠️ Image at index ${index} is empty or invalid:`, image)
      return false
    }
    return true
  })

  console.log('✅ Valid images after filtering:', validImages)

  if (validImages.length === 0) {
    console.log('⚠️ No valid images after filtering')
    return (
      <div className="w-full max-w-7xl mx-auto h-96 bg-slate-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <span className="text-slate-500">Invalid images</span>
          <p className="text-xs text-slate-400 mt-2">Property images are not properly formatted</p>
        </div>
      </div>
    )
  }

  // Handle image load error
  const handleImageError = (index: number) => {
    console.error(`❌ Image failed to load at index ${index}:`, validImages[index])
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  // Handle image load success
  const handleImageLoad = (index: number) => {
    console.log(`✅ Image loaded successfully at index ${index}:`, validImages[index])
  }

  // Take only the first 5 images and pad with the first image if needed
  const displayImages = [...validImages.slice(0, 5)]
  while (displayImages.length < 5) {
    displayImages.push(validImages[0])
  }

  const [mainImage, ...gridImages] = displayImages

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Main image carousel */}
      <div className="relative h-96 mb-4 rounded-lg overflow-hidden bg-slate-100">
        {!imageErrors[currentIndex] ? (
          <Image
            src={validImages[currentIndex]}
            alt={`Property image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority
            onError={() => handleImageError(currentIndex)}
            onLoad={() => handleImageLoad(currentIndex)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-slate-500">Image failed to load</p>
              <p className="text-xs text-slate-400 mt-1 break-all">
                {validImages[currentIndex]}
              </p>
            </div>
          </div>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
        
        {/* Navigation arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail grid */}
      {validImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {validImages.slice(0, 5).map((image, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                index === currentIndex ? 'ring-2 ring-teal-500' : 'hover:opacity-80'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {!imageErrors[index] ? (
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  onLoad={() => handleImageLoad(index)}
                  sizes="(max-width: 768px) 20vw, 200px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">❌</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs">
          <p className="font-medium">Debug Info:</p>
          <p>Total images: {images.length}</p>
          <p>Valid images: {validImages.length}</p>
          <p>Current index: {currentIndex}</p>
          <div className="mt-2">
            <p className="font-medium">Image URLs:</p>
            {validImages.slice(0, 3).map((url, i) => (
              <p key={i} className="break-all text-slate-600">
                {i + 1}. {url}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
