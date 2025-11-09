import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from './Card'

interface ReorderAlertProps {
  currentStock: number
  reorderPoint: number
  productName: string
  variantName?: string
  onReorder?: () => void
  className?: string
}

export function ReorderAlert({
  currentStock,
  reorderPoint,
  productName,
  variantName,
  onReorder,
  className = ''
}: ReorderAlertProps) {
  const shortfall = reorderPoint - currentStock
  const isCritical = currentStock < (reorderPoint * 0.5)

  return (
    <Card className={`p-4 border-l-4 ${isCritical ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-600' : 'text-orange-600'} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {productName}
            {variantName && <span className="text-gray-600 font-normal"> - {variantName}</span>}
          </h4>
          <p className="text-sm text-gray-700 mb-2">
            Current stock: <span className="font-semibold">{currentStock}</span> | 
            Reorder point: <span className="font-semibold">{reorderPoint}</span> | 
            Shortfall: <span className="font-semibold text-red-600">{shortfall}</span>
          </p>
          {onReorder && (
            <button
              onClick={onReorder}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark as Ordered →
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

