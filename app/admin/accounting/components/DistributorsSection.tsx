'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Distributor, Location } from '@/types/database'
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Building2,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function DistributorsSection() {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location_id: '',
    business_name: '',
    tax_number: '',
    vat_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_type: '',
    branch_code: '',
    notes: ''
  })

  useEffect(() => {
    fetchDistributors()
    fetchLocations()
  }, [])

  const fetchDistributors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/distributors')
      const result = await response.json()
      
      if (result.success) {
        setDistributors(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching distributors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations')
      const result = await response.json()
      
      if (result.success) {
        setLocations(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleAddNew = () => {
    setSelectedDistributor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      location_id: '',
      business_name: '',
      tax_number: '',
      vat_number: '',
      bank_name: '',
      bank_account_number: '',
      bank_account_type: '',
      branch_code: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleEdit = (distributor: Distributor) => {
    setSelectedDistributor(distributor)
    setFormData({
      name: distributor.name,
      email: distributor.email,
      phone: distributor.phone || '',
      location_id: distributor.location_id || '',
      business_name: distributor.business_name || '',
      tax_number: distributor.tax_number || '',
      vat_number: distributor.vat_number || '',
      bank_name: distributor.bank_name || '',
      bank_account_number: distributor.bank_account_number || '',
      bank_account_type: distributor.bank_account_type || '',
      branch_code: distributor.branch_code || '',
      notes: distributor.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required')
      return
    }

    try {
      const url = selectedDistributor
        ? `/api/admin/distributors?id=${selectedDistributor.id}`
        : '/api/admin/distributors'
      
      const method = selectedDistributor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (result.success) {
        setIsModalOpen(false)
        setSelectedDistributor(null)
        fetchDistributors()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving distributor:', error)
      alert('Failed to save distributor')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this distributor?')) return

    try {
      const response = await fetch(`/api/admin/distributors?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        fetchDistributors()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting distributor:', error)
      alert('Failed to delete distributor')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Distributors</h2>
          <p className="text-sm text-gray-600">
            Manage independent contractor distributors across locations
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Distributor
        </Button>
      </div>

      {/* Distributors List */}
      {loading ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading distributors...</p>
        </Card>
      ) : distributors.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Distributors</h3>
          <p className="text-gray-600 mb-4">
            Add distributors to manage independent contractors across locations
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Distributor
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributors.map((distributor) => (
            <Card key={distributor.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{distributor.name}</h3>
                  <p className="text-sm text-gray-600">{distributor.email}</p>
                  {distributor.phone && (
                    <p className="text-sm text-gray-600">{distributor.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(distributor)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(distributor.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {distributor.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {distributor.location.name}
                  </div>
                )}

                {distributor.business_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    {distributor.business_name}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {distributor.contract_signed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {distributor.contract_signed ? 'Contract Signed' : 'Contract Pending'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    distributor.status === 'active' ? 'bg-green-100 text-green-800' :
                    distributor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {distributor.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {distributor.bank_name && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <CreditCard className="w-4 h-4" />
                    Bank Details
                  </div>
                  <p className="text-xs text-gray-500">{distributor.bank_name}</p>
                  {distributor.bank_account_number && (
                    <p className="text-xs text-gray-500">
                      Account: ••••{distributor.bank_account_number.slice(-4)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDistributor(null)
        }}
        title={selectedDistributor ? 'Edit Distributor' : 'Add Distributor'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Business Name"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax Number"
              value={formData.tax_number}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
            />
            <Input
              label="VAT Number"
              value={formData.vat_number}
              onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Bank Details</h4>
            <div className="space-y-4">
              <Input
                label="Bank Name"
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Account Number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                />
                <Input
                  label="Account Type"
                  value={formData.bank_account_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_type: e.target.value }))}
                  placeholder="Cheque, Savings, etc."
                />
              </div>
              <Input
                label="Branch Code"
                value={formData.branch_code}
                onChange={(e) => setFormData(prev => ({ ...prev, branch_code: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false)
              setSelectedDistributor(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedDistributor ? 'Update' : 'Create'} Distributor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

