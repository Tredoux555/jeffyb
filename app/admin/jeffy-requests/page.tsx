'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { JeffyRequest, JeffyApproval } from '@/types/database'
import { 
  ArrowLeft,
  Search,
  Package,
  Users,
  CheckCircle,
  Gift,
  Truck,
  Eye,
  RefreshCw,
  TrendingUp,
  Clock,
  ExternalLink,
  Copy,
  Filter
} from 'lucide-react'

interface JeffyRequestWithApprovals extends JeffyRequest {
  approvals?: JeffyApproval[]
}

export default function AdminJeffyRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<JeffyRequestWithApprovals[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<JeffyRequestWithApprovals | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    fulfilled: 0,
    totalApprovals: 0
  })

  useEffect(() => {
    checkAuth()
    fetchRequests()
  }, [statusFilter])

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
      const response = await fetch(`/api/jeffy-wants?type=all&status=${statusFilter}&limit=100`)
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data || [])
        
        // Calculate stats
        const all = data.data || []
        setStats({
          total: all.length,
          active: all.filter((r: JeffyRequest) => r.status === 'active').length,
          completed: all.filter((r: JeffyRequest) => r.status === 'completed').length,
          fulfilled: all.filter((r: JeffyRequest) => r.status === 'fulfilled').length,
          totalApprovals: all.reduce((sum: number, r: JeffyRequestWithApprovals) => 
            sum + (r.approvals?.length || r.approvals_received || 0), 0
          )
        })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      // For now, we'd need to add an admin API endpoint
      // This is a placeholder for the admin update functionality
      alert(`Update status to ${newStatus} - Admin API needed`)
      fetchRequests()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.request_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/want/${code}`
    navigator.clipboard.writeText(link)
    alert('Link copied!')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'fulfilled': return 'bg-purple-100 text-purple-700'
      case 'product_added': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading Jeffy requests..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Jeffy's Free Product Requests</h1>
              <p className="text-slate-600">Manage viral product requests and fulfillment</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Total Requests</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-slate-400" />
            </div>
          </Card>
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Fulfilled</p>
                <p className="text-2xl font-bold text-purple-600">{stats.fulfilled}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
          <Card className="p-4" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Total Approvals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalApprovals}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by request, name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-jeffy-yellow bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed (10+ approvals)</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="product_added">Product Added</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">No requests found</p>
            <p className="text-slate-500">
              Product requests will appear here when customers use the Free Product feature.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-4 hover:shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-slate-500">
                        #{request.referral_code}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      {request.is_free_product_earned && (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          FREE EARNED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-900 font-medium mb-2 line-clamp-2">
                      "{request.request_text}"
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {request.approvals_received}/{request.approvals_needed} approvals
                      </span>
                      <span>
                        {request.requester_name} ({request.requester_email})
                      </span>
                      <span>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.total_link_clicks > 0 && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <TrendingUp className="w-4 h-4" />
                          {request.total_link_clicks} clicks
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            request.approvals_received >= request.approvals_needed 
                              ? 'bg-green-500' 
                              : 'bg-jeffy-yellow'
                          }`}
                          style={{ width: `${Math.min((request.approvals_received / request.approvals_needed) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {Math.round((request.approvals_received / request.approvals_needed) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsModalOpen(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(request.referral_code)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    <a
                      href={`/want/${request.referral_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open Page
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Request Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Request #${selectedRequest?.referral_code}`}
          size="xl"
        >
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
                {selectedRequest.is_free_product_earned && (
                  <span className="px-3 py-1.5 rounded-lg font-semibold bg-green-100 text-green-700 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    FREE PRODUCT EARNED
                  </span>
                )}
              </div>

              {/* Request Details */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Product Request</h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-700">{selectedRequest.request_text}</p>
                </div>
              </div>

              {/* Requester Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Requester</h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                    <p><strong>Name:</strong> {selectedRequest.requester_name}</p>
                    <p><strong>Email:</strong> {selectedRequest.requester_email}</p>
                    {selectedRequest.requester_phone && (
                      <p><strong>Phone:</strong> {selectedRequest.requester_phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Stats</h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                    <p><strong>Approvals:</strong> {selectedRequest.approvals_received}/{selectedRequest.approvals_needed}</p>
                    <p><strong>Link Clicks:</strong> {selectedRequest.total_link_clicks}</p>
                    <p><strong>Created:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedRequest.shipping_address && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Shipping Address</h4>
                  <div className="bg-green-50 rounded-xl p-4 space-y-1">
                    <p><strong>Name:</strong> {selectedRequest.shipping_address.name}</p>
                    <p><strong>Address:</strong> {selectedRequest.shipping_address.address}</p>
                    <p><strong>City:</strong> {selectedRequest.shipping_address.city}, {selectedRequest.shipping_address.postal_code}</p>
                    <p><strong>Phone:</strong> {selectedRequest.shipping_address.phone}</p>
                  </div>
                </div>
              )}

              {/* Approvals List */}
              {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Approvals ({selectedRequest.approvals.length})
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                    {selectedRequest.approvals.map((approval, index) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                        <div>
                          <p className="font-medium text-slate-900">
                            {index + 1}. {approval.approver_name || approval.approver_email}
                          </p>
                          <p className="text-xs text-slate-500">
                            {approval.approval_type === 'want_it_too' ? '❤️ Wants it too' : '👍 Good idea'}
                            {approval.wants_updates && ' • Wants updates'}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(approval.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                {selectedRequest.status === 'completed' && !selectedRequest.free_product_shipped && (
                  <Button onClick={() => updateRequestStatus(selectedRequest.id, 'fulfilled')}>
                    <Truck className="w-4 h-4 mr-2" />
                    Mark as Shipped
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => copyLink(selectedRequest.referral_code)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <a
                  href={`/want/${selectedRequest.referral_code}/status`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Status Page
                  </Button>
                </a>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

