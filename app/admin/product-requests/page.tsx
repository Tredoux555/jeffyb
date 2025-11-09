'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ProductRequest } from '@/types/database'
import { 
  Package, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'

export default function ProductRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ProductRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    checkAuth()
    fetchRequests()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/product-requests')
      const result = await response.json()
      
      if (result.success) {
        setRequests(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching product requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: ProductRequest['status']) => {
    try {
      const response = await fetch(`/api/admin/product-requests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus
        })
      })

      const result = await response.json()
      if (result.success) {
        fetchRequests()
      }
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request status')
    }
  }

  const getStatusColor = (status: ProductRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewing':
        return 'bg-blue-100 text-blue-800'
      case 'sourcing':
        return 'bg-purple-100 text-purple-800'
      case 'found':
        return 'bg-green-100 text-green-800'
      case 'unavailable':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: ProductRequest['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'normal':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading product requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Requests</h1>
          <p className="text-gray-600">Manage customer product requests</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product name, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="sourcing">Sourcing</option>
              <option value="found">Found</option>
              <option value="unavailable">Unavailable</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No product requests found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {request.product_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${getUrgencyColor(request.urgency)}`} title={`Urgency: ${request.urgency}`} />
                          {request.category && (
                            <span className="text-sm text-gray-600">
                              Category: {request.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {request.description && (
                      <p className="text-gray-700 mb-3">{request.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      {request.estimated_price_range && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Price Range:</span>
                          <span>{request.estimated_price_range}</span>
                        </div>
                      )}
                      {request.quantity_needed && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Quantity:</span>
                          <span>{request.quantity_needed}</span>
                        </div>
                      )}
                      {request.requester_name && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Name:</span>
                          <span>{request.requester_name}</span>
                        </div>
                      )}
                      {request.requester_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${request.requester_email}`} className="hover:text-jeffy-yellow">
                            {request.requester_email}
                          </a>
                        </div>
                      )}
                      {request.requester_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${request.requester_phone}`} className="hover:text-jeffy-yellow">
                            {request.requester_phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-600">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-col gap-2">
                    <select
                      value={request.status}
                      onChange={(e) => updateRequestStatus(request.id, e.target.value as ProductRequest['status'])}
                      className={`px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow outline-none ${getStatusColor(request.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="sourcing">Sourcing</option>
                      <option value="found">Found</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

