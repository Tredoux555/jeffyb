'use client'

import { useEffect } from 'react'

interface ProductMetadataProps {
  title: string
  description: string
  image?: string
  url: string
  price?: number
  currency?: string
  stock?: number
  category?: string
  brand?: string
  sku?: string
  seoTitle?: string
  metaDescription?: string
}

export function ProductMetadata({ 
  title, 
  description, 
  image, 
  url,
  price,
  currency = 'ZAR',
  stock,
  category,
  brand,
  sku,
  seoTitle,
  metaDescription
}: ProductMetadataProps) {
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const imageUrl = image ? (image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : ''}${image}`) : ''
  
  // Use SEO-optimized values if available
  const pageTitle = seoTitle || `${title} - Premium ${category || 'Product'} | Jeffy Store`
  const pageDescription = metaDescription || description?.slice(0, 160)

  useEffect(() => {
    // Remove existing meta tags and structured data
    const existingTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]')
    existingTags.forEach(tag => tag.remove())

    // Create and add Open Graph tags
    const ogTags = [
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:type', content: 'product' },
      { property: 'og:url', content: fullUrl },
      { property: 'og:site_name', content: 'Jeffy Store' },
      ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
      ...(price ? [{ property: 'product:price:amount', content: price.toString() }] : []),
      ...(currency ? [{ property: 'product:price:currency', content: currency }] : []),
    ]

    // Create and add Twitter tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: pageDescription },
      ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    ]

    // Add meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', pageDescription)

    // Add OG tags
    ogTags.forEach(tag => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', tag.property)
      meta.setAttribute('content', tag.content)
      document.head.appendChild(meta)
    })

    // Add Twitter tags
    twitterTags.forEach(tag => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', tag.name)
      meta.setAttribute('content', tag.content)
      document.head.appendChild(meta)
    })

    // Add JSON-LD structured data for products
    if (price) {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description: description,
        image: imageUrl ? [imageUrl] : [],
        offers: {
          '@type': 'Offer',
          price: price,
          priceCurrency: currency,
          availability: stock && stock > 0 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Jeffy Store'
          },
          url: fullUrl
        },
        ...(category && { category }),
        ...(brand && { 
          brand: {
            '@type': 'Brand',
            name: brand
          }
        }),
        ...(sku && { sku })
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(structuredData)
      document.head.appendChild(script)
    }

    // Update page title
    document.title = pageTitle

    return () => {
      // Cleanup on unmount
      const tagsToRemove = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]')
      tagsToRemove.forEach(tag => tag.remove())
    }
  }, [title, description, pageTitle, pageDescription, imageUrl, fullUrl, price, currency, stock, category, brand, sku])

  return null
}

