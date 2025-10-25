'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/Button'

interface ImageUploadProps {
  onUpload: (file: File) => void
  onRemove?: () => void
  currentImage?: string | null
  className?: string
  disabled?: boolean
}

export function ImageUpload({ onUpload, onRemove, currentImage, className, disabled = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  
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
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || isUploading
  })
  
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
        <div
          {...getRootProps()}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg transition-colors
            ${disabled || isUploading 
              ? 'opacity-50 cursor-not-allowed border-gray-200' 
              : isDragActive 
                ? 'border-jeffy-yellow bg-jeffy-yellow-light cursor-pointer' 
                : 'border-gray-300 hover:border-jeffy-yellow hover:bg-jeffy-yellow-light cursor-pointer'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jeffy-yellow mx-auto mb-2"></div>
                <p className="text-sm">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                </p>
                <p className="text-xs text-gray-400">
                  or click to select (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
