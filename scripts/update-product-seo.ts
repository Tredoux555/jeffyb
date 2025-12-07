/**
 * Bulk Update Product SEO Descriptions
 * 
 * This script updates all product descriptions with SEO-optimized content.
 * 
 * Usage:
 * 1. Make sure you have the environment variables set:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 
 * 2. Run with ts-node or tsx:
 *    npx tsx scripts/update-product-seo.ts
 * 
 * 3. Or compile and run:
 *    npx tsc scripts/update-product-seo.ts
 *    node scripts/update-product-seo.js
 */

import { createClient } from '@supabase/supabase-js'

// SEO Optimizer (inline to avoid module resolution issues in scripts)
interface ProductSEOData {
  name: string
  category: string
  price: number
  features?: string[]
  benefits?: string[]
  brand?: string
}

const CATEGORY_TEMPLATES: Record<string, {
  adjectives: string[]
  benefits: string[]
}> = {
  gym: {
    adjectives: ['durable', 'professional-grade', 'ergonomic', 'high-performance'],
    benefits: ['better workouts', 'improved performance', 'maximum comfort', 'lasting durability']
  },
  camping: {
    adjectives: ['rugged', 'portable', 'weather-resistant', 'lightweight'],
    benefits: ['outdoor adventures', 'reliable protection', 'easy setup', 'compact storage']
  },
  kitchen: {
    adjectives: ['premium', 'versatile', 'easy-to-clean', 'chef-quality'],
    benefits: ['delicious meals', 'effortless cooking', 'professional results', 'time savings']
  },
  beauty: {
    adjectives: ['luxurious', 'gentle', 'nourishing', 'radiance-boosting'],
    benefits: ['glowing skin', 'natural beauty', 'lasting freshness', 'confidence boost']
  },
  'baby-toys': {
    adjectives: ['safe', 'educational', 'colorful', 'engaging'],
    benefits: ['child development', 'hours of fun', 'learning through play', 'safe entertainment']
  },
  archery: {
    adjectives: ['precision', 'professional', 'tournament-ready', 'balanced'],
    benefits: ['improved accuracy', 'consistent performance', 'competitive edge', 'skill development']
  },
  'car-care': {
    adjectives: ['powerful', 'professional-grade', 'fast-acting', 'protective'],
    benefits: ['showroom shine', 'long-lasting protection', 'easy application', 'professional results']
  }
}

function generateDescription(product: ProductSEOData): string {
  const { name, category, price, features = [], benefits = [], brand } = product
  const categoryLower = category.toLowerCase()
  const template = CATEGORY_TEMPLATES[categoryLower] || CATEGORY_TEMPLATES.gym
  
  const sections: string[] = []
  
  const brandPrefix = brand ? `${brand} ` : ''
  const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)]
  sections.push(
    `Discover the ${brandPrefix}${name} - a ${adjective} ${categoryLower} essential designed to elevate your experience.`
  )
  
  if (features.length > 0) {
    const featureList = features.slice(0, 4).join(', ')
    sections.push(`Featuring ${featureList}, this product delivers exceptional quality and performance.`)
  } else {
    sections.push(`Crafted with premium materials and attention to detail for outstanding quality.`)
  }
  
  if (benefits.length > 0) {
    const benefitList = benefits.slice(0, 3).join(', ')
    sections.push(`Experience ${benefitList} with every use.`)
  } else {
    const defaultBenefit = template.benefits[Math.floor(Math.random() * template.benefits.length)]
    sections.push(`Enjoy ${defaultBenefit} and exceptional value.`)
  }
  
  if (price < 100) {
    sections.push(`At just R${price.toFixed(2)}, you get premium quality at an affordable price.`)
  } else if (price < 500) {
    sections.push(`Invest in quality with this R${price.toFixed(2)} ${categoryLower} essential.`)
  } else {
    sections.push(`This premium R${price.toFixed(2)} product represents the best in ${categoryLower} quality.`)
  }
  
  sections.push(`Order now and enjoy fast delivery across South Africa!`)
  
  return sections.join(' ')
}

function generateSEOTitle(productName: string, category: string): string {
  const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  return `${productName} - Premium ${categoryCapitalized} | Jeffy Store South Africa`
}

function generateMetaDescription(productName: string, category: string, price: number): string {
  const desc = `Shop ${productName} ${category.toLowerCase()} for R${price.toFixed(2)}. Free shipping on orders over R500. Premium quality, fast SA delivery!`
  if (desc.length > 160) {
    return desc.substring(0, 157) + '...'
  }
  return desc
}

// Main script
async function updateProductDescriptions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables!')
    console.log('Required:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY')
    console.log('')
    console.log('Run with:')
    console.log('  NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/update-product-seo.ts')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🔍 Fetching all products...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, category, price, features, benefits, brand')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    console.log(`📦 Found ${products?.length || 0} products to update\n`)

    let successCount = 0
    let errorCount = 0

    for (const product of products || []) {
      try {
        // Generate optimized content
        const optimizedDescription = generateDescription({
          name: product.name,
          category: product.category,
          price: product.price,
          features: product.features || [],
          benefits: product.benefits || [],
          brand: product.brand
        })

        const seoTitle = generateSEOTitle(product.name, product.category)
        const metaDescription = generateMetaDescription(product.name, product.category, product.price)

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            description: optimizedDescription,
            seo_title: seoTitle,
            meta_description: metaDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (updateError) {
          console.error(`  ❌ Failed: ${product.name} - ${updateError.message}`)
          errorCount++
        } else {
          console.log(`  ✅ Updated: ${product.name}`)
          successCount++
        }
      } catch (err) {
        console.error(`  ❌ Error processing ${product.name}:`, err)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Update complete!`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
updateProductDescriptions()

