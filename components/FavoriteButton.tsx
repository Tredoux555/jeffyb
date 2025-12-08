'use client'

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { toggleFavorite, isFavorited as checkFavorited } from '@/lib/favorites'
import { Button } from './Button'

interface FavoriteButtonProps {
  productId: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onToggle?: (isFavorited: boolean) => void
}

export function FavoriteButton({ productId, size = 'md', showText = false, onToggle }: FavoriteButtonProps) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    checkFavoriteStatus()
  }, [user, productId])

  const checkFavoriteStatus = async () => {
    if (!user) {
      setIsFavorited(false)
      setChecking(false)
      return
    }

    try {
      setChecking(true)
      const favorited = await checkFavorited(user.id, productId)
      setIsFavorited(favorited)
    } catch (error: any) {
      // Silently handle auth/RLS errors - these are expected when not logged in
      const status = error?.status || error?.code
      if (status !== 406 && status !== 401 && error?.code !== 'PGRST301') {
        console.error('Error checking favorite status:', error)
      }
      setIsFavorited(false)
    } finally {
      setChecking(false)
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Could redirect to login or show a message
      return
    }

    if (loading || checking) return

    try {
      setLoading(true)
      const newStatus = await toggleFavorite(user.id, productId)
      setIsFavorited(newStatus)
      if (onToggle) {
        onToggle(newStatus)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Error updating favorite')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (!user) {
    // Show outline heart for non-logged-in users
    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Could show login prompt
        }}
        className={`${sizeClasses[size]} rounded-full bg-white/90 hover:bg-white border border-gray-300 flex items-center justify-center transition-colors`}
        aria-label="Add to favorites (login required)"
      >
        <Heart className={`${iconSizes[size]} text-gray-400`} />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || checking}
      className={`${sizeClasses[size]} rounded-full bg-white/90 hover:bg-white border ${
        isFavorited ? 'border-pink-300' : 'border-gray-300'
      } flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${iconSizes[size]} transition-all ${
          isFavorited
            ? 'text-pink-500 fill-pink-500'
            : 'text-gray-400'
        } ${loading ? 'animate-pulse' : ''}`}
      />
    </button>
  )
}
