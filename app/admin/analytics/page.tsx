'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ProfitMarginBadge } from '@/components/ProfitMarginBadge'
import { 
  TrendingUp, 
  TrendingDown,
  Package,
  BarChart3,
  ArrowLeft,
  Download,
  Award,
  DollarSign
} from 'lucide-react'

interface BestSeller {
  product_id: string
  product_name: string
  category: string
  units_sold: number
  revenue: number
  profit: number
  profit_margin: number
}

interface ProfitLeader {
  product_id: string
  product_name: string
  category: string
  units_sold: number
  revenue: number
  profit: number
  profit_margin: number
}

interface SalesTrend {
  date: string
  revenue: number
  orders: number
  profit: number
}

interface CategoryPerformance {
  category: string
  revenue: number
  profit: number
  units_sold: number
  profit_margin: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'best-sellers' | 'profit-leaders' | 'trends' | 'categories'>('best-sellers')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month')
  
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [profitLeaders, setProfitLeaders] = useState<ProfitLeader[]>([])
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (activeTab === 'best-sellers') {
      fetchBestSellers()
    } else if (activeTab === 'profit-leaders') {
      fetchProfitLeaders()
    } else if (activeTab === 'trends') {
      fetchSalesTrends()
    } else if (activeTab === 'categories') {
      fetchCategoryPerformance()
    }
  }, [activeTab, dateRange])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchBestSellers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?endpoint=best-sellers&range=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setBestSellers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching best sellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfitLeaders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?endpoint=profit-leaders&range=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setProfitLeaders(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching profit leaders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesTrends = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?endpoint=trends&range=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setSalesTrends(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching sales trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryPerformance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?endpoint=categories&range=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setCategoryPerformance(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching category performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`

  if (loading && bestSellers.length === 0) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-sm sm:text-base text-gray-600">Sales insights and performance metrics</p>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            {(['week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateRange === range
                    ? 'bg-jeffy-yellow text-gray-900 font-medium'
                    : 'bg-white text-gray-700 hover:bg-jeffy-yellow-light'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'best-sellers', label: 'Best Sellers', icon: Award },
            { id: 'profit-leaders', label: 'Profit Leaders', icon: TrendingUp },
            { id: 'trends', label: 'Sales Trends', icon: BarChart3 },
            { id: 'categories', label: 'Category Performance', icon: Package }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-jeffy-yellow text-gray-900 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Best Sellers Tab */}
        {activeTab === 'best-sellers' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top 10 Best Selling Products</h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : bestSellers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No sales data available for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.slice(0, 10).map((product, index) => (
                      <tr key={product.product_id} className="border-b border-gray-100 hover:bg-jeffy-yellow-light">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">#{index + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.product_name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium text-gray-900">{product.units_sold}</td>
                        <td className="text-right py-3 px-4 font-medium text-gray-900">{formatCurrency(product.revenue)}</td>
                        <td className={`text-right py-3 px-4 font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(product.profit)}
                        </td>
                        <td className="text-right py-3 px-4">
                          <ProfitMarginBadge margin={product.profit_margin} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Profit Leaders Tab */}
        {activeTab === 'profit-leaders' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top 10 Most Profitable Products</h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : profitLeaders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No profit data available for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Profit</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLeaders.slice(0, 10).map((product, index) => (
                      <tr key={product.product_id} className="border-b border-gray-100 hover:bg-jeffy-yellow-light">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">#{index + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.product_name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </td>
                        <td className={`text-right py-3 px-4 font-bold text-lg ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(product.profit)}
                        </td>
                        <td className="text-right py-3 px-4 font-medium text-gray-900">{formatCurrency(product.revenue)}</td>
                        <td className="text-right py-3 px-4 text-gray-700">{product.units_sold}</td>
                        <td className="text-right py-3 px-4">
                          <ProfitMarginBadge margin={product.profit_margin} size="sm" showIcon />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Sales Trends Tab */}
        {activeTab === 'trends' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends Over Time</h3>
            {loading ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : salesTrends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trend data available for the selected period.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-jeffy-yellow-light rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(trend.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{trend.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(trend.revenue)}</p>
                      <p className={`text-sm ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Profit: {formatCurrency(trend.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Category Performance Tab */}
        {activeTab === 'categories' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
            {loading ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : categoryPerformance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No category data available for the selected period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPerformance.map((category) => (
                  <Card key={category.category} className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profit:</span>
                        <span className={`font-medium ${category.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(category.profit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Units Sold:</span>
                        <span className="font-medium text-gray-900">{category.units_sold}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Margin:</span>
                        <ProfitMarginBadge margin={category.profit_margin} size="sm" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

