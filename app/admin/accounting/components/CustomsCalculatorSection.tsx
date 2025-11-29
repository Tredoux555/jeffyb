'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { HSCodeSelector } from '@/components/HSCodeSelector'
import { calculateCostBreakdown } from '@/lib/pricing/calculator'
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export default function CustomsCalculatorSection() {
  const [formData, setFormData] = useState({
    baseCostRmb: '',
    baseCostZar: '',
    exchangeRate: '0.25', // Default RMB to ZAR
    shippingCost: '',
    insuranceCost: '',
    hsCode: '',
    dutyRate: '',
    quantity: '1'
  })

  const [calculation, setCalculation] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleHSCodeSelect = (hsCode: string, dutyRate: number) => {
    setFormData(prev => ({
      ...prev,
      hsCode,
      dutyRate: dutyRate.toString()
    }))
  }

  const handleCalculate = () => {
    const errors: Record<string, string> = {}

    if (!formData.baseCostRmb && !formData.baseCostZar) {
      errors.baseCost = 'Base cost is required'
    }
    if (!formData.hsCode) {
      errors.hsCode = 'HS code is required'
    }
    if (!formData.dutyRate) {
      errors.dutyRate = 'Duty rate is required'
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    setErrors({})

    // Convert RMB to ZAR if needed
    const baseCostZar = formData.baseCostZar 
      ? parseFloat(formData.baseCostZar)
      : parseFloat(formData.baseCostRmb) * parseFloat(formData.exchangeRate)

    const result = calculateCostBreakdown({
      baseCost: baseCostZar,
      transportCostPerUnit: parseFloat(formData.shippingCost) || 0,
      transportCostPerShipment: parseFloat(formData.shippingCost) || 0,
      customDutyRate: parseFloat(formData.dutyRate),
      importVatRate: 15.00,
      salesVatRate: 15.00,
      corporateTaxRate: 27.00,
      desiredProfitMargin: 30.00,
      totalProductsInShipment: parseInt(formData.quantity) || 1
    })

    setCalculation(result)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customs & Import Duty Calculator</h2>
        <p className="text-sm text-gray-600">
          Calculate import duties, VAT, and landed costs for products entering South Africa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Cost (RMB)"
                type="number"
                step="0.01"
                value={formData.baseCostRmb}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, baseCostRmb: e.target.value }))
                  if (formData.exchangeRate) {
                    const zar = parseFloat(e.target.value) * parseFloat(formData.exchangeRate)
                    setFormData(prev => ({ ...prev, baseCostZar: zar.toString() }))
                  }
                }}
                error={errors.baseCost}
              />
              <Input
                label="Base Cost (ZAR)"
                type="number"
                step="0.01"
                value={formData.baseCostZar}
                onChange={(e) => setFormData(prev => ({ ...prev, baseCostZar: e.target.value }))}
              />
            </div>

            <Input
              label="Exchange Rate (RMB to ZAR)"
              type="number"
              step="0.0001"
              value={formData.exchangeRate}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))
                if (formData.baseCostRmb) {
                  const zar = parseFloat(formData.baseCostRmb) * parseFloat(e.target.value)
                  setFormData(prev => ({ ...prev, baseCostZar: zar.toString() }))
                }
              }}
              helperText="Current rate: ~0.25 (check current rates)"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Shipping Cost (ZAR)"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
              />
              <Input
                label="Insurance Cost (ZAR)"
                type="number"
                step="0.01"
                value={formData.insuranceCost}
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceCost: e.target.value }))}
              />
            </div>

            <HSCodeSelector
              value={formData.hsCode}
              onChange={handleHSCodeSelect}
              label="HS Code / Customs Tariff"
            />

            {formData.dutyRate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Duty Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.dutyRate === '0' ? 'Free' : `${formData.dutyRate}%`}
                </p>
              </div>
            )}

            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            />

            <Button onClick={handleCalculate} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Customs & Costs
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Results</h3>
          
          {!calculation ? (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Enter product details and click Calculate</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cost Breakdown */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Cost</span>
                    <span className="font-medium">{formatCurrency(calculation.baseCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport Cost</span>
                    <span className="font-medium">{formatCurrency(calculation.transportCostPerUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal (Before Duties)</span>
                    <span className="font-medium">{formatCurrency(calculation.subtotalBeforeDuties)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Import Duty ({calculation.customDutyRate}%)</span>
                    <span className="font-semibold">{formatCurrency(calculation.customDutyAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Before Import VAT</span>
                    <span className="font-medium">{formatCurrency(calculation.costBeforeImportVat)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Import VAT (15%)</span>
                    <span className="font-semibold">{formatCurrency(calculation.importVatAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total Landed Cost</span>
                    <span className="text-lg">{formatCurrency(calculation.totalLandedCost)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Import VAT Reclaimable</span>
                    <span className="font-semibold">-{formatCurrency(calculation.importVatReclaimable)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Effective Cost (After VAT Reclaim)</span>
                    <span className="text-lg">{formatCurrency(calculation.effectiveCost)}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Suggestion */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold text-gray-900">Suggested Pricing</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Before Sales VAT</span>
                    <span className="font-medium">{formatCurrency(calculation.priceBeforeSalesVat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales VAT (15%)</span>
                    <span className="font-medium">{formatCurrency(calculation.salesVatAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                    <span>Final Selling Price</span>
                    <span className="text-jeffy-yellow">{formatCurrency(calculation.finalSellingPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="space-y-2 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">Profit Analysis</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Before Corporate Tax</span>
                    <span className={`font-medium ${calculation.profitBeforeCorporateTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculation.profitBeforeCorporateTax)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Corporate Tax (27%)</span>
                    <span className="font-medium text-orange-600">{formatCurrency(calculation.corporateTaxOnProfit)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Net Profit After Tax</span>
                    <span className={`text-lg ${calculation.netProfitAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculation.netProfitAfterTax)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

