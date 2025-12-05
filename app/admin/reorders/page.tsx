'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ArrowLeft, AlertTriangle, Package, CheckCircle } from 'lucide-react'

interface ReorderItem {
  product_id: string
  variant_id: string | null
  product_name: string
  variant_attributes: Record<string, string> | null
  current_stock: number
  reorder_point: number
  suggested_quantity: number
}

export default function ReordersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([])

  useEffect(() => {
    checkAuth()
    fetchReorderItems()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchReorderItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reorders')
      const result = await response.json()
      
      if (result.success) {
        setReorderItems(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching reorder items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsOrdered = async (productId: string, variantId: string | null) => {
    try {
      const response = await fetch('/api/admin/reorders/mark-ordered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId
        })
      })
      
      const result = await response.json()
      if (result.success) {
        fetchReorderItems()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error marking as ordered:', error)
      alert('Failed to mark as ordered')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading reorder items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reorder Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Items that need to be restocked</p>
          </div>
        </div>

        {reorderItems.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Stock Levels Good!</h3>
            <p className="text-gray-600">No items need to be reordered at this time.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reorderItems.map((item) => (
              <Card key={`${item.product_id}-${item.variant_id || 'none'}`} className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{item.product_name}</h3>
                    </div>
                    {item.variant_attributes && (
                      <p className="text-sm text-gray-600 mb-2">
                        Variant: {Object.entries(item.variant_attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="ml-2 font-semibold text-red-600">{item.current_stock}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reorder Point:</span>
                        <span className="ml-2 font-semibold">{item.reorder_point}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Suggested Qty:</span>
                        <span className="ml-2 font-semibold text-blue-600">{item.suggested_quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Shortfall:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          {item.reorder_point - item.current_stock}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleMarkAsOrdered(item.product_id, item.variant_id)}
                    variant="outline"
                  >
                    Mark as Ordered
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

