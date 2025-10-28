'use client'

import React, { useState } from 'react'
import { ProductVariant } from '@/types/database'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Package
} from 'lucide-react'

interface SimpleVariantManagerProps {
  productId: string
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  disabled?: boolean
}

interface AttributeState {
  name: string
  values: string[]
  checked: boolean
}

export function SimpleVariantManager({ 
  productId, 
  variants, 
  onVariantsChange,
  disabled = false 
}: SimpleVariantManagerProps) {
  const [attributes, setAttributes] = useState<AttributeState[]>([
    { name: 'Size', values: [''], checked: false },
    { name: 'Color', values: [''], checked: false },
    { name: 'Material', values: [''], checked: false }
  ])
  
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    price: '',
    stock: ''
  })

  const handleAttributeToggle = (index: number) => {
    const updated = [...attributes]
    updated[index].checked = !updated[index].checked
    setAttributes(updated)
  }

  const handleAttributeValueChange = (attrIndex: number, valueIndex: number, value: string) => {
    const updated = [...attributes]
    updated[attrIndex].values[valueIndex] = value
    setAttributes(updated)
  }

  const handleAddAttributeValue = (attrIndex: number) => {
    const updated = [...attributes]
    updated[attrIndex].values.push('')
    setAttributes(updated)
  }

  const handleRemoveAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updated = [...attributes]
    if (updated[attrIndex].values.length > 1) {
      updated[attrIndex].values.splice(valueIndex, 1)
      setAttributes(updated)
    }
  }

  const handleAddCustomAttribute = () => {
    const name = prompt('Enter custom attribute name:')
    if (name && name.trim()) {
      setAttributes([...attributes, { name: name.trim(), values: [''], checked: false }])
    }
  }

  const generateVariants = () => {
    // Get only checked attributes
    const activeAttributes = attributes.filter(attr => attr.checked)
    
    if (activeAttributes.length === 0) {
      alert('Please enable at least one attribute')
      return
    }

    // Filter out empty values
    const filteredAttributes = activeAttributes.map(attr => ({
      name: attr.name,
      values: attr.values.filter(v => v.trim() !== '')
    }))

    // Check if any attribute has no values
    const hasEmptyValue = filteredAttributes.some(attr => attr.values.length === 0)
    if (hasEmptyValue) {
      alert('Please add at least one value to each enabled attribute')
      return
    }

    // Generate all combinations
    const combinations: Record<string, string>[] = []
    
    const generate = (current: Record<string, string>, remaining: Array<{name: string, values: string[]}>) => {
      if (remaining.length === 0) {
        combinations.push(current)
        return
      }

      const [first, ...rest] = remaining
      first.values.forEach(value => {
        generate({ ...current, [first.name]: value }, rest)
      })
    }

    generate({}, filteredAttributes)

    // Create variants
    const newVariants: ProductVariant[] = combinations.map((combo, index) => ({
      id: `temp-${Date.now()}-${index}`,
      product_id: productId,
      sku: '',
      variant_attributes: combo,
      price: null,
      stock: 0,
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    onVariantsChange([...variants, ...newVariants])
    
    // Show success message
    alert(`Generated ${combinations.length} variant combinations!`)
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setFormData({
      sku: variant.sku || '',
      price: variant.price?.toString() || '',
      stock: variant.stock.toString()
    })
  }

  const handleSaveVariant = () => {
    if (!editingVariant) return

    const updated = variants.map(v => {
      if (v.id === editingVariant) {
        return {
          ...v,
          sku: formData.sku,
          price: formData.price ? parseFloat(formData.price) : null,
          stock: parseInt(formData.stock) || 0
        }
      }
      return v
    })

    onVariantsChange(updated)
    setEditingVariant(null)
    setFormData({ sku: '', price: '', stock: '' })
  }

  const handleDeleteVariant = (variantId: string) => {
    if (confirm('Delete this variant?')) {
      onVariantsChange(variants.filter(v => v.id !== variantId))
    }
  }

  const formatVariantDisplay = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Simple Attribute Management */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Variant Attributes
          </h3>
          <Button
            type="button"
            onClick={handleAddCustomAttribute}
            size="sm"
            variant="outline"
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Custom
          </Button>
        </div>

        <div className="space-y-3">
          {attributes.map((attr, attrIndex) => (
            <div key={attrIndex} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attr.checked}
                    onChange={() => handleAttributeToggle(attrIndex)}
                    className="w-4 h-4 text-jeffy-yellow focus:ring-jeffy-yellow rounded"
                    disabled={disabled}
                  />
                  <span className="font-medium text-gray-900">{attr.name}</span>
                </label>
                {attr.checked && (
                  <Button
                    type="button"
                    onClick={() => handleAddAttributeValue(attrIndex)}
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Value
                  </Button>
                )}
              </div>

              {attr.checked && (
                <div className="space-y-2">
                  {attr.values.map((value, valueIndex) => (
                    <div key={valueIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleAttributeValueChange(attrIndex, valueIndex, e.target.value)}
                        placeholder={`Enter ${attr.name.toLowerCase()}...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                        disabled={disabled}
                      />
                      {attr.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttributeValue(attrIndex, valueIndex)}
                          className="text-red-600 hover:text-red-700 p-2"
                          disabled={disabled}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button
              onClick={generateVariants}
              type="button"
              className="w-full"
              disabled={disabled || attributes.filter(a => a.checked).length === 0}
            >
              Generate Variant Combinations
            </Button>
          </div>
        </div>
      </Card>

      {/* Generated Variants Display */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generated Variants ({variants.length})
        </h3>

        {variants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No variants created yet</p>
            <p className="text-sm">Select attributes above and click "Generate"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {editingVariant === variant.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Optional SKU"
                      />
                      <Input
                        label="Stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                      <Input
                        label="Price Override (optional)"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Use product price"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveVariant} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingVariant(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatVariantDisplay(variant.variant_attributes)}
                      </p>
                      <p className="text-sm text-gray-600">
                        SKU: {variant.sku || 'Not set'} | 
                        Stock: {variant.stock} | 
                        Price: {variant.price ? `R${variant.price.toFixed(2)}` : 'Use product price'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditVariant(variant)}
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteVariant(variant.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={disabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

