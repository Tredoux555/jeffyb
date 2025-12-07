'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import {
  Sparkles,
  FileText,
  BarChart3,
  Package,
  MessageSquare,
  Megaphone,
  Wrench,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  AlertTriangle,
  Send,
  Bot
} from 'lucide-react'

type ActiveTool = 'description' | 'analytics' | 'reorder' | 'requests' | 'marketing' | 'advisor'

export default function AIToolsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<ActiveTool>('advisor')
  
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      } else {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600">Loading AI Tools...</p>
        </div>
      </div>
    )
  }

  const tools = [
    { id: 'advisor' as const, name: 'Site Advisor', icon: Wrench, description: 'Get improvement suggestions' },
    { id: 'description' as const, name: 'Product Descriptions', icon: FileText, description: 'Generate product copy' },
    { id: 'seo' as const, name: 'SEO Manager', icon: Sparkles, description: 'Optimize all products', href: '/admin/seo' },
    { id: 'analytics' as const, name: 'Analytics Summary', icon: BarChart3, description: 'AI insights on sales' },
    { id: 'reorder' as const, name: 'Reorder Suggestions', icon: Package, description: 'Smart inventory alerts' },
    { id: 'requests' as const, name: 'Request Analyzer', icon: MessageSquare, description: 'Analyze Jeffy Wants' },
    { id: 'marketing' as const, name: 'Marketing Copy', icon: Megaphone, description: 'Generate promo content' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Tools</h1>
              <p className="text-gray-600">Powered by Claude AI</p>
            </div>
          </div>
        </div>

        {/* Tool Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            
            // If tool has href, render as Link
            if ('href' in tool && tool.href) {
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="p-4 rounded-xl transition-all text-left bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg hover:scale-[1.02]"
                >
                  <Icon className="w-6 h-6 mb-2 text-yellow-300" />
                  <p className="font-semibold text-sm">{tool.name}</p>
                  <p className="text-xs text-purple-200">
                    {tool.description}
                  </p>
                </Link>
              )
            }
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-4 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow-md'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-jeffy-yellow' : 'text-slate-500'}`} />
                <p className="font-semibold text-sm">{tool.name}</p>
                <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tool.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Tool Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {activeTool === 'advisor' && <SiteAdvisorTool />}
          {activeTool === 'description' && <ProductDescriptionTool />}
          {activeTool === 'analytics' && <AnalyticsSummaryTool />}
          {activeTool === 'reorder' && <ReorderSuggestionsTool />}
          {activeTool === 'requests' && <RequestAnalyzerTool />}
          {activeTool === 'marketing' && <MarketingCopyTool />}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SITE ADVISOR TOOL
// ============================================
function SiteAdvisorTool() {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatMode, setChatMode] = useState(false)
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [issues, setIssues] = useState('')
  const [feedback, setFeedback] = useState('')
  const [goals, setGoals] = useState('')

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/ai/site-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          issues: issues ? issues.split('\n').filter(Boolean) : [],
          feedback: feedback ? feedback.split('\n').filter(Boolean) : [],
          goals: goals ? goals.split('\n').filter(Boolean) : []
        })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setAnalysis(data.data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze site')
    } finally {
      setLoading(false)
    }
  }

  const askQuestion = async () => {
    if (!question.trim()) return
    
    const newHistory = [...chatHistory, { role: 'user' as const, content: question }]
    setChatHistory(newHistory)
    setQuestion('')
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/admin/ai/site-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask',
          question: question
        })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setChatHistory([...newHistory, { role: 'assistant', content: data.data.response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-500" />
            Site Improvement Advisor
          </h2>
          <p className="text-slate-600 text-sm">Get AI-powered suggestions to improve your site</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!chatMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChatMode(false)}
          >
            Full Analysis
          </Button>
          <Button
            variant={chatMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChatMode(true)}
          >
            Ask Questions
          </Button>
        </div>
      </div>

      {!chatMode ? (
        <>
          {/* Analysis Mode */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Known Issues (one per line)
              </label>
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="Checkout is slow&#10;Images don't load on mobile&#10;Search doesn't work well"
                className="w-full h-24 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User Feedback (one per line)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Hard to find products&#10;Wish there was a wishlist&#10;Love the fast delivery"
                className="w-full h-24 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Business Goals (one per line)
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Increase mobile sales&#10;Reduce cart abandonment&#10;Improve SEO"
                className="w-full h-24 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <Button onClick={runAnalysis} disabled={loading} className="mb-6">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Site...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Full Analysis
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
              {error}
            </div>
          )}

          {analysis && (
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Analysis Results</h3>
                <CopyButton text={analysis} />
              </div>
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={analysis} />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Chat Mode */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 h-96 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="font-medium">Ask me anything about improving your site!</p>
                  <p className="text-sm mt-1">I can suggest code fixes, UX improvements, and more.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border border-slate-200'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
              placeholder="How can I improve the checkout page? or What's causing slow loading?"
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <Button onClick={askQuestion} disabled={loading || !question.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// PRODUCT DESCRIPTION TOOL
// ============================================
function ProductDescriptionTool() {
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [features, setFeatures] = useState('')
  const [price, setPrice] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('*').eq('is_active', true)
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const generate = async () => {
    if (!productName || !category) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/ai/product-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          features: features || undefined,
          price: price ? parseFloat(price) : undefined
        })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data.description)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-500" />
        Product Description Generator
      </h2>
      <p className="text-slate-600 text-sm mb-6">Generate compelling product descriptions for your catalog</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Portable Air Compressor Pro"
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-jeffy-yellow focus:outline-none"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Features/Details (optional)</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="12V portable, LED display, auto shut-off, includes adapters..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-jeffy-yellow focus:outline-none h-24"
            />
          </div>

          <Input
            label="Price (optional)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="299.99"
          />

          <Button onClick={generate} disabled={loading || !productName || !category} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Description
              </>
            )}
          </Button>
        </div>

        <div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-slate-50 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Generated Description</span>
                <CopyButton text={result} />
              </div>
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={result} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-8 h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Your generated description will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// ANALYTICS SUMMARY TOOL
// ============================================
function AnalyticsSummaryTool() {
  const [summary, setSummary] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/ai/analytics-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setSummary(data.data.summary)
      setRawData(data.data.rawData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analytics summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Smart Analytics Summary
          </h2>
          <p className="text-slate-600 text-sm">AI-powered insights from your sales data</p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
          {error}
        </div>
      )}

      {rawData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Revenue (30 days)" value={`R${rawData.totalRevenue.toFixed(2)}`} trend={rawData.recentTrends.revenueChange} />
          <StatCard label="Orders (30 days)" value={rawData.totalOrders} trend={rawData.recentTrends.ordersChange} />
          <StatCard label="Low Stock Items" value={rawData.lowStockCount} alert={rawData.lowStockCount > 0} />
          <StatCard label="Pending Orders" value={rawData.pendingOrders} />
        </div>
      )}

      {summary ? (
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">AI Insights</h3>
            <CopyButton text={summary} />
          </div>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={summary} />
          </div>
        </div>
      ) : !loading && (
        <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Click "Generate Insights" to get AI-powered analytics</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// REORDER SUGGESTIONS TOOL
// ============================================
function ReorderSuggestionsTool() {
  const [suggestions, setSuggestions] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/ai/reorder-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setSuggestions(data.data.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Inventory Reorder Suggestions
          </h2>
          <p className="text-slate-600 text-sm">Smart recommendations based on stock levels and sales velocity</p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Inventory
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
          {error}
        </div>
      )}

      {suggestions ? (
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Reorder Recommendations</h3>
            <CopyButton text={suggestions} />
          </div>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={suggestions} />
          </div>
        </div>
      ) : !loading && (
        <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Click "Check Inventory" to get AI-powered reorder suggestions</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// REQUEST ANALYZER TOOL
// ============================================
function RequestAnalyzerTool() {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/ai/analyze-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setAnalysis(data.data.analysis)
      setRequestCount(data.data.requestCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze requests')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Jeffy Wants Request Analyzer
          </h2>
          <p className="text-slate-600 text-sm">Identify trends from customer product requests</p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Analyze Requests
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
          {error}
        </div>
      )}

      {requestCount > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
          <p className="text-purple-800 font-medium">
            📊 Analyzed {requestCount} customer requests
          </p>
        </div>
      )}

      {analysis ? (
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Demand Analysis</h3>
            <CopyButton text={analysis} />
          </div>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={analysis} />
          </div>
        </div>
      ) : !loading && (
        <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Click "Analyze Requests" to discover product demand trends</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// MARKETING COPY TOOL
// ============================================
function MarketingCopyTool() {
  const [copyType, setCopyType] = useState<string>('social_post')
  const [platform, setPlatform] = useState('')
  const [tone, setTone] = useState('friendly')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [discount, setDiscount] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const body: any = {
        type: copyType,
        tone,
        platform: platform || undefined
      }

      if (productName) {
        body.product = {
          name: productName,
          price: productPrice ? parseFloat(productPrice) : 0,
          description: productDesc,
          category: ''
        }
      }

      if (discount) {
        body.promotion = {
          discount,
          code: promoCode || undefined
        }
      }

      const response = await fetch('/api/admin/ai/marketing-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data.copy)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate marketing copy')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-pink-500" />
        Marketing Copy Generator
      </h2>
      <p className="text-slate-600 text-sm mb-6">Generate social posts, emails, and promotional content</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Copy Type *</label>
              <select
                value={copyType}
                onChange={(e) => setCopyType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-jeffy-yellow focus:outline-none"
              >
                <option value="social_post">Social Post</option>
                <option value="email_subject">Email Subject Lines</option>
                <option value="email_body">Email Body</option>
                <option value="promo_banner">Promo Banner</option>
                <option value="product_highlight">Product Highlight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-jeffy-yellow focus:outline-none"
              >
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="urgent">Urgent/FOMO</option>
              </select>
            </div>
          </div>

          {copyType === 'social_post' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-jeffy-yellow focus:outline-none"
              >
                <option value="">Any Platform</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter/X</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Product (optional)</p>
            <div className="space-y-3">
              <Input
                label="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Camping Tent 4-Person"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price"
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="599.99"
                />
                <Input
                  label="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="20% OFF"
                />
              </div>
              <Input
                label="Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="SUMMER20"
              />
            </div>
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Copy
              </>
            )}
          </Button>
        </div>

        <div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-slate-50 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Generated Copy</span>
                <CopyButton text={result} />
              </div>
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={result} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-8 h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Your marketing copy will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

function StatCard({ label, value, trend, alert }: { 
  label: string
  value: string | number
  trend?: number
  alert?: boolean 
}) {
  return (
    <div className={`p-4 rounded-xl ${alert ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className={`text-xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {alert && <AlertTriangle className="w-5 h-5 text-red-500" />}
      </div>
    </div>
  )
}

// Simple markdown renderer for AI responses
function MarkdownRenderer({ content }: { content: string }) {
  // Convert markdown to HTML-like structure
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent = ''
  let codeLanguage = ''

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={index} className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm my-3">
            <code>{codeContent.trim()}</code>
          </pre>
        )
        codeContent = ''
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLanguage = line.replace('```', '')
      }
      return
    }

    if (inCodeBlock) {
      codeContent += line + '\n'
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold text-slate-900 mt-4 mb-2">{line.replace('### ', '')}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-slate-900 mt-4 mb-2">{line.replace('## ', '')}</h2>)
      return
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-slate-900 mt-4 mb-2">{line.replace('# ', '')}</h1>)
      return
    }

    // Bold text
    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Inline code
    processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-pink-600">$1</code>')

    // List items
    if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={index} className="ml-4 text-slate-700" dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[-•] /, '') }} />
      )
      return
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\. (.*)/)
    if (numberedMatch) {
      elements.push(
        <li key={index} className="ml-4 text-slate-700 list-decimal" dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />
      )
      return
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<br key={index} />)
      return
    }

    // Regular paragraphs
    elements.push(<p key={index} className="text-slate-700 my-2" dangerouslySetInnerHTML={{ __html: processedLine }} />)
  })

  return <div className="space-y-1">{elements}</div>
}
