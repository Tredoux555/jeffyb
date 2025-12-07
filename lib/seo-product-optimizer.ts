/**
 * SEO Product Optimizer
 * 
 * Utility class to generate SEO-optimized product descriptions,
 * titles, and metadata for better search engine visibility.
 */

interface ProductSEOData {
  name: string
  category: string
  price: number
  features?: string[]
  benefits?: string[]
  targetKeywords?: string[]
  brand?: string
}

interface SEOOutput {
  description: string
  seoTitle: string
  metaDescription: string
  keywords: string[]
}

// Category-specific templates for more natural descriptions
const CATEGORY_TEMPLATES: Record<string, {
  adjectives: string[]
  verbs: string[]
  benefits: string[]
}> = {
  gym: {
    adjectives: ['durable', 'professional-grade', 'ergonomic', 'high-performance'],
    verbs: ['enhance', 'maximize', 'boost', 'improve'],
    benefits: ['better workouts', 'improved performance', 'maximum comfort', 'lasting durability']
  },
  camping: {
    adjectives: ['rugged', 'portable', 'weather-resistant', 'lightweight'],
    verbs: ['explore', 'adventure', 'discover', 'conquer'],
    benefits: ['outdoor adventures', 'reliable protection', 'easy setup', 'compact storage']
  },
  kitchen: {
    adjectives: ['premium', 'versatile', 'easy-to-clean', 'chef-quality'],
    verbs: ['cook', 'create', 'prepare', 'enjoy'],
    benefits: ['delicious meals', 'effortless cooking', 'professional results', 'time savings']
  },
  beauty: {
    adjectives: ['luxurious', 'gentle', 'nourishing', 'radiance-boosting'],
    verbs: ['transform', 'rejuvenate', 'revitalize', 'enhance'],
    benefits: ['glowing skin', 'natural beauty', 'lasting freshness', 'confidence boost']
  },
  'baby-toys': {
    adjectives: ['safe', 'educational', 'colorful', 'engaging'],
    verbs: ['stimulate', 'encourage', 'develop', 'inspire'],
    benefits: ['child development', 'hours of fun', 'learning through play', 'safe entertainment']
  },
  archery: {
    adjectives: ['precision', 'professional', 'tournament-ready', 'balanced'],
    verbs: ['aim', 'shoot', 'compete', 'master'],
    benefits: ['improved accuracy', 'consistent performance', 'competitive edge', 'skill development']
  },
  'car-care': {
    adjectives: ['powerful', 'professional-grade', 'fast-acting', 'protective'],
    verbs: ['clean', 'protect', 'restore', 'maintain'],
    benefits: ['showroom shine', 'long-lasting protection', 'easy application', 'professional results']
  }
}

export class ProductSEOOptimizer {
  /**
   * Generate a complete SEO-optimized description for a product
   */
  static generateDescription(product: ProductSEOData): string {
    const { name, category, price, brand } = product
    // Handle null/undefined arrays safely
    const features = product.features || []
    const benefits = product.benefits || []
    const categoryLower = (category || 'general').toLowerCase()
    const template = CATEGORY_TEMPLATES[categoryLower] || CATEGORY_TEMPLATES.gym
    
    const sections: string[] = []
    
    // Opening hook with primary keyword
    const brandPrefix = brand ? `${brand} ` : ''
    const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)]
    sections.push(
      `Discover the ${brandPrefix}${name} - a ${adjective} ${categoryLower} essential designed to elevate your experience.`
    )
    
    // Features section
    if (features.length > 0) {
      const featureList = features.slice(0, 4).join(', ')
      sections.push(`Featuring ${featureList}, this product delivers exceptional quality and performance.`)
    } else {
      sections.push(`Crafted with premium materials and attention to detail for outstanding quality.`)
    }
    
    // Benefits section
    if (benefits.length > 0) {
      const benefitList = benefits.slice(0, 3).join(', ')
      sections.push(`Experience ${benefitList} with every use.`)
    } else {
      const defaultBenefit = template.benefits[Math.floor(Math.random() * template.benefits.length)]
      sections.push(`Enjoy ${defaultBenefit} and exceptional value.`)
    }
    
    // Value proposition
    if (price < 100) {
      sections.push(`At just R${price.toFixed(2)}, you get premium quality at an affordable price.`)
    } else if (price < 500) {
      sections.push(`Invest in quality with this R${price.toFixed(2)} ${categoryLower} essential.`)
    } else {
      sections.push(`This premium R${price.toFixed(2)} product represents the best in ${categoryLower} quality.`)
    }
    
    // Call to action
    sections.push(`Order now and enjoy fast delivery across South Africa!`)
    
    return sections.join(' ')
  }

  /**
   * Generate an SEO-optimized page title
   */
  static generateSEOTitle(productName: string, category: string): string {
    const safeName = productName || 'Product'
    const safeCategory = category || 'General'
    const categoryCapitalized = safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1).toLowerCase()
    return `${safeName} - Premium ${categoryCapitalized} | Jeffy Store South Africa`
  }

  /**
   * Generate a meta description (max 160 characters recommended)
   */
  static generateMetaDescription(productName: string, category: string, price: number): string {
    const safeName = productName || 'Product'
    const safeCategory = category || 'item'
    const safePrice = price || 0
    const desc = `Shop ${safeName} ${safeCategory.toLowerCase()} for R${safePrice.toFixed(2)}. Free shipping on orders over R500. Premium quality, fast SA delivery!`
    // Truncate if too long
    if (desc.length > 160) {
      return desc.substring(0, 157) + '...'
    }
    return desc
  }

  /**
   * Generate a complete SEO output object
   */
  static generateComplete(product: ProductSEOData): SEOOutput {
    return {
      description: this.generateDescription(product),
      seoTitle: this.generateSEOTitle(product.name, product.category),
      metaDescription: this.generateMetaDescription(product.name, product.category, product.price),
      keywords: this.extractKeywords(product)
    }
  }

  /**
   * Extract relevant keywords from product data
   */
  static extractKeywords(product: ProductSEOData): string[] {
    const keywords: Set<string> = new Set()
    
    // Add product name words (handle null safely)
    if (product.name) {
      product.name.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word)
      })
    }
    
    // Add category (handle null safely)
    if (product.category) {
      keywords.add(product.category.toLowerCase())
    }
    
    // Add brand if present
    if (product.brand) {
      keywords.add(product.brand.toLowerCase())
    }
    
    // Add features as keywords (handle null safely)
    const features = product.features || []
    features.forEach(feature => {
      if (feature) {
        feature.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 3) keywords.add(word)
        })
      }
    })
    
    // Add target keywords (handle null safely)
    const targetKeywords = product.targetKeywords || []
    targetKeywords.forEach(keyword => {
      if (keyword) {
        keywords.add(keyword.toLowerCase())
      }
    })
    
    // Add common e-commerce keywords
    keywords.add('buy')
    keywords.add('shop')
    keywords.add('south africa')
    keywords.add('online')
    keywords.add('delivery')
    
    return Array.from(keywords).slice(0, 20)
  }

  /**
   * Generate structured data (JSON-LD) for a product
   */
  static generateStructuredData(product: {
    name: string
    description: string
    price: number
    currency?: string
    images?: string[]
    sku?: string
    brand?: string
    category?: string
    stock?: number
    rating?: number
    reviewCount?: number
  }): object {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'ZAR',
        availability: product.stock && product.stock > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Jeffy Store'
        }
      }
    }

    if (product.images && product.images.length > 0) {
      structuredData.image = product.images
    }

    if (product.sku) {
      structuredData.sku = product.sku
    }

    if (product.brand) {
      structuredData.brand = {
        '@type': 'Brand',
        name: product.brand
      }
    }

    if (product.category) {
      structuredData.category = product.category
    }

    if (product.rating && product.reviewCount) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount
      }
    }

    return structuredData
  }

  /**
   * Validate and improve an existing description
   */
  static improveDescription(existingDescription: string, product: ProductSEOData): string {
    // If existing description is short or generic, generate a new one
    if (!existingDescription || existingDescription.length < 100) {
      return this.generateDescription(product)
    }

    // Check if description mentions product name
    if (!existingDescription.toLowerCase().includes(product.name.toLowerCase())) {
      return `${product.name}: ${existingDescription}`
    }

    // Check if description has a call to action
    const hasCTA = /order|buy|shop|get yours|add to cart/i.test(existingDescription)
    if (!hasCTA) {
      return `${existingDescription} Order now for fast delivery!`
    }

    return existingDescription
  }
}

export default ProductSEOOptimizer

