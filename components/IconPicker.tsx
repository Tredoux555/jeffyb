'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Dumbbell, Tent, ChefHat, Sparkles, Baby, Target, Package,
  ShoppingBag, ShoppingCart, Heart, Star, Gift, Crown,
  Music, Camera, Gamepad2, Book, Laptop, Phone, Watch,
  Car, Bike, Plane, Ship, Home, Building, MapPin, Navigation,
  Coffee, Utensils, Wine, IceCream, Apple, Pizza, Fish,
  Flower, Trees, Sun, Moon, Cloud, Droplet, Flame, Zap,
  Palette, Brush, Scissors, Wrench, Hammer, ToolCase, Settings,
  Bell, Mail, MessageCircle, PhoneCall, Video, Mic,
  User, Users, UserPlus, Shield, Lock, Unlock, Key,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight,
  Plus, Minus, X, Search as SearchIcon, Filter, Grid, List, Menu,
  Edit, Trash2, Save, Download, Upload, Share, Copy,
  Eye, EyeOff, Heart as HeartIcon, Star as StarIcon
} from 'lucide-react'

// Icon mapping - all available icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Dumbbell': Dumbbell,
  'Tent': Tent,
  'ChefHat': ChefHat,
  'Sparkles': Sparkles,
  'Baby': Baby,
  'Target': Target,
  'Package': Package,
  'ShoppingBag': ShoppingBag,
  'ShoppingCart': ShoppingCart,
  'Heart': HeartIcon,
  'Star': StarIcon,
  'Gift': Gift,
  'Crown': Crown,
  'Music': Music,
  'Camera': Camera,
  'Gamepad2': Gamepad2,
  'Book': Book,
  'Laptop': Laptop,
  'Phone': Phone,
  'Watch': Watch,
  'Car': Car,
  'Bike': Bike,
  'Plane': Plane,
  'Ship': Ship,
  'Home': Home,
  'Building': Building,
  'MapPin': MapPin,
  'Navigation': Navigation,
  'Coffee': Coffee,
  'Utensils': Utensils,
  'Wine': Wine,
  'IceCream': IceCream,
  'Apple': Apple,
  'Pizza': Pizza,
  'Fish': Fish,
  'Flower': Flower,
  'Tree': Trees,
  'Trees': Trees,
  'Sun': Sun,
  'Moon': Moon,
  'Cloud': Cloud,
  'Droplet': Droplet,
  'Flame': Flame,
  'Zap': Zap,
  'Palette': Palette,
  'Brush': Brush,
  'Scissors': Scissors,
  'Wrench': Wrench,
  'Hammer': Hammer,
  'Tool': ToolCase,
  'ToolCase': ToolCase,
  'Settings': Settings,
  'Bell': Bell,
  'Mail': Mail,
  'MessageCircle': MessageCircle,
  'PhoneCall': PhoneCall,
  'Video': Video,
  'Mic': Mic,
  'User': User,
  'Users': Users,
  'UserPlus': UserPlus,
  'Shield': Shield,
  'Lock': Lock,
  'Unlock': Unlock,
  'Key': Key,
  'CheckCircle': CheckCircle,
  'XCircle': XCircle,
  'AlertCircle': AlertCircle,
  'Info': Info,
  'HelpCircle': HelpCircle,
}

// Organized icon categories for better UX
const iconCategories = {
  'Sports & Fitness': ['Dumbbell', 'Target', 'Bike'],
  'Outdoor': ['Tent', 'Trees', 'Sun', 'Moon', 'Cloud'],
  'Food & Drink': ['ChefHat', 'Utensils', 'Coffee', 'Wine', 'IceCream', 'Apple', 'Pizza', 'Fish'],
  'Beauty & Personal': ['Sparkles', 'Flower', 'Scissors'],
  'Baby & Kids': ['Baby', 'Gift'],
  'Electronics': ['Laptop', 'Phone', 'Watch', 'Camera', 'Gamepad2', 'Music'],
  'Shopping': ['ShoppingBag', 'ShoppingCart', 'Package', 'Gift'],
  'Transport': ['Car', 'Bike', 'Plane', 'Ship'],
  'Home & Building': ['Home', 'Building', 'MapPin', 'Navigation'],
  'Tools': ['Wrench', 'Hammer', 'Tool', 'Scissors'],
  'General': ['Star', 'Heart', 'Crown', 'Book', 'Settings', 'Bell', 'Mail', 'User', 'Users'],
}

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedIcon = value ? iconMap[value] : null
  const SelectedIconComponent = selectedIcon || Package

  // Filter icons based on search
  const filteredIcons = Object.entries(iconMap).filter(([name]) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || 
      Object.entries(iconCategories).some(([cat, icons]) => 
        cat === selectedCategory && icons.includes(name)
      )
    return matchesSearch && matchesCategory
  })

  const handleIconSelect = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="space-y-2" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-jeffy-yellow-light rounded-lg">
            <SelectedIconComponent className="w-5 h-5 text-gray-700" />
          </div>
          <span className="text-sm text-gray-700">
            {value || 'Select an icon'}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Icon Picker Modal */}
      {isOpen && (
        <div className="relative z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-hidden">
          {/* Search and Category Filter */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-jeffy-yellow text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.keys(iconCategories).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-jeffy-yellow text-gray-900'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Icons Grid */}
          <div className="p-4 overflow-y-auto max-h-64">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No icons found</p>
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {filteredIcons.map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                      value === iconName
                        ? 'border-jeffy-yellow bg-jeffy-yellow-light'
                        : 'border-gray-200 hover:border-jeffy-yellow hover:bg-gray-50'
                    }`}
                    title={iconName}
                  >
                    <IconComponent className="w-5 h-5 text-gray-700 mx-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Click to select an icon for this category
      </p>
    </div>
  )
}

