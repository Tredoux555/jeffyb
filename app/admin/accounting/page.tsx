'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ProfitMarginBadge } from '@/components/ProfitMarginBadge'
import ProcurementSection from './components/ProcurementSection'
import ShipmentsSection from './components/ShipmentsSection'
import CustomsCalculatorSection from './components/CustomsCalculatorSection'
import DistributorsSection from './components/DistributorsSection'
import StockAllocationSection from './components/StockAllocationSection'
import FranchiseFinancialsSection from './components/FranchiseFinancialsSection'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calendar,
  Download,
  Settings,
  BarChart3,
  PieChart,
  ArrowLeft,
  Truck,
  Calculator,
  Users,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalCosts: number
  effectiveCosts: number // Cost after reclaiming import VAT
  netProfit: number // Net profit after corporate tax
  profitBeforeTax: number // Profit before corporate tax
  taxOwed: number // VAT on sales
  importVatPaid: number // Import VAT paid (reclaimable)
  importVatReclaimable: number // Import VAT reclaimable
  corporateTaxOwed: number // Corporate income tax
  profitMargin: number
}

interface ProductProfit {
  product_id: string
  product_name: string
  category: string
  selling_price: number
  cost: number
  units_sold: number
  revenue: number
  total_cost: number
  profit: number
  profit_margin: number
}

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'tax' | 'reports' | 'procurement' | 'shipments' | 'customs' | 'distributors' | 'stock-allocation' | 'franchise-financials'>('dashboard')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customDateRange, setCustomDateRange] = useState(false)
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalCosts: 0,
    effectiveCosts: 0,
    netProfit: 0,
    profitBeforeTax: 0,
    taxOwed: 0,
    importVatPaid: 0,
    importVatReclaimable: 0,
    corporateTaxOwed: 0,
    profitMargin: 0
  })
  
  const [productsProfit, setProductsProfit] = useState<ProductProfit[]>([])
  const [taxRate, setTaxRate] = useState(15.00)
  const [importVatRate, setImportVatRate] = useState(15.00)
  const [corporateTaxRate, setCorporateTaxRate] = useState(27.00)
  const [taxInclusive, setTaxInclusive] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchDashboardStats()
    fetchTaxConfig()
  }, [dateRange, startDate, endDate])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/accounting?endpoint=dashboard&range=${dateRange}&start=${startDate}&end=${endDate}`)
      const result = await response.json()
      
      if (result.success) {
        setDashboardStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsProfit = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/accounting?endpoint=products-profit&range=${dateRange}&start=${startDate}&end=${endDate}`)
      const result = await response.json()
      
      if (result.success) {
        setProductsProfit(result.data)
      }
    } catch (error) {
      console.error('Error fetching products profit:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTaxConfig = async () => {
    try {
      const response = await fetch('/api/admin/accounting?endpoint=tax-config')
      const result = await response.json()
      
      if (result.success && result.data) {
        setTaxRate(result.data.tax_rate)
        setImportVatRate(result.data.import_vat_rate || 15.00)
        setCorporateTaxRate(result.data.corporate_tax_rate || 27.00)
        setTaxInclusive(result.data.tax_inclusive)
      }
    } catch (error) {
      console.error('Error fetching tax config:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProductsProfit()
    } else if (activeTab === 'dashboard') {
      fetchDashboardStats()
    }
  }, [activeTab, dateRange, startDate, endDate])

  const handleUpdateTaxConfig = async () => {
    try {
      const response = await fetch('/api/admin/accounting?endpoint=tax-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_rate: taxRate,
          import_vat_rate: importVatRate,
          corporate_tax_rate: corporateTaxRate,
          tax_inclusive: taxInclusive
        })
      })
      
      const result = await response.json()
      if (result.success) {
        alert('Tax configuration updated successfully')
        fetchTaxConfig()
        fetchDashboardStats()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating tax config:', error)
      alert('Failed to update tax configuration')
    }
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const handleExportCSV = () => {
    if (productsProfit.length === 0) {
      alert('No data to export')
      return
    }

    // Create CSV header
    const headers = ['Product Name', 'Category', 'Selling Price', 'Cost', 'Units Sold', 'Revenue', 'Total Cost', 'Profit', 'Profit Margin %']
    
    // Create CSV rows
    const rows = productsProfit.map(product => [
      product.product_name,
      product.category,
      product.selling_price.toFixed(2),
      product.cost.toFixed(2),
      product.units_sold.toString(),
      product.revenue.toFixed(2),
      product.total_cost.toFixed(2),
      product.profit.toFixed(2),
      product.profit_margin.toFixed(2)
    ])
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `products-profit-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        <div className="text-center">
          <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading accounting data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Accounting</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Financial tracking and profit analysis</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Period:</span>
              {(['today', 'week', 'month', 'year', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range)
                    setCustomDateRange(false)
                  }}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    dateRange === range && !customDateRange
                      ? 'bg-gradient-to-b from-jeffy-yellow to-amber-100 text-gray-900 font-medium'
                      : 'bg-white text-gray-700 hover:bg-gradient-to-b from-jeffy-yellow to-amber-100-light'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setCustomDateRange(!customDateRange)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  customDateRange
                    ? 'bg-gradient-to-b from-jeffy-yellow to-amber-100 text-gray-900 font-medium'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-b from-jeffy-yellow to-amber-100-light'
                }`}
              >
                Custom
              </button>
            </div>
            {customDateRange && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-gray-600">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'procurement', label: 'Procurement', icon: Package },
            { id: 'shipments', label: 'Shipments', icon: Truck },
            { id: 'stock-allocation', label: 'Stock Allocation', icon: Package },
            { id: 'franchise-financials', label: 'Franchise Financials', icon: BarChart3 },
            { id: 'customs', label: 'Customs Calculator', icon: Calculator },
            { id: 'distributors', label: 'Distributors', icon: Users },
            { id: 'products', label: 'Products & Profit', icon: Package },
            { id: 'tax', label: 'Tax Management', icon: Settings },
            { id: 'reports', label: 'Reports', icon: PieChart }
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.totalRevenue)}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Costs</span>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.totalCosts)}</p>
                <p className="text-xs text-gray-500 mt-1">Effective: {formatCurrency(dashboardStats.effectiveCosts)}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Net Profit (After Tax)</span>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-2xl font-bold ${dashboardStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dashboardStats.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Before tax: {formatCurrency(dashboardStats.profitBeforeTax)}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Profit Margin</span>
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-2xl font-bold ${dashboardStats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(dashboardStats.profitMargin)}
                </p>
              </Card>
            </div>

            {/* Tax Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">VAT on Sales</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboardStats.taxOwed)}</p>
                  <p className="text-xs text-gray-600 mt-1">15% VAT on revenue</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Import VAT (Reclaimable)</span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(dashboardStats.importVatReclaimable)}</p>
                  <p className="text-xs text-gray-600 mt-1">15% on cost - fully reclaimable</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Corporate Tax</span>
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(dashboardStats.corporateTaxOwed)}</p>
                  <p className="text-xs text-gray-600 mt-1">27% on profit</p>
                </div>
              </div>
            </Card>

            {/* Quick Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-b from-jeffy-yellow to-amber-100-light rounded-lg">
                  <span className="text-sm text-gray-700">Gross Revenue</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(dashboardStats.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-b from-jeffy-yellow to-amber-100-light rounded-lg">
                  <span className="text-sm text-gray-700">Cost of Goods Sold (COGS)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(dashboardStats.totalCosts)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Import VAT Reclaimed</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(dashboardStats.importVatReclaimable)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-b from-jeffy-yellow to-amber-100-light rounded-lg">
                  <span className="text-sm text-gray-700">Effective COGS (After VAT Reclaim)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(dashboardStats.effectiveCosts)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-b from-jeffy-yellow to-amber-100-light rounded-lg">
                  <span className="text-sm text-gray-700">VAT on Sales</span>
                  <span className="font-semibold text-gray-900">-{formatCurrency(dashboardStats.taxOwed)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Profit Before Corporate Tax</span>
                  <span className="font-bold text-blue-600">{formatCurrency(dashboardStats.profitBeforeTax)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-gray-700">Corporate Income Tax (27%)</span>
                  <span className="font-semibold text-orange-600">-{formatCurrency(dashboardStats.corporateTaxOwed)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-sm font-semibold text-gray-900">Net Profit After All Taxes</span>
                  <span className={`font-bold text-lg ${dashboardStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardStats.netProfit)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Products & Profit Tab */}
        {activeTab === 'products' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Products Profit Analysis</h3>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading product data...</p>
              </div>
            ) : productsProfit.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No product sales data available for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Selling Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cost</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Cost</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsProfit.map((product) => (
                      <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gradient-to-b from-jeffy-yellow to-amber-100-light">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.product_name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(product.selling_price)}</td>
                        <td className="text-right py-3 px-4 text-gray-700">{formatCurrency(product.cost)}</td>
                        <td className="text-right py-3 px-4 text-gray-700">{product.units_sold}</td>
                        <td className="text-right py-3 px-4 font-medium text-gray-900">{formatCurrency(product.revenue)}</td>
                        <td className="text-right py-3 px-4 text-gray-700">{formatCurrency(product.total_cost)}</td>
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

        {/* Tax Management Tab */}
        {activeTab === 'tax' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tax Configuration</h3>
            <div className="space-y-4 max-w-md">
              <Input
                label="VAT Rate on Sales (%)"
                type="number"
                step="0.01"
                value={taxRate.toString()}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                helperText="Default: 15% VAT for South Africa"
              />
              <Input
                label="Import VAT Rate (%)"
                type="number"
                step="0.01"
                value={importVatRate.toString()}
                onChange={(e) => setImportVatRate(parseFloat(e.target.value) || 0)}
                helperText="15% on cost of products (reclaimable)"
              />
              <Input
                label="Corporate Income Tax Rate (%)"
                type="number"
                step="0.01"
                value={corporateTaxRate.toString()}
                onChange={(e) => setCorporateTaxRate(parseFloat(e.target.value) || 0)}
                helperText="Default: 27% for South African companies"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tax-inclusive"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="tax-inclusive" className="text-sm text-gray-700">
                  Prices include tax (tax-inclusive pricing)
                </label>
              </div>
              <Button onClick={handleUpdateTaxConfig}>
                Save Tax Configuration
              </Button>
            </div>
          </Card>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Reports</h3>
            <p className="text-gray-600">Reports coming soon...</p>
          </Card>
        )}

        {/* Procurement Tab */}
        {activeTab === 'procurement' && (
          <ProcurementSection />
        )}

        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <ShipmentsSection />
        )}

        {/* Customs Calculator Tab */}
        {activeTab === 'customs' && (
          <CustomsCalculatorSection />
        )}

        {/* Distributors Tab */}
        {activeTab === 'distributors' && (
          <DistributorsSection />
        )}

        {/* Stock Allocation Tab */}
        {activeTab === 'stock-allocation' && (
          <StockAllocationSection />
        )}

        {/* Franchise Financials Tab */}
        {activeTab === 'franchise-financials' && (
          <FranchiseFinancialsSection />
        )}
      </div>
    </div>
  )
}

