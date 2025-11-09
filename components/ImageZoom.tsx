'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface ImageZoomProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  productName?: string
}

export function ImageZoom({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose,
  productName = 'Product'
}: ImageZoomProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  // Reset zoom when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        setScale(1)
        setPosition({ x: 0, y: 0 })
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!imageRef.current) return
    e.preventDefault()
    
    const delta = e.deltaY * -0.01
    const newScale = Math.min(Math.max(1, scale + delta), 5) // Limit zoom between 1x and 5x
    
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setScale(newScale)
      // Center zoom on mouse position
      setPosition({
        x: (x - rect.width / 2) * (1 - newScale / scale),
        y: (y - rect.height / 2) * (1 - newScale / scale)
      })
    }
  }

  // Touch pinch zoom
  const touchDistance = useRef<number | null>(null)
  const touchCenter = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      touchDistance.current = distance
      touchCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance.current && touchCenter.current) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      const newScale = Math.min(Math.max(1, (distance / touchDistance.current) * scale), 5)
      setScale(newScale)
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }

  const handleTouchEnd = () => {
    touchDistance.current = null
    touchCenter.current = null
    setIsDragging(false)
  }

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  if (!isOpen || images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
        aria-label="Close zoom"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setScale((prev) => Math.min(prev + 0.5, 5))
          }}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setScale((prev) => Math.max(prev - 0.5, 1))
          }}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            resetZoom()
          }}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
          aria-label="Reset zoom"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Image Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              resetZoom()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              resetZoom()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Zoomed Image */}
      <div
        ref={imageRef}
        className="relative w-full h-full flex items-center justify-center cursor-move"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          className="relative max-w-[90vw] max-h-[90vh]"
        >
          <Image
            src={images[currentIndex]}
            alt={`${productName} - Image ${currentIndex + 1}`}
            width={1200}
            height={1200}
            className="object-contain"
            quality={100}
            priority
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex gap-2 max-w-[90vw] overflow-x-auto px-4 pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
                resetZoom()
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index
                  ? 'border-white scale-110'
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

