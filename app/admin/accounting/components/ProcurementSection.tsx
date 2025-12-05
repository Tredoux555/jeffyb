'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { ProcurementQueueItem } from '@/types/database'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { 
  Search, 
  Package, 
  ExternalLink,
  Send,
  FileText,
  Edit
} from 'lucide-react'

export default function ProcurementSection() {
  const [queueItems, setQueueItems] = useState<ProcurementQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProcurementQueueItem | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    fetchProcurementQueue()
  }, [statusFilter])

  const fetchProcurementQueue = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/procurement-queue?status=${statusFilter}`)
      const result = await response.json()
      
      if (result.success) {
        setQueueItems(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching procurement queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = (item: ProcurementQueueItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleSaveItem = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/admin/procurement-queue?id=${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedItem)
      })

      const result = await response.json()
      if (result.success) {
        setIsModalOpen(false)
        setSelectedItem(null)
        fetchProcurementQueue()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save procurement details')
    }
  }

  const handleCreateBatch = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to include in the batch')
      return
    }

    try {
      const response = await fetch('/api/admin/procurement-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_type: 'monthly', // Can be changed to weekly later
          queue_item_ids: selectedItems
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('Procurement batch created successfully!')
        setSelectedItems([])
        fetchProcurementQueue()
        setShowBatchModal(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Failed to create batch')
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const filteredItems = queueItems.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const pendingItems = filteredItems.filter(item => item.status === 'pending')

  return (
    <div>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Procurement Queue</h2>
          <p className="text-sm text-gray-600">
            Products automatically added from sales. Add 1688 links and send to China Agent.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBatchModal(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Batch ({selectedItems.length})
            </Button>
          )}
          {pendingItems.length > 0 && (
            <Button 
              onClick={() => {
                setSelectedItems(pendingItems.map(item => item.id))
                setShowBatchModal(true)
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Create Batch (All Pending)
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent_to_agent">Sent to Agent</option>
            <option value="ordered">Ordered</option>
            <option value="shipped">Shipped</option>
            <option value="received">Received</option>
          </select>
        </div>
      </Card>

      {/* Queue Items List */}
      {loading ? (
        <LoadingSpinner message="Loading procurement queue..." />
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items in Queue</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' 
              ? `No items with status "${statusFilter}"`
              : 'Products will be automatically added when sales are made'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 flex items-start gap-4">
                  {/* Checkbox for batch selection */}
                  {item.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mt-1 w-4 h-4 text-jeffy-yellow border-gray-300 rounded focus:ring-jeffy-yellow"
                    />
                  )}
                  
                  {/* Product Image */}
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {item.product?.name || 'Product'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'sent_to_agent' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'ordered' ? 'bg-green-100 text-green-800' :
                        item.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {item.priority === 'urgent' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          URGENT
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Quantity Needed: <span className="font-medium">{item.quantity_needed}</span>
                    </p>
                    
                    {item.procurement_link && (
                      <a
                        href={item.procurement_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        1688 Link
                      </a>
                    )}
                    
                    {item.target_cost_rmb && (
                      <p className="text-xs text-gray-500">
                        Target Cost: ¥{item.target_cost_rmb}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditItem(item)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {item.procurement_link ? 'Edit Details' : 'Add Details'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItem(null)
        }}
        title="Add Procurement Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedItem.product?.name || 'Product'}
              </h3>
              <p className="text-sm text-gray-600">
                Quantity Needed: {selectedItem.quantity_needed}
              </p>
            </div>
            
            <Input
              label="1688.com Product Link"
              value={selectedItem.procurement_link || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                procurement_link: e.target.value
              })}
              placeholder="https://detail.1688.com/offer/..."
            />
            
            <Input
              label="Target Cost (RMB)"
              type="number"
              step="0.01"
              value={selectedItem.target_cost_rmb?.toString() || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                target_cost_rmb: e.target.value ? parseFloat(e.target.value) : undefined
              })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={selectedItem.priority}
                onChange={(e) => setSelectedItem({
                  ...selectedItem,
                  priority: e.target.value as any
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Description for China Agent
              </label>
              <textarea
                value={selectedItem.description || ''}
                onChange={(e) => setSelectedItem({
                  ...selectedItem,
                  description: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Any special instructions or notes..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                China Agent Notes
              </label>
              <textarea
                value={selectedItem.china_agent_notes || ''}
                onChange={(e) => setSelectedItem({
                  ...selectedItem,
                  china_agent_notes: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Internal notes for China Agent..."
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsModalOpen(false)
                setSelectedItem(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Batch Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false)
          setSelectedItems([])
        }}
        title="Create Procurement Batch"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              defaultValue="monthly"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {selectedItems.length} item(s) selected for batch
            </p>
            <p className="text-xs text-gray-500">
              This will create a batch and mark selected items as "sent to agent"
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowBatchModal(false)
              setSelectedItems([])
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBatch}>
              Create Batch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

