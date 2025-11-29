'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Location, FranchiseFinancial } from '@/types/database'
import { 
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react'

export default function FranchiseFinancialsSection() {
  const [franchises, setFranchises] = useState<Location[]>([])
  const [selectedFranchise, setSelectedFranchise] = useState<string>('all')
  const [financials, setFinancials] = useState<FranchiseFinancial[]>([])
  const [loading, setLoading] = useState(true)
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchFranchises()
  }, [])

  useEffect(() => {
    if (selectedFranchise) {
      fetchFinancials()
    }
  }, [selectedFranchise, periodType])

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/admin/franchises?active_only=true')
      const result = await response.json()
      if (result.success) {
        setFranchises(result.data || [])
        if (result.data && result.data.length > 0 && selectedFranchise === 'all') {
          setSelectedFranchise(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching franchises:', error)
    }
  }

  const fetchFinancials = async () => {
    try {
      setLoading(true)
      const url = selectedFranchise === 'all'
        ? `/api/admin/franchise-financials?period_type=${periodType}`
        : `/api/admin/franchise-financials?franchise_id=${selectedFranchise}&period_type=${periodType}`
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setFinancials(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching financials:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAggregateStats = () => {
    if (financials.length === 0) return null

    return {
      totalRevenue: financials.reduce((sum, f) => sum + f.total_revenue, 0),
      totalOrders: financials.reduce((sum, f) => sum + f.total_orders, 0),
      totalCost: financials.reduce((sum, f) => sum + f.total_cost, 0),
      totalProfit: financials.reduce((sum, f) => sum + f.net_profit, 0),
      averageMargin: financials.reduce((sum, f) => sum + f.profit_margin, 0) / financials.length
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const aggregateStats = calculateAggregateStats()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Franchise Financial Performance</h2>
        <p className="text-sm text-gray-600">
          Track financial performance across all franchise locations
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Franchise</label>
            <select
              value={selectedFranchise}
              onChange={(e) => setSelectedFranchise(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Franchises</option>
              {franchises.map(franchise => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.franchise_name || franchise.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Aggregate Stats (if viewing all franchises) */}
      {selectedFranchise === 'all' && aggregateStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(aggregateStats.totalRevenue)}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Orders</span>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{aggregateStats.totalOrders}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Profit</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className={`text-2xl font-bold ${aggregateStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(aggregateStats.totalProfit)}
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Margin</span>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(aggregateStats.averageMargin)}</p>
          </Card>
        </div>
      )}

      {/* Financial Records */}
      {loading ? (
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading financial data...</p>
        </Card>
      ) : financials.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data</h3>
          <p className="text-gray-600">
            Financial records will appear here once orders are processed
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {financials.map((financial) => {
            const franchise = franchises.find(f => f.id === financial.franchise_location_id)
            return (
              <Card key={financial.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-5 h-5 text-jeffy-yellow" />
                      <h3 className="font-semibold text-gray-900">
                        {franchise?.franchise_name || franchise?.name || 'Franchise'}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {financial.period_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="text-sm font-medium">
                          {new Date(financial.period_start).toLocaleDateString()} - {new Date(financial.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(financial.total_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Orders</p>
                        <p className="text-sm font-medium">{financial.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Order Value</p>
                        <p className="text-sm font-medium">{formatCurrency(financial.average_order_value)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="text-sm font-medium text-red-600">{formatCurrency(financial.total_cost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Gross Profit</p>
                        <p className="text-sm font-medium">{formatCurrency(financial.gross_profit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Net Profit</p>
                        <p className={`text-sm font-medium ${financial.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(financial.net_profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit Margin</p>
                        <p className={`text-sm font-medium ${financial.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(financial.profit_margin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

