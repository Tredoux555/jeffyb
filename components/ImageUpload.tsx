'use client'

import React, { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Image as ImageIcon, Camera, Package } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (file: File) => void
  onRemove?: () => void
  currentImage?: string | null
  className?: string
  disabled?: boolean
}

export function ImageUpload({ onUpload, onRemove, currentImage, className, disabled = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true)
      try {
        await onUpload(acceptedFiles[0])
      } finally {
        setIsUploading(false)
      }
    }
  }, [onUpload])
  
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }, [onUpload])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || isUploading,
    noClick: true, // Disable click on dropzone for mobile
    noKeyboard: true
  })
  
  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }
  
  return (
    <div className={className}>
      {currentImage ? (
        <div className="relative">
          <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={currentImage}
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Hidden dropzone for desktop drag & drop */}
          <div {...getRootProps()} className="hidden sm:block">
            <input {...getInputProps()} />
          </div>
          
          {/* Mobile-optimized upload area */}
          <div
            onClick={handleClick}
            className={`
              w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer
              ${disabled || isUploading 
                ? 'opacity-50 cursor-not-allowed border-gray-200' 
                : 'border-gray-300 hover:border-jeffy-yellow hover:bg-jeffy-yellow-light'
              }
            `}
          >
            {/* Hidden file input for mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
            
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              {isUploading ? (
                <div className="text-center">
                  <Package className="w-8 h-8 text-green-500 animate-[spin_3s_linear_infinite] mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:hidden" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    <span className="sm:hidden">Tap to select image</span>
                    <span className="hidden sm:inline">
                      {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="sm:hidden">or tap camera icon</span>
                    <span className="hidden sm:inline">or click to select (max 5MB)</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
