'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Location } from '@/types/database'
import { 
  Building2,
  Plus,
  Edit,
  MapPin,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function FranchisesPage() {
  const router = useRouter()
  const [franchises, setFranchises] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFranchise, setSelectedFranchise] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    franchise_code: '',
    franchise_name: '',
    franchise_owner_name: '',
    franchise_owner_email: '',
    franchise_owner_phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'South Africa',
    franchise_start_date: ''
  })

  useEffect(() => {
    checkAuth()
    fetchFranchises()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchFranchises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/franchises')
      const result = await response.json()
      
      if (result.success) {
        setFranchises(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching franchises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setSelectedFranchise(null)
    setFormData({
      name: '',
      code: '',
      franchise_code: '',
      franchise_name: '',
      franchise_owner_name: '',
      franchise_owner_email: '',
      franchise_owner_phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'South Africa',
      franchise_start_date: ''
    })
    setIsModalOpen(true)
  }

  const handleEdit = (franchise: Location) => {
    setSelectedFranchise(franchise)
    setFormData({
      name: franchise.name,
      code: franchise.code || '',
      franchise_code: franchise.franchise_code || '',
      franchise_name: franchise.franchise_name || franchise.name,
      franchise_owner_name: franchise.franchise_owner_name || '',
      franchise_owner_email: franchise.franchise_owner_email || '',
      franchise_owner_phone: franchise.franchise_owner_phone || '',
      address: franchise.address || '',
      city: franchise.city || '',
      postal_code: franchise.postal_code || '',
      country: franchise.country,
      franchise_start_date: franchise.franchise_start_date || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.franchise_code) {
      alert('Name and franchise code are required')
      return
    }

    try {
      const url = selectedFranchise
        ? `/api/admin/franchises?id=${selectedFranchise.id}`
        : '/api/admin/franchises'
      
      const method = selectedFranchise ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (result.success) {
        setIsModalOpen(false)
        setSelectedFranchise(null)
        fetchFranchises()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving franchise:', error)
      alert('Failed to save franchise')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Franchise Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage franchise locations and their operations</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Franchise
            </Button>
          </div>
        </div>

        {/* Franchises Grid */}
        {loading ? (
          <Card className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading franchises...</p>
          </Card>
        ) : franchises.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Franchises</h3>
            <p className="text-gray-600 mb-4">
              Create your first franchise location to start managing multiple locations
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Franchise
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {franchises.map((franchise) => (
              <Card key={franchise.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-jeffy-yellow" />
                      <h3 className="font-semibold text-gray-900">
                        {franchise.franchise_name || franchise.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Code: <span className="font-medium">{franchise.franchise_code || franchise.code}</span>
                    </p>
                    {franchise.city && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {franchise.city}, {franchise.country}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(franchise)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {franchise.franchise_owner_name && (
                    <div>
                      <p className="text-xs text-gray-500">Owner</p>
                      <p className="text-sm font-medium">{franchise.franchise_owner_name}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {franchise.franchise_status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {franchise.franchise_status || 'active'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Link href={`/franchise/${franchise.franchise_code}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Package className="w-4 h-4 mr-2" />
                      View Storefront
                    </Button>
                  </Link>
                  <Link href={`/admin/accounting?tab=distributors&franchise=${franchise.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedFranchise(null)
          }}
          title={selectedFranchise ? 'Edit Franchise' : 'Add Franchise'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Location Name *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="Location Code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="JHB, NCL, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Franchise Code *"
                value={formData.franchise_code}
                onChange={(e) => setFormData(prev => ({ ...prev, franchise_code: e.target.value.toUpperCase() }))}
                placeholder="JHB, NCL, PSP"
                helperText="Used in URL: /franchise/[code]"
              />
              <Input
                label="Franchise Name"
                value={formData.franchise_name}
                onChange={(e) => setFormData(prev => ({ ...prev, franchise_name: e.target.value }))}
                placeholder="Johannesburg Franchise"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Franchise Owner</h4>
              <div className="space-y-4">
                <Input
                  label="Owner Name"
                  value={formData.franchise_owner_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, franchise_owner_name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.franchise_owner_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, franchise_owner_email: e.target.value }))}
                  />
                  <Input
                    label="Phone"
                    value={formData.franchise_owner_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, franchise_owner_phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Address</h4>
              <div className="space-y-4">
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    label="Postal Code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </div>

            <Input
              label="Franchise Start Date"
              type="date"
              value={formData.franchise_start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, franchise_start_date: e.target.value }))}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsModalOpen(false)
                setSelectedFranchise(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedFranchise ? 'Update' : 'Create'} Franchise
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

