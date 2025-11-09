'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Toggle } from '@/components/Toggle'
import { Toast } from '@/components/Toast'
import { Modal } from '@/components/Modal'
import { createClient } from '@/lib/supabase'
import { Category } from '@/types/database'
import { Tag, Package, Plus, Edit, Trash2 } from 'lucide-react'
import { IconPicker } from '@/components/IconPicker'
import { getIconComponent } from '@/lib/utils/icons'

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null)
  const [toast, setToast] = useState({ isVisible: false, message: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    is_active: true
  })

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [])

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name)
    })
  }

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    setUpdatingCategory(categoryId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', categoryId)
      
      if (error) throw error
      
      fetchCategories()
      setToast({ 
        isVisible: true, 
        message: isActive ? 'Category is now visible' : 'Category is now hidden' 
      })
    } catch (error) {
      console.error('Error toggling category:', error)
      setToast({ 
        isVisible: true, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setUpdatingCategory(null)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      is_active: category.is_active !== undefined ? category.is_active : true
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products using this category will need to be updated.')) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error
      
      fetchCategories()
      setToast({ 
        isVisible: true, 
        message: 'Category deleted successfully' 
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      setToast({ 
        isVisible: true, 
        message: `Error: ${error instanceof Error ? error.message : 'Failed to delete category'}` 
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      setToast({ 
        isVisible: true, 
        message: 'Name and slug are required' 
      })
      return
    }

    try {
      const supabase = createClient()
      
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            slug: formData.slug.trim().toLowerCase(),
            icon: formData.icon.trim() || null,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id)
        
        if (error) throw error
        
        setToast({ 
          isVisible: true, 
          message: 'Category updated successfully' 
        })
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name.trim(),
            slug: formData.slug.trim().toLowerCase(),
            icon: formData.icon.trim() || null,
            is_active: formData.is_active
          })
        
        if (error) throw error
        
        setToast({ 
          isVisible: true, 
          message: 'Category created successfully' 
        })
      }
      
      // Reset form and close modal
      setFormData({ name: '', slug: '', icon: '', is_active: true })
      setEditingCategory(null)
      setIsModalOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      setToast({ 
        isVisible: true, 
        message: `Error: ${error instanceof Error ? error.message : 'Failed to save category'}` 
      })
    }
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', icon: '', is_active: true })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-4">
        <div className="text-center">
          <Tag className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 animate-bounce mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-700">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage category visibility and details</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
              className="flex-1 sm:flex-none"
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={openAddModal}
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories List */}
        <Card className="p-4 sm:p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No categories found</p>
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${
                    category.is_active === false ? 'opacity-60 bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {category.icon && (() => {
                        const IconComponent = getIconComponent(category.icon)
                        return (
                          <div className="w-8 h-8 flex items-center justify-center bg-jeffy-yellow-light rounded-lg flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-gray-700" />
                          </div>
                        )
                      })()}
                      <h3 className={`font-semibold text-gray-900 text-base sm:text-lg ${
                        category.is_active === false ? 'text-gray-400' : ''
                      }`}>
                        {category.name}
                      </h3>
                      {category.is_active === false && (
                        <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded-full flex-shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span>
                        Slug: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{category.slug}</code>
                      </span>
                      {category.icon && (
                        <span>
                          Icon: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{category.icon}</code>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <Toggle
                      checked={category.is_active !== undefined ? category.is_active : true}
                      onChange={(checked) => handleToggleCategory(category.id, checked)}
                      disabled={updatingCategory === category.id}
                      size="md"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(category)}
                      size="sm"
                      className="px-3"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(category.id)}
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add/Edit Category Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCategory(null)
            setFormData({ name: '', slug: '', icon: '', is_active: true })
          }}
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Name */}
            <Input
              label="Category Name *"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Gym, Camping, Kitchen"
              required
            />
            
            {/* Slug */}
            <Input
              label="Slug *"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="e.g., gym, camping, kitchen"
              required
              helperText="URL-friendly identifier (lowercase, hyphens only)"
            />
            
            {/* Icon Picker */}
            <div className="relative">
              <IconPicker
                label="Icon (Optional)"
                value={formData.icon}
                onChange={(iconName) => setFormData({ ...formData, icon: iconName })}
              />
            </div>
            
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">
                Category Visibility
              </label>
              <Toggle
                checked={formData.is_active}
                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                size="md"
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingCategory(null)
                  setFormData({ name: '', slug: '', icon: '', is_active: true })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </form>
        </Modal>

        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast({ isVisible: false, message: '' })}
        />
      </div>
    </div>
  )
}

