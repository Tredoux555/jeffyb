'use client'

import React, { useState, useEffect } from 'react'
import { ProductVariant } from '@/types/database'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { MultiImageUpload } from '@/components/MultiImageUpload'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Package
} from 'lucide-react'

interface VariantManagerProps {
  productId: string
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  onAttributesChange?: (hasAttributes: boolean) => void
  disabled?: boolean
}

interface VariantFormData {
  id?: string
  sku: string
  variant_attributes: Record<string, string>
  price: string
  stock: string
  image_url: string
}

export function VariantManager({ 
  productId, 
  variants, 
  onVariantsChange,
  onAttributesChange,
  disabled = false 
}: VariantManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [formData, setFormData] = useState<VariantFormData>({
    sku: '',
    variant_attributes: {},
    price: '',
    stock: '',
    image_url: ''
  })
  const [variantAttributes, setVariantAttributes] = useState<Record<string, string[]>>({})
  const [uploading, setUploading] = useState(false)

  // Log component mount
  useEffect(() => {
    console.log('[VariantManager] Component mounted')
    console.log('[VariantManager] Current variants:', variants)
    console.log('[VariantManager] Product ID:', productId)
  }, [])

  useEffect(() => {
    // Extract unique attribute names and values from existing variants
    const attributes: Record<string, Set<string>> = {}
    
    variants.forEach(variant => {
      Object.entries(variant.variant_attributes).forEach(([key, value]) => {
        if (!attributes[key]) {
          attributes[key] = new Set()
        }
        attributes[key].add(value)
      })
    })

    // Convert Sets to Arrays
    const attributesArray: Record<string, string[]> = {}
    Object.entries(attributes).forEach(([key, values]) => {
      attributesArray[key] = Array.from(values)
    })

    setVariantAttributes(attributesArray)
  }, [variants])
  
  // Notify parent when variant attributes change
  useEffect(() => {
    const hasAttributes = Object.keys(variantAttributes).length > 0
    onAttributesChange?.(hasAttributes)
  }, [variantAttributes, onAttributesChange])

  const handleAddAttribute = () => {
    try {
      console.log('[VariantManager] Add attribute clicked')
      const attributeName = prompt('Enter attribute name (e.g., Size, Color, Material):')
      console.log('[VariantManager] Attribute name entered:', attributeName)
      if (attributeName && attributeName.trim()) {
        console.log('[VariantManager] Setting new attribute:', attributeName.trim())
        setVariantAttributes(prev => {
          const updated = {
            ...prev,
            [attributeName.trim()]: []
          }
          console.log('[VariantManager] Updated attributes:', updated)
          return updated
        })
      }
    } catch (error) {
      console.error('[VariantManager] Error in handleAddAttribute:', error)
      alert(`Error adding attribute: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleAddAttributeValue = (attributeName: string) => {
    try {
      console.log('[VariantManager] Add value clicked for attribute:', attributeName)
      const value = prompt(`Enter value for ${attributeName}:`)
      console.log('[VariantManager] Value entered:', value)
      
      if (value && value.trim()) {
        console.log('[VariantManager] Adding value:', value.trim(), 'to attribute:', attributeName)
        setVariantAttributes(prev => {
          const currentValues = prev[attributeName] || []
          const newValues = [...currentValues, value.trim()]
          const updated = {
            ...prev,
            [attributeName]: newValues
          }
          console.log('[VariantManager] Updated attribute values:', updated)
          return updated
        })
      }
    } catch (error) {
      console.error('[VariantManager] Error in handleAddAttributeValue:', error)
      alert(`Error adding attribute value: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRemoveAttributeValue = (attributeName: string, value: string) => {
    setVariantAttributes(prev => ({
      ...prev,
      [attributeName]: prev[attributeName].filter(v => v !== value)
    }))
  }

  const handleRemoveAttribute = (attributeName: string) => {
    const newAttributes = { ...variantAttributes }
    delete newAttributes[attributeName]
    setVariantAttributes(newAttributes)
  }

  const generateAllCombinations = () => {
    try {
      console.log('[VariantManager] Generating combinations...')
      const attributeNames = Object.keys(variantAttributes)
      console.log('[VariantManager] Attribute names:', attributeNames)
      
      if (attributeNames.length === 0) {
        console.log('[VariantManager] No attributes, returning empty array')
        return []
      }

      const combinations: Record<string, string>[] = []
      
      const generateCombinations = (current: Record<string, string>, remaining: string[]) => {
        if (remaining.length === 0) {
          combinations.push(current)
          return
        }

        const attributeName = remaining[0]
        const values = variantAttributes[attributeName]
        
        console.log('[VariantManager] Processing attribute:', attributeName, 'Values:', values)
        
        if (!values || values.length === 0) {
          console.warn('[VariantManager] Attribute has no values:', attributeName)
          return
        }
        
        values.forEach(value => {
          generateCombinations(
            { ...current, [attributeName]: value },
            remaining.slice(1)
          )
        })
      }

      generateCombinations({}, attributeNames)
      console.log('[VariantManager] Generated', combinations.length, 'combinations')
      return combinations
    } catch (error) {
      console.error('[VariantManager] Error in generateAllCombinations:', error)
      return []
    }
  }

  const handleBulkAddVariants = () => {
    try {
      console.log('[VariantManager] Generate combinations clicked')
      console.log('[VariantManager] Current variantAttributes:', variantAttributes)
      
      const combinations = generateAllCombinations()
      console.log('[VariantManager] Generated combinations:', combinations)
      
      if (!combinations || combinations.length === 0) {
        console.log('[VariantManager] No combinations to add')
        return
      }

      console.log('[VariantManager] Creating', combinations.length, 'new variants')
      const newVariants: ProductVariant[] = combinations.map((attributes, index) => ({
        id: `temp-${Date.now()}-${index}`,
        product_id: productId,
        sku: '',
        variant_attributes: attributes,
        price: null,
        stock: 0,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('[VariantManager] New variants created:', newVariants)
      console.log('[VariantManager] Total variants will be:', variants.length + newVariants.length)

      onVariantsChange([...variants, ...newVariants])
      console.log('[VariantManager] Variants updated successfully')
    } catch (error) {
      console.error('[VariantManager] Error in handleBulkAddVariants:', error)
      alert(`Error generating variants: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setFormData({
      id: variant.id,
      sku: variant.sku || '',
      variant_attributes: variant.variant_attributes,
      price: variant.price?.toString() || '',
      stock: variant.stock.toString(),
      image_url: variant.image_url || ''
    })
  }

  const handleSaveVariant = () => {
    if (!editingVariant) return

    const updatedVariants = variants.map(variant => {
      if (variant.id === editingVariant) {
        return {
          ...variant,
          sku: formData.sku,
          variant_attributes: formData.variant_attributes,
          price: formData.price ? parseFloat(formData.price) : null,
          stock: parseInt(formData.stock) || 0,
          image_url: formData.image_url || null
        }
      }
      return variant
    })

    onVariantsChange(updatedVariants)
    setEditingVariant(null)
    setFormData({
      sku: '',
      variant_attributes: {},
      price: '',
      stock: '',
      image_url: ''
    })
  }

  const handleDeleteVariant = (variantId: string) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      onVariantsChange(variants.filter(v => v.id !== variantId))
    }
  }

  const handleImageUpload = async (files: File[]) => {
    setUploading(true)
    try {
      // This would integrate with your existing image upload logic
      // For now, we'll just set a placeholder
      const imageUrl = `placeholder-${Date.now()}`
      setFormData(prev => ({ ...prev, image_url: imageUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  const formatVariantDisplay = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Variant Attributes Management */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Variant Attributes
          </h3>
          <Button
            onClick={handleAddAttribute}
            size="sm"
            variant="outline"
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Attribute
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(variantAttributes).map(([attributeName, values]) => (
            <div key={attributeName} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">{attributeName}</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddAttributeValue(attributeName)}
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Value
                  </Button>
                  <Button
                    onClick={() => handleRemoveAttribute(attributeName)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    disabled={disabled}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map((value, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-jeffy-yellow-light text-gray-700 rounded-full text-sm"
                  >
                    {value}
                    <button
                      onClick={() => handleRemoveAttributeValue(attributeName, value)}
                      className="hover:text-red-600"
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(variantAttributes).length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleBulkAddVariants}
                className="w-full"
                disabled={disabled}
              >
                Generate All Variant Combinations
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Variants List */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Variants ({variants.length})
        </h3>

        {variants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No variants created yet</p>
            <p className="text-sm">Add variant attributes above and generate combinations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {editingVariant === variant.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Product SKU"
                      />
                      <Input
                        label="Stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="0"
                      />
                      <Input
                        label="Price Override (optional)"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Leave empty to use product price"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Image (optional)
                      </label>
                      <MultiImageUpload
                        onUpload={handleImageUpload}
                        onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        currentImages={formData.image_url ? [formData.image_url] : []}
                        disabled={uploading || disabled}
                        maxFiles={1}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatVariantDisplay(variant.variant_attributes)}
                          </p>
                          <p className="text-sm text-gray-600">
                            SKU: {variant.sku || 'Not set'} | 
                            Stock: {variant.stock} | 
                            Price: {variant.price ? `$${variant.price.toFixed(2)}` : 'Use product price'}
                          </p>
                        </div>
                      </div>
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
