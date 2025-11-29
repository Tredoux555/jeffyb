'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { Product, ProductVariant, CustomDutyRate } from '@/types/database'
import { CostBreakdownResult } from '@/lib/pricing/calculator'
import { formatCurrency, formatPercentage } from '@/lib/pricing/calculator'
import { 
  Calculator, 
  ArrowLeft,
  Package,
  Save,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function PricingCalculatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [dutyRates, setDutyRates] = useState<CustomDutyRate[]>([])
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  
  // Input fields
  const [baseCost, setBaseCost] = useState('')
  const [transportCostPerUnit, setTransportCostPerUnit] = useState('')
  const [transportCostPerShipment, setTransportCostPerShipment] = useState('')
  const [customDutyRate, setCustomDutyRate] = useState('')
  const [desiredProfitMargin, setDesiredProfitMargin] = useState('30')
  const [totalProductsInShipment, setTotalProductsInShipment] = useState('1')
  const [notes, setNotes] = useState('')
  
  // Results
  const [breakdown, setBreakdown] = useState<CostBreakdownResult | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAuth()
    fetchProducts()
    fetchDutyRates()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      loadProductData()
    }
  }, [selectedProductId, selectedVariantId])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDutyRates = async () => {
    try {
      const response = await fetch('/api/admin/pricing-calculator?action=duty-rates')
      const result = await response.json()
      if (result.success) {
        setDutyRates(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching duty rates:', error)
    }
  }

  const loadProductData = async () => {
    if (!selectedProductId) return

    try {
      const response = await fetch(
        `/api/admin/pricing-calculator?action=product&productId=${selectedProductId}${selectedVariantId ? `&variantId=${selectedVariantId}` : ''}`
      )
      const result = await response.json()

      if (result.success && result.data) {
        const { product, variant, dutyRate } = result.data
        setSelectedProduct(product)
        setSelectedVariant(variant || null)
        
        // Set default values
        setBaseCost(product.cost?.toString() || variant?.cost?.toString() || '')
        setTransportCostPerUnit(product.transport_cost?.toString() || variant?.transport_cost?.toString() || '')
        setCustomDutyRate(dutyRate?.toString() || product.category_duty_rate?.toString() || product.custom_duty_rate?.toString() || '')
        
        // Load existing breakdown if exists
        const breakdownResponse = await fetch(
          `/api/admin/pricing-calculator?action=breakdown&productId=${selectedProductId}${selectedVariantId ? `&variantId=${selectedVariantId}` : ''}`
        )
        const breakdownResult = await breakdownResponse.json()
        
        if (breakdownResult.success && breakdownResult.data) {
          const existing = breakdownResult.data
          setBaseCost(existing.base_cost?.toString() || '')
          setTransportCostPerUnit(existing.transport_cost_per_unit?.toString() || '')
          setTransportCostPerShipment(existing.transport_cost_per_shipment?.toString() || '')
          setCustomDutyRate(existing.custom_duty_rate?.toString() || '')
          setDesiredProfitMargin(existing.desired_profit_margin?.toString() || '30')
          setNotes(existing.notes || '')
        }
      }
    } catch (error) {
      console.error('Error loading product data:', error)
    }
  }

  const handleCalculate = async () => {
    if (!baseCost || parseFloat(baseCost) <= 0) {
      alert('Please enter a valid base cost')
      return
    }

    if (!customDutyRate || parseFloat(customDutyRate) < 0) {
      alert('Please enter a valid custom duty rate')
      return
    }

    setCalculating(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/admin/pricing-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate',
          baseCost: parseFloat(baseCost),
          transportCostPerUnit: parseFloat(transportCostPerUnit) || 0,
          transportCostPerShipment: parseFloat(transportCostPerShipment) || 0,
          customDutyRate: parseFloat(customDutyRate),
          desiredProfitMargin: parseFloat(desiredProfitMargin) || 30,
          totalProductsInShipment: parseInt(totalProductsInShipment) || 1,
          productCostProportion: 1.0 // TODO: Calculate based on total shipment cost
        })
      })

      const result = await response.json()

      if (result.success) {
        setBreakdown(result.data)
      } else {
        alert(result.error || 'Failed to calculate breakdown')
      }
    } catch (error) {
      console.error('Error calculating:', error)
      alert('Failed to calculate cost breakdown')
    } finally {
      setCalculating(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProductId || !breakdown) {
      alert('Please select a product and calculate the breakdown first')
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/admin/pricing-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          productId: selectedProductId,
          variantId: selectedVariantId || null,
          baseCost,
          transportCostPerUnit: transportCostPerUnit || 0,
          transportCostPerShipment: transportCostPerShipment || 0,
          customDutyRate,
          customDutyAmount: breakdown.customDutyAmount,
          importVatAmount: breakdown.importVatAmount,
          totalLandedCost: breakdown.totalLandedCost,
          effectiveCost: breakdown.effectiveCost,
          suggestedSellingPrice: breakdown.finalSellingPrice,
          desiredProfitMargin: desiredProfitMargin || 30,
          notes
        })
      })

      const result = await response.json()

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Cost breakdown saved successfully!' })
        setTimeout(() => setSaveMessage(null), 5000)
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save breakdown' })
      }
    } catch (error) {
      console.error('Error saving:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save cost breakdown' })
    } finally {
      setSaving(false)
    }
  }

  const selectedProductData = selectedProduct
  const selectedVariantData = selectedVariant || null
  const productVariants = selectedProductData?.variants || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Calculator className="w-12 h-12 text-jeffy-yellow animate-bounce" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-jeffy-yellow" />
                Pricing Calculator
              </h1>
              <p className="text-gray-600 mt-2">
                Calculate product costs including transport, duties, taxes, and suggested selling prices
              </p>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product & Cost Input</h2>
            
            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                    setSelectedVariantId('')
                    setBreakdown(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                >
                  <option value="">-- Select a product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Selection (if product has variants) */}
              {selectedProductData?.has_variants && productVariants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Variant (Optional)
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value)
                      setBreakdown(null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                  >
                    <option value="">-- Use base product --</option>
                    {productVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {Object.entries(variant.variant_attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Base Cost */}
              <Input
                label="Base Cost (from China) *"
                type="number"
                step="0.01"
                value={baseCost}
                onChange={(e) => setBaseCost(e.target.value)}
                placeholder="0.00"
                helperText="Cost per unit from supplier"
              />

              {/* Transport Costs */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Transport Cost (Per Unit)"
                  type="number"
                  step="0.01"
                  value={transportCostPerUnit}
                  onChange={(e) => setTransportCostPerUnit(e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  label="Transport Cost (Per Shipment)"
                  type="number"
                  step="0.01"
                  value={transportCostPerShipment}
                  onChange={(e) => setTransportCostPerShipment(e.target.value)}
                  placeholder="0.00"
                  helperText="Total shipment cost (allocated proportionally)"
                />
              </div>

              {/* Custom Duty Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Duty Rate (%) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={customDutyRate}
                    onChange={(e) => setCustomDutyRate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                  >
                    <option value="">-- Select category --</option>
                    {dutyRates.map((rate) => (
                      <option key={rate.id} value={rate.duty_rate}>
                        {rate.category}: {rate.duty_rate}%
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={customDutyRate}
                    onChange={(e) => setCustomDutyRate(e.target.value)}
                    placeholder="0.00"
                    className="w-32"
                  />
                </div>
                {selectedProductData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {selectedProductData.category} - Default rate: {
                      dutyRates.find(r => r.category === selectedProductData.category)?.duty_rate || 0
                    }%
                  </p>
                )}
              </div>

              {/* Profit Margin */}
              <Input
                label="Desired Profit Margin (%)"
                type="number"
                step="0.01"
                value={desiredProfitMargin}
                onChange={(e) => setDesiredProfitMargin(e.target.value)}
                placeholder="30"
                helperText="Default: 30%"
              />

              {/* Shipment Details */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Total Products in Shipment"
                  type="number"
                  value={totalProductsInShipment}
                  onChange={(e) => setTotalProductsInShipment(e.target.value)}
                  placeholder="1"
                  helperText="For allocating shipment transport cost"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                  placeholder="Additional notes about this calculation..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCalculate}
                  disabled={calculating || !baseCost || !customDutyRate}
                  className="flex-1"
                >
                  {calculating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate
                    </>
                  )}
                </Button>
                {breakdown && selectedProductId && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Breakdown
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Results */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Cost Breakdown</h2>
            
            {!breakdown ? (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Enter product details and click "Calculate" to see the breakdown</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cost Components */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-jeffy-yellow" />
                    Cost Components
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Cost:</span>
                      <span className="font-medium">{formatCurrency(breakdown.baseCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport (Per Unit):</span>
                      <span className="font-medium">{formatCurrency(breakdown.transportCostPerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport (Shipment Allocated):</span>
                      <span className="font-medium">{formatCurrency(breakdown.allocatedShipmentTransportCost)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Subtotal Before Duties:</span>
                      <span className="font-semibold">{formatCurrency(breakdown.subtotalBeforeDuties)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Custom Duties ({formatPercentage(breakdown.customDutyRate)}):</span>
                      <span className="font-medium">{formatCurrency(breakdown.customDutyAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Cost Before Import VAT:</span>
                      <span className="font-semibold">{formatCurrency(breakdown.costBeforeImportVat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Import VAT ({formatPercentage(breakdown.importVatRate)}):</span>
                      <span className="font-medium text-blue-600">{formatCurrency(breakdown.importVatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Total Landed Cost:</span>
                      <span className="font-semibold">{formatCurrency(breakdown.totalLandedCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Import VAT Reclaimable:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(breakdown.importVatReclaimable)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-jeffy-yellow">
                      <span className="text-gray-900 font-bold">Effective Cost:</span>
                      <span className="font-bold text-jeffy-yellow">{formatCurrency(breakdown.effectiveCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-jeffy-yellow" />
                    Suggested Pricing
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Cost:</span>
                      <span className="font-medium">{formatCurrency(breakdown.effectiveCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin ({formatPercentage(breakdown.desiredProfitMargin)}):</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(breakdown.priceBeforeSalesVat - breakdown.effectiveCost)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Price Before Sales VAT:</span>
                      <span className="font-semibold">{formatCurrency(breakdown.priceBeforeSalesVat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sales VAT ({formatPercentage(breakdown.salesVatRate)}):</span>
                      <span className="font-medium">{formatCurrency(breakdown.salesVatAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-jeffy-yellow">
                      <span className="text-gray-900 font-bold text-lg">Final Selling Price:</span>
                      <span className="font-bold text-lg text-jeffy-yellow">{formatCurrency(breakdown.finalSellingPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Profit Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Before Corporate Tax:</span>
                      <span className="font-medium">{formatCurrency(breakdown.profitBeforeCorporateTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Corporate Tax ({formatPercentage(breakdown.corporateTaxRate)}):</span>
                      <span className="font-medium text-red-600">-{formatCurrency(breakdown.corporateTaxOnProfit)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                      <span className="text-gray-900 font-bold">Net Profit After Tax:</span>
                      <span className={`font-bold ${breakdown.netProfitAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(breakdown.netProfitAfterTax)}
                      </span>
                    </div>
                    {breakdown.finalSellingPrice > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Profit Margin:</span>
                          <span className="font-medium">
                            {((breakdown.netProfitAfterTax / breakdown.finalSellingPrice) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


