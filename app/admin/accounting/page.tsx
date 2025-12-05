'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
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
  Download,
  BarChart3,
  ArrowLeft,
  Truck,
  Store,
  Settings,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalCosts: number
  effectiveCosts: number
  netProfit: number
  profitBeforeTax: number
  taxOwed: number
  importVatPaid: number
  importVatReclaimable: number
  corporateTaxOwed: number
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

type TabId = 'dashboard' | 'procurement' | 'franchise' | 'settings'
type SubTabId = 'queue' | 'shipments' | 'customs' | 'distributors' | 'stock' | 'financials' | 'tax' | 'products'

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('queue')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month')
  
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
  }, [dateRange])

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
      const response = await fetch(`/api/admin/accounting?endpoint=dashboard&range=${dateRange}`)
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
      const response = await fetch(`/api/admin/accounting?endpoint=products-profit&range=${dateRange}`)
      const result = await response.json()
      
      if (result.success) {
        setProductsProfit(result.data)
      }
    } catch (error) {
      console.error('Error fetching products profit:', error)
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
    if (activeSubTab === 'products') {
      fetchProductsProfit()
    }
  }, [activeSubTab, dateRange])

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

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  const handleExportCSV = () => {
    if (productsProfit.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['Product Name', 'Category', 'Selling Price', 'Cost', 'Units Sold', 'Revenue', 'Total Cost', 'Profit', 'Profit Margin %']
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
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
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

  // Main tabs configuration
  const mainTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'procurement', label: 'Procurement & Shipping', icon: Truck },
    { id: 'franchise', label: 'Franchises', icon: Store },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (loading && activeTab === 'dashboard') {
    return <LoadingSpinner message="Loading financial data..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Accounting & Finance</h1>
            <p className="text-slate-600">Financial tracking, procurement, and reporting</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Period:</span>
            {(['today', 'week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Main Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabId)
                  // Reset sub-tab based on main tab
                  if (tab.id === 'procurement') setActiveSubTab('queue')
                  else if (tab.id === 'franchise') setActiveSubTab('stock')
                  else if (tab.id === 'settings') setActiveSubTab('tax')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4" hover>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(dashboardStats.totalRevenue)}</p>
              </Card>
              
              <Card className="p-4" hover>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Total Costs</span>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(dashboardStats.totalCosts)}</p>
                <p className="text-xs text-slate-500 mt-1">Effective: {formatCurrency(dashboardStats.effectiveCosts)}</p>
              </Card>
              
              <Card className="p-4" hover>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Net Profit</span>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className={`text-2xl font-bold ${dashboardStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dashboardStats.netProfit)}
                </p>
              </Card>
              
              <Card className="p-4" hover>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Profit Margin</span>
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <p className={`text-2xl font-bold ${dashboardStats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(dashboardStats.profitMargin)}
                </p>
              </Card>
            </div>

            {/* Tax Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tax Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 mb-1">VAT on Sales</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(dashboardStats.taxOwed)}</p>
                  <p className="text-xs text-slate-600">15% VAT</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 mb-1">Import VAT (Reclaimable)</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(dashboardStats.importVatReclaimable)}</p>
                  <p className="text-xs text-slate-600">15% on cost</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 mb-1">Corporate Tax</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(dashboardStats.corporateTaxOwed)}</p>
                  <p className="text-xs text-slate-600">27% on profit</p>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Financial Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Gross Revenue</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(dashboardStats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Cost of Goods (COGS)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(dashboardStats.totalCosts)}</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-slate-700">Import VAT Reclaimed</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(dashboardStats.importVatReclaimable)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">VAT on Sales</span>
                  <span className="font-semibold text-slate-900">-{formatCurrency(dashboardStats.taxOwed)}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-slate-700">Profit Before Tax</span>
                  <span className="font-bold text-blue-600">{formatCurrency(dashboardStats.profitBeforeTax)}</span>
                </div>
                <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-700">Corporate Tax (27%)</span>
                  <span className="font-semibold text-orange-600">-{formatCurrency(dashboardStats.corporateTaxOwed)}</span>
                </div>
                <div className="flex justify-between p-4 bg-green-100 rounded-xl border-2 border-green-300">
                  <span className="font-bold text-slate-900">Net Profit After Tax</span>
                  <span className={`font-bold text-xl ${dashboardStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardStats.netProfit)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Procurement & Shipping Tab */}
        {activeTab === 'procurement' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
              {[
                { id: 'queue', label: 'Procurement Queue' },
                { id: 'shipments', label: 'Shipments' },
                { id: 'customs', label: 'Customs Calculator' },
                { id: 'distributors', label: 'Distributors' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTabId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSubTab === tab.id
                      ? 'bg-jeffy-yellow text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSubTab === 'queue' && <ProcurementSection />}
            {activeSubTab === 'shipments' && <ShipmentsSection />}
            {activeSubTab === 'customs' && <CustomsCalculatorSection />}
            {activeSubTab === 'distributors' && <DistributorsSection />}
          </div>
        )}

        {/* Franchises Tab */}
        {activeTab === 'franchise' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
              {[
                { id: 'stock', label: 'Stock Allocation' },
                { id: 'financials', label: 'Franchise Financials' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTabId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSubTab === tab.id
                      ? 'bg-jeffy-yellow text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSubTab === 'stock' && <StockAllocationSection />}
            {activeSubTab === 'financials' && <FranchiseFinancialsSection />}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
              {[
                { id: 'tax', label: 'Tax Configuration' },
                { id: 'products', label: 'Products & Profit' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTabId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSubTab === tab.id
                      ? 'bg-jeffy-yellow text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tax Configuration */}
            {activeSubTab === 'tax' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Tax Configuration</h3>
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
                      className="w-4 h-4 text-jeffy-yellow border-slate-300 rounded focus:ring-jeffy-yellow"
                    />
                    <label htmlFor="tax-inclusive" className="text-sm text-slate-700">
                      Prices include tax (tax-inclusive pricing)
                    </label>
                  </div>
                  <Button onClick={handleUpdateTaxConfig}>
                    Save Tax Configuration
                  </Button>
                </div>
              </Card>
            )}

            {/* Products & Profit */}
            {activeSubTab === 'products' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Products Profit Analysis</h3>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                {productsProfit.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600">No product sales data for the selected period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Cost</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Sold</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Profit</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsProfit.map((product) => (
                          <tr key={product.product_id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{product.product_name}</p>
                              <p className="text-xs text-slate-500">{product.category}</p>
                            </td>
                            <td className="text-right py-3 px-4 text-slate-900">{formatCurrency(product.selling_price)}</td>
                            <td className="text-right py-3 px-4 text-slate-700">{formatCurrency(product.cost)}</td>
                            <td className="text-right py-3 px-4 text-slate-700">{product.units_sold}</td>
                            <td className="text-right py-3 px-4 font-medium text-slate-900">{formatCurrency(product.revenue)}</td>
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
          </div>
        )}
      </div>
    </div>
  )
}
