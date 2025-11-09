'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config/social-media'
import { usePathname } from 'next/navigation'

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Hide on admin pages and coming soon page
    if (pathname?.startsWith('/admin') || pathname === '/coming-soon') {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }
  }, [pathname])

  if (!isVisible) return null

  const whatsappUrl = getWhatsAppUrl('Hi! I have a question about Jeffy products.')

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Chat with us!
      </span>
    </a>
  )
}

