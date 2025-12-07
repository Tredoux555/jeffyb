// Anthropic Claude AI Client for Jeffy
// This module provides AI-powered features for the admin dashboard

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface AIResponse {
  success: boolean
  content: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  error?: string
}

// Main function to call Claude API
export async function callClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1024
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
    }
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt || 'You are a helpful AI assistant for the Jeffy e-commerce platform.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
    }

    const data: AnthropicResponse = await response.json()

    return {
      success: true,
      content: data.content[0]?.text || '',
      usage: data.usage
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// ============================================
// PRODUCT DESCRIPTION GENERATOR
// ============================================
export async function generateProductDescription(
  productName: string,
  category: string,
  features?: string,
  price?: number
): Promise<AIResponse> {
  const systemPrompt = `You are a professional e-commerce copywriter for Jeffy, a South African online store. 
Write compelling, SEO-friendly product descriptions that:
- Are concise but informative (100-150 words)
- Highlight key benefits
- Use persuasive language
- Include relevant keywords naturally
- Appeal to South African customers
- Use Rands (R) for any prices mentioned

Format your response as:
**Title**: [Catchy product title]

**Description**: [Main description paragraph]

**Key Features**:
• [Feature 1]
• [Feature 2]
• [Feature 3]

**Why Buy from Jeffy?**: [Short trust statement]`

  const prompt = `Generate a product description for:
Product: ${productName}
Category: ${category}
${features ? `Features/Details: ${features}` : ''}
${price ? `Price: R${price}` : ''}`

  return callClaude(prompt, systemPrompt, 500)
}

// ============================================
// SMART ANALYTICS SUMMARY
// ============================================
export async function generateAnalyticsSummary(analyticsData: {
  totalRevenue: number
  totalOrders: number
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  recentTrends: {
    revenueChange: number
    ordersChange: number
  }
  lowStockCount: number
  pendingOrders: number
  categoryBreakdown?: Array<{ category: string; revenue: number; count: number }>
}): Promise<AIResponse> {
  const systemPrompt = `You are a business analytics expert for Jeffy, a South African e-commerce platform.
Provide clear, actionable insights in a friendly but professional tone.
Use South African Rands (R) for all currency.
Keep insights brief and focus on what matters most.
Highlight both wins and areas needing attention.
Give 2-3 specific, actionable recommendations.`

  const prompt = `Analyze this sales data and provide insights:

**Revenue**: R${analyticsData.totalRevenue.toFixed(2)}
**Total Orders**: ${analyticsData.totalOrders}
**Revenue Change**: ${analyticsData.recentTrends.revenueChange > 0 ? '+' : ''}${analyticsData.recentTrends.revenueChange.toFixed(1)}%
**Orders Change**: ${analyticsData.recentTrends.ordersChange > 0 ? '+' : ''}${analyticsData.recentTrends.ordersChange.toFixed(1)}%

**Top Products**:
${analyticsData.topProducts.map(p => `- ${p.name}: ${p.sales} sold, R${p.revenue.toFixed(2)}`).join('\n')}

**Inventory Status**:
- Low stock items: ${analyticsData.lowStockCount}
- Pending orders: ${analyticsData.pendingOrders}

${analyticsData.categoryBreakdown ? `**Category Performance**:\n${analyticsData.categoryBreakdown.map(c => `- ${c.category}: R${c.revenue.toFixed(2)} (${c.count} orders)`).join('\n')}` : ''}

Provide:
1. A brief summary of performance (2-3 sentences)
2. Key wins to celebrate
3. Areas needing attention
4. 2-3 specific recommendations`

  return callClaude(prompt, systemPrompt, 800)
}

// ============================================
// INVENTORY REORDER SUGGESTIONS
// ============================================
export async function generateReorderSuggestions(inventoryData: {
  products: Array<{
    name: string
    currentStock: number
    reorderPoint: number
    avgDailySales: number
    lastReorderDate?: string
    price: number
    category: string
  }>
}): Promise<AIResponse> {
  const systemPrompt = `You are an inventory management expert for Jeffy e-commerce.
Analyze stock levels and provide smart reorder recommendations.
Consider sales velocity, stock levels vs reorder points, and business priorities.
Use South African Rands (R) for currency.
Be specific with quantities and urgency levels.`

  const lowStockProducts = inventoryData.products.filter(
    p => p.currentStock <= p.reorderPoint * 1.5
  )

  if (lowStockProducts.length === 0) {
    return {
      success: true,
      content: '✅ **All inventory levels look healthy!**\n\nNo products are near their reorder points. Great job managing stock levels!\n\n**Tip**: Review your reorder points periodically to ensure they match actual demand patterns.',
      usage: { input_tokens: 0, output_tokens: 0 }
    }
  }

  const prompt = `Analyze these products that may need reordering:

${lowStockProducts.map(p => `
**${p.name}** (${p.category})
- Current Stock: ${p.currentStock} units
- Reorder Point: ${p.reorderPoint} units
- Avg Daily Sales: ${p.avgDailySales.toFixed(1)} units
- Price: R${p.price.toFixed(2)}
- Days of Stock Left: ~${(p.currentStock / (p.avgDailySales || 1)).toFixed(0)} days
${p.lastReorderDate ? `- Last Reorder: ${p.lastReorderDate}` : ''}`).join('\n')}

Provide:
1. Urgency classification (🔴 Critical, 🟡 Soon, 🟢 Watch)
2. Recommended reorder quantity for each product
3. Priority order for restocking
4. Any patterns you notice (e.g., category trends)`

  return callClaude(prompt, systemPrompt, 800)
}

// ============================================
// PRODUCT REQUEST ANALYZER (Jeffy Wants)
// ============================================
export async function analyzeProductRequests(requests: Array<{
  request_text: string
  requester_name: string
  created_at: string
  status: string
  referral_count?: number
}>): Promise<AIResponse> {
  const systemPrompt = `You are a product sourcing analyst for Jeffy e-commerce.
Analyze customer product requests to identify trends and opportunities.
Help the business decide which products to source based on demand patterns.
Be specific and actionable in your recommendations.`

  if (requests.length === 0) {
    return {
      success: true,
      content: '📭 **No product requests to analyze yet.**\n\nWhen customers submit "Jeffy Wants" requests, AI analysis will help you identify:\n- Trending product demands\n- Categories to expand\n- Potential bestsellers',
      usage: { input_tokens: 0, output_tokens: 0 }
    }
  }

  const prompt = `Analyze these customer product requests:

${requests.slice(0, 20).map((r, i) => `
${i + 1}. "${r.request_text}"
   - Submitted: ${new Date(r.created_at).toLocaleDateString()}
   - Status: ${r.status}
   ${r.referral_count ? `- Referrals: ${r.referral_count} people interested` : ''}`).join('\n')}

Total requests analyzed: ${requests.length}

Provide:
1. **Trending Themes**: What types of products are customers asking for most?
2. **Top 3 Products to Source**: Specific products you'd recommend adding to inventory
3. **Category Opportunities**: Which categories should Jeffy expand?
4. **High-Potential Requests**: Any requests with high referral counts worth prioritizing?
5. **Quick Wins**: Easy-to-source items that could satisfy multiple requests`

  return callClaude(prompt, systemPrompt, 800)
}

// ============================================
// MARKETING COPY GENERATOR
// ============================================
export async function generateMarketingCopy(options: {
  type: 'social_post' | 'email_subject' | 'email_body' | 'promo_banner' | 'product_highlight'
  product?: { name: string; price: number; description: string; category: string }
  promotion?: { discount: string; code?: string; endDate?: string }
  tone?: 'casual' | 'professional' | 'urgent' | 'friendly'
  platform?: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'email'
}): Promise<AIResponse> {
  const toneGuide = {
    casual: 'relaxed, conversational, use emojis',
    professional: 'polished, trustworthy, minimal emojis',
    urgent: 'create FOMO, time-sensitive language, action-oriented',
    friendly: 'warm, personal, community-focused'
  }

  const systemPrompt = `You are a marketing copywriter for Jeffy, a South African e-commerce platform.
Write engaging marketing content that drives sales and engagement.
Use South African Rands (R) for prices.
Keep copy concise and impactful.
Tone: ${toneGuide[options.tone || 'friendly']}
${options.platform ? `Platform: ${options.platform} (optimize for this platform's style and limits)` : ''}`

  let prompt = ''

  switch (options.type) {
    case 'social_post':
      prompt = `Create a social media post${options.platform ? ` for ${options.platform}` : ''}.
${options.product ? `Product: ${options.product.name} - R${options.product.price}\nDescription: ${options.product.description}` : ''}
${options.promotion ? `Promotion: ${options.promotion.discount}${options.promotion.code ? ` (Code: ${options.promotion.code})` : ''}${options.promotion.endDate ? ` - Ends: ${options.promotion.endDate}` : ''}` : ''}

Include relevant hashtags and a clear call-to-action.`
      break

    case 'email_subject':
      prompt = `Generate 5 email subject line options that will maximize open rates.
${options.product ? `Product: ${options.product.name}` : ''}
${options.promotion ? `Promotion: ${options.promotion.discount}` : ''}

Format as a numbered list. Keep under 50 characters each.`
      break

    case 'email_body':
      prompt = `Write a marketing email body (keep it concise).
${options.product ? `Product: ${options.product.name} - R${options.product.price}\nDescription: ${options.product.description}` : ''}
${options.promotion ? `Promotion: ${options.promotion.discount}${options.promotion.code ? ` (Code: ${options.promotion.code})` : ''}` : ''}

Include: greeting, main pitch, benefits, call-to-action, and sign-off.`
      break

    case 'promo_banner':
      prompt = `Write copy for a promotional banner/hero section.
${options.promotion ? `Promotion: ${options.promotion.discount}${options.promotion.endDate ? ` - Ends: ${options.promotion.endDate}` : ''}` : ''}

Provide:
- Headline (max 6 words)
- Subheadline (max 15 words)  
- CTA button text (max 4 words)`
      break

    case 'product_highlight':
      prompt = `Create a product highlight/feature post.
Product: ${options.product?.name} - R${options.product?.price}
Category: ${options.product?.category}
Description: ${options.product?.description}

Write a compelling highlight that showcases the product's value.`
      break
  }

  return callClaude(prompt, systemPrompt, 600)
}

// ============================================
// SITE IMPROVEMENT ADVISOR
// ============================================
export async function analyzeSiteForImprovements(siteData: {
  currentFeatures: string[]
  recentIssues?: string[]
  userFeedback?: string[]
  techStack: string[]
  businessGoals?: string[]
}): Promise<AIResponse> {
  const systemPrompt = `You are a senior full-stack developer and UX expert reviewing the Jeffy e-commerce platform.
Your job is to identify problems, suggest improvements, and provide actionable code-level solutions.
You should give specific, implementable suggestions that can be pasted into Cursor IDE.

IMPORTANT: For each suggestion, provide:
1. The problem or improvement opportunity
2. Why it matters (business/UX impact)
3. A specific solution with file paths and code snippets where applicable
4. Priority level (🔴 High, 🟡 Medium, 🟢 Low)

Focus on:
- User experience improvements
- Performance optimizations
- Accessibility issues
- Mobile responsiveness
- Conversion optimization
- Code quality and maintainability`

  const prompt = `Analyze this e-commerce site and suggest improvements:

**Tech Stack**: ${siteData.techStack.join(', ')}

**Current Features**:
${siteData.currentFeatures.map(f => `- ${f}`).join('\n')}

${siteData.recentIssues?.length ? `**Known Issues**:\n${siteData.recentIssues.map(i => `- ${i}`).join('\n')}` : ''}

${siteData.userFeedback?.length ? `**User Feedback**:\n${siteData.userFeedback.map(f => `- "${f}"`).join('\n')}` : ''}

${siteData.businessGoals?.length ? `**Business Goals**:\n${siteData.businessGoals.map(g => `- ${g}`).join('\n')}` : ''}

Provide 5-7 specific improvements with implementation details. Format each as:

### [Priority Emoji] Improvement Title
**Problem**: What's wrong or could be better
**Impact**: Why this matters
**Solution**: Step-by-step implementation
**Code Example**: (if applicable)
\`\`\`typescript
// File: path/to/file.tsx
// Code snippet here
\`\`\``

  return callClaude(prompt, systemPrompt, 2000)
}

// ============================================
// CUSTOM AI QUERY (for the Site Advisor chat)
// ============================================
export async function askSiteAdvisor(
  question: string,
  context?: {
    currentPage?: string
    recentError?: string
    codeSnippet?: string
  }
): Promise<AIResponse> {
  const systemPrompt = `You are an expert developer assistant for the Jeffy e-commerce platform built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase.

Help the admin identify problems, suggest solutions, and provide code they can implement.

When providing code solutions:
1. Be specific about file paths
2. Show complete, working code snippets
3. Explain what the code does
4. Consider the existing tech stack
5. Follow Next.js App Router conventions
6. Use TypeScript best practices

If asked about site improvements, UX, or bugs, provide actionable solutions with code examples.`

  let prompt = question

  if (context?.currentPage) {
    prompt += `\n\nContext - Current page being discussed: ${context.currentPage}`
  }
  if (context?.recentError) {
    prompt += `\n\nRecent error encountered:\n${context.recentError}`
  }
  if (context?.codeSnippet) {
    prompt += `\n\nRelevant code:\n\`\`\`\n${context.codeSnippet}\n\`\`\``
  }

  return callClaude(prompt, systemPrompt, 1500)
}
