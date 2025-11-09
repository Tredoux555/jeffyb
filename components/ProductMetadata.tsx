'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface ProductMetadataProps {
  title: string
  description: string
  image?: string
  url: string
}

export function ProductMetadata({ title, description, image, url }: ProductMetadataProps) {
  const pathname = usePathname()
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const imageUrl = image ? (image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : ''}${image}`) : ''

  useEffect(() => {
    // Remove existing meta tags
    const existingTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')
    existingTags.forEach(tag => tag.remove())

    // Create and add Open Graph tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'product' },
      { property: 'og:url', content: fullUrl },
      ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
    ]

    // Create and add Twitter tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    ]

    ogTags.forEach(tag => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', tag.property)
      meta.setAttribute('content', tag.content)
      document.head.appendChild(meta)
    })

    twitterTags.forEach(tag => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', tag.name)
      meta.setAttribute('content', tag.content)
      document.head.appendChild(meta)
    })

    // Update page title
    document.title = `${title} - Jeffy`

    return () => {
      // Cleanup on unmount
      const tagsToRemove = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')
      tagsToRemove.forEach(tag => tag.remove())
    }
  }, [title, description, imageUrl, fullUrl])

  return null
}

