/**
 * Pricing Calculator
 * Calculates product costs including transport, duties, taxes, and suggested selling prices
 */

export interface CostBreakdownInput {
  baseCost: number // Cost from China
  transportCostPerUnit: number // Per product transport cost
  transportCostPerShipment: number // Overall shipment cost (to be allocated)
  customDutyRate: number // Percentage (0-100)
  importVatRate?: number // Default 15%
  salesVatRate?: number // Default 15%
  corporateTaxRate?: number // Default 27%
  desiredProfitMargin?: number // Percentage (default 30%)
  totalProductsInShipment?: number // For allocating shipment transport cost
  productCostProportion?: number // Proportion of this product's cost vs total shipment cost
}

export interface CostBreakdownResult {
  // Input values
  baseCost: number
  transportCostPerUnit: number
  transportCostPerShipment: number
  allocatedShipmentTransportCost: number // Calculated allocation
  
  // Cost calculations
  subtotalBeforeDuties: number // baseCost + transportCostPerUnit + allocatedShipmentTransportCost
  customDutyAmount: number // Calculated from duty rate
  costBeforeImportVat: number // subtotalBeforeDuties + customDutyAmount
  importVatAmount: number // 15% on costBeforeImportVat (reclaimable)
  totalLandedCost: number // costBeforeImportVat + importVatAmount
  effectiveCost: number // totalLandedCost - importVatAmount (after reclaim)
  
  // Pricing calculations
  desiredProfitMargin: number
  priceBeforeSalesVat: number // effectiveCost + (effectiveCost * profitMargin / 100)
  salesVatAmount: number // 15% on priceBeforeSalesVat
  finalSellingPrice: number // priceBeforeSalesVat + salesVatAmount
  
  // Tax breakdown
  importVatReclaimable: number // Same as importVatAmount (can be reclaimed)
  corporateTaxOnProfit: number // 27% on profit before corporate tax
  profitBeforeCorporateTax: number // priceBeforeSalesVat - effectiveCost - salesVatAmount
  netProfitAfterTax: number // profitBeforeCorporateTax - corporateTaxOnProfit
  
  // Rates used
  customDutyRate: number
  importVatRate: number
  salesVatRate: number
  corporateTaxRate: number
}

/**
 * Calculate cost breakdown and suggested selling price
 */
export function calculateCostBreakdown(input: CostBreakdownInput): CostBreakdownResult {
  const {
    baseCost,
    transportCostPerUnit,
    transportCostPerShipment,
    customDutyRate,
    importVatRate = 15.00,
    salesVatRate = 15.00,
    corporateTaxRate = 27.00,
    desiredProfitMargin = 30.00,
    totalProductsInShipment = 1,
    productCostProportion = 1.0 // Default: 100% if only one product
  } = input

  // Step 1: Allocate shipment transport cost proportionally
  // If productCostProportion is provided, use it; otherwise allocate equally
  const allocatedShipmentTransportCost = productCostProportion < 1.0
    ? transportCostPerShipment * productCostProportion
    : transportCostPerShipment / totalProductsInShipment

  // Step 2: Calculate subtotal before duties
  const subtotalBeforeDuties = baseCost + transportCostPerUnit + allocatedShipmentTransportCost

  // Step 3: Calculate custom duties
  const customDutyAmount = subtotalBeforeDuties * (customDutyRate / 100)

  // Step 4: Calculate cost before import VAT
  const costBeforeImportVat = subtotalBeforeDuties + customDutyAmount

  // Step 5: Calculate import VAT (15% on cost, reclaimable)
  const importVatAmount = costBeforeImportVat * (importVatRate / 100)

  // Step 6: Calculate total landed cost
  const totalLandedCost = costBeforeImportVat + importVatAmount

  // Step 7: Calculate effective cost (after reclaiming import VAT)
  const effectiveCost = totalLandedCost - importVatAmount

  // Step 8: Calculate price before sales VAT (with desired profit margin)
  const priceBeforeSalesVat = effectiveCost * (1 + desiredProfitMargin / 100)

  // Step 9: Calculate sales VAT (15% on selling price)
  const salesVatAmount = priceBeforeSalesVat * (salesVatRate / 100)

  // Step 10: Calculate final selling price
  const finalSellingPrice = priceBeforeSalesVat + salesVatAmount

  // Step 11: Calculate profit and corporate tax
  const profitBeforeCorporateTax = priceBeforeSalesVat - effectiveCost - salesVatAmount
  const corporateTaxOnProfit = Math.max(0, profitBeforeCorporateTax) * (corporateTaxRate / 100)
  const netProfitAfterTax = profitBeforeCorporateTax - corporateTaxOnProfit

  return {
    baseCost,
    transportCostPerUnit,
    transportCostPerShipment,
    allocatedShipmentTransportCost,
    subtotalBeforeDuties,
    customDutyAmount,
    costBeforeImportVat,
    importVatAmount,
    totalLandedCost,
    effectiveCost,
    desiredProfitMargin,
    priceBeforeSalesVat,
    salesVatAmount,
    finalSellingPrice,
    importVatReclaimable: importVatAmount,
    profitBeforeCorporateTax,
    corporateTaxOnProfit,
    netProfitAfterTax,
    customDutyRate,
    importVatRate,
    salesVatRate,
    corporateTaxRate
  }
}

/**
 * Calculate proportion of product cost vs total shipment cost
 * Used for allocating shipment transport costs proportionally
 */
export function calculateProductCostProportion(
  productBaseCost: number,
  totalShipmentBaseCost: number
): number {
  if (totalShipmentBaseCost === 0) return 1.0
  return productBaseCost / totalShipmentBaseCost
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}


