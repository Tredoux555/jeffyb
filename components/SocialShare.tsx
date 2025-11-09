'use client'

import React from 'react'
import { Facebook, Instagram, MessageCircle, Share2, Copy, CheckCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config/social-media'
import { useState } from 'react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  image?: string
  className?: string
}

export function SocialShare({ url, title, description, image, className }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareData = {
    title,
    text: description || title,
    url: fullUrl,
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
  const whatsappUrl = getWhatsAppUrl(`${title} - ${fullUrl}`)

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ''}`}>
      <span className="text-sm font-medium text-gray-700">Share:</span>
      
      {/* Facebook */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      {/* Native Share (mobile) */}
      {typeof window !== 'undefined' && 'share' in navigator && (
        <button
          onClick={async () => {
            try {
              await navigator.share(shareData)
            } catch (error) {
              console.error('Error sharing:', error)
            }
          }}
          className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? (
          <CheckCircle className="w-5 h-5 text-green-200" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}

