'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ImageOff, Loader2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string | undefined | null
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  showLoader?: boolean
  fallback?: React.ReactNode
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
  onError?: () => void
}

// Generate a tiny placeholder blur data URL
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f5f5f5" offset="20%" />
      <stop stop-color="#e5e5e5" offset="50%" />
      <stop stop-color="#f5f5f5" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f5f5f5" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const generateBlurPlaceholder = (width: number = 700, height: number = 475) =>
  `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  containerClassName = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  showLoader = true,
  fallback,
  objectFit = 'cover',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Validate and set image source
  useEffect(() => {
    if (!src || src === '' || src === 'undefined' || src === 'null') {
      setHasError(true)
      setIsLoading(false)
    } else {
      setImageSrc(src)
      setHasError(false)
      setIsLoading(true)
    }
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  // Fallback UI when image fails to load or no src provided
  if (hasError || !imageSrc) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${containerClassName}`}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center p-4">
          <ImageOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <span className="text-xs text-gray-400">No image</span>
        </div>
      </div>
    )
  }

  // Generate blur placeholder
  const blurURL = blurDataURL || generateBlurPlaceholder(width || 700, height || 475)

  // Image with loading state
  const imageElement = (
    <>
      {/* Loading spinner overlay */}
      {showLoader && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        {...(fill ? { fill: true } : { width, height })}
        className={`
          ${className}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
        style={fill ? { objectFit } : undefined}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurURL}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? undefined : 'lazy'}
      />
    </>
  )

  // If using fill, wrap in a container with full dimensions
  if (fill) {
    return (
      <div className={`relative overflow-hidden w-full h-full ${containerClassName}`}>
        {imageElement}
      </div>
    )
  }

  return <div className={`relative ${containerClassName}`}>{imageElement}</div>
}

// Simplified version for avatar/profile images
export function Avatar({
  src,
  alt,
  size = 40,
  className = '',
  fallbackText
}: {
  src?: string | null
  alt: string
  size?: number
  className?: string
  fallbackText?: string
}) {
  const [hasError, setHasError] = useState(false)

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
          {fallbackText?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${size}px`}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

// Product thumbnail with specific optimizations
export function ProductThumbnail({
  src,
  alt,
  className = '',
  priority = false
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
      containerClassName="w-full h-full"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      quality={75}
      priority={priority}
      showLoader
    />
  )
}

// Gallery image with zoom support
export function GalleryImage({
  src,
  alt,
  isActive = false,
  onClick,
  className = ''
}: {
  src?: string | null
  alt: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border-2 transition-all
        ${isActive ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        containerClassName="w-full h-full"
        sizes="100px"
        quality={60}
        showLoader={false}
      />
    </button>
  )
}

