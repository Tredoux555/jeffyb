'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle,
  Key,
  Trash2,
  Edit,
  ArrowLeft,
  Eye
} from 'lucide-react'

interface User {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  last_sign_in_at: string | null
  profile: {
    full_name: string | null
    phone: string | null
  } | null
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'verify' | 'reset' | 'delete' | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    autoVerify: true
  })

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }
    
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('User created successfully!')
        setIsModalOpen(false)
        setFormData({ email: '', password: '', fullName: '', autoVerify: true })
        fetchUsers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('Failed to create user')
    }
  }

  const handleVerifyEmail = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'verify_email'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('Email verified successfully!')
        fetchUsers()
        setIsActionModalOpen(false)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Failed to verify email')
      }
    } catch (error) {
      console.error('Error verifying email:', error)
      setError('Failed to verify email')
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'reset_password',
          newPassword
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('Password reset successfully!')
        setIsActionModalOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      setError('Failed to reset password')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    if (!confirm(`Are you sure you want to delete user ${selectedUser.email}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('User deleted successfully!')
        setIsActionModalOpen(false)
        fetchUsers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Failed to delete user')
    }
  }

  const openActionModal = (user: User, action: 'verify' | 'reset' | 'delete') => {
    setSelectedUser(user)
    setActionType(action)
    setError('')
    setNewPassword('')
    setConfirmPassword('')
    setIsActionModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-700">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow py-6 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts, verify emails, and reset passwords</p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Login</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.profile?.full_name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {user.email_confirmed_at ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-600">
                            <XCircle className="w-4 h-4" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {!user.email_confirmed_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionModal(user, 'verify')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openActionModal(user, 'reset')}
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openActionModal(user, 'delete')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create User Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setFormData({ email: '', password: '', fullName: '', autoVerify: true })
            setError('')
          }}
          title="Create New User"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
            <Input
              label="Password *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              required
            />
            <Input
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoVerify"
                checked={formData.autoVerify}
                onChange={(e) => setFormData({ ...formData, autoVerify: e.target.checked })}
                className="w-4 h-4 text-jeffy-yellow bg-gray-100 border-gray-300 rounded focus:ring-jeffy-yellow"
              />
              <label htmlFor="autoVerify" className="text-sm text-gray-700">
                Auto-verify email (user can login immediately)
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setFormData({ email: '', password: '', fullName: '', autoVerify: true })
                  setError('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create User
              </Button>
            </div>
          </form>
        </Modal>

        {/* Action Modal (Verify/Reset/Delete) */}
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false)
            setSelectedUser(null)
            setActionType(null)
            setError('')
            setNewPassword('')
            setConfirmPassword('')
          }}
          title={
            actionType === 'verify' ? 'Verify User Email' :
            actionType === 'reset' ? 'Reset Password' :
            'Delete User'
          }
        >
          {actionType === 'verify' && selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Verify email for <strong>{selectedUser.email}</strong>? This will allow them to log in immediately.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleVerifyEmail(selectedUser)}
                  className="flex-1"
                >
                  Verify Email
                </Button>
              </div>
            </div>
          )}
          
          {actionType === 'reset' && selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Reset password for <strong>{selectedUser.email}</strong>
              </p>
              <Input
                label="New Password *"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm Password *"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  className="flex-1"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}
          
          {actionType === 'delete' && selectedUser && (
            <div className="space-y-4">
              <p className="text-red-700 font-semibold">
                Warning: This action cannot be undone!
              </p>
              <p className="text-gray-700">
                Are you sure you want to delete user <strong>{selectedUser.email}</strong>? 
                This will permanently delete their account and all associated data.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

