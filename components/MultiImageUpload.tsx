'use client'

import React, { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Camera, Plus } from 'lucide-react'
import { Button } from '@/components/Button'

interface MultiImageUploadProps {
  onUpload: (files: File[]) => Promise<void>
  onRemove: (index: number) => void
  currentImages: string[]
  className?: string
  disabled?: boolean
  maxFiles?: number
}

export function MultiImageUpload({ 
  onUpload, 
  onRemove, 
  currentImages, 
  className, 
  disabled = false,
  maxFiles = 10 
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true)
 направленный
      try {
        await onUpload(acceptedFiles)
      } finally {
        setIsUploading(false)
      }
    }
  }, [onUpload])
  
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setIsUploading(true)
      try {
        await onUpload(files)
      } finally {
        setIsUploading(false)
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
    maxFiles: maxFiles - currentImages.length,
    maxSize: 5 * 1024 * 1024,
    disabled: disabled || isUploading || currentImages.length >= maxFiles,
    noClick: true,
    noKeyboard: true
  })
  
  const handleClick = () => {
    if (!disabled && !isUploading && currentImages.length < maxFiles) {
      fileInputRef.current?.click()
    }
  }
  
  const canAddMore = currentImages.length < maxFiles && !disabled && !isUploading
  
  return (
    <div className={className}>
      {/* Image Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Product image ${index + 1}`}
                className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          onClick={handleClick}
          className={`w-full h-32 sm:h-40 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${isDragActive ? 'border-jeffy-yellow bg-jeffy-yellow-light' : disabled || isUploading ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-jeffy-yellow hover:bg-jeffy-yellow-light'}`}
        >
          {/* Dropzone input */}
          <input {...getInputProps()} className="hidden" />
          
          {/* Hidden file input for mobile fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jeffy-yellow mx-auto mb-2"></div>
                <p className="text-sm">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                  <Camera className="w-4 h-4 sm:w-6 sm:h-6 ml-2 sm:hidden" />
                  <Plus className="w-4 h-4 sm:w-6 sm:h-6 ml-1 text-jeffy-yellow" />
                </div>
                <p className="text-sm font-medium mb-1">
                  <span className="sm:hidden">Tap to add images</span>
                  <span className="hidden sm:inline">
                    {isDragActive ? 'Drop images here' : 'Drag & drop images'}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  <span className="sm:hidden">or tap camera icon</span>
                  <span className="hidden sm:inline">or click to select (max {maxFiles} images)</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {currentImages.length}/{maxFiles} images
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Upload disabled message */}
      {!canAddMore && !isUploading && (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">
            {currentImages.length >= maxFiles 
              ? `Maximum ${maxFiles} images reached`
              : 'Upload disabled'
            }
          </p>
        </div>
      )}
    </div>
  )
}
