'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { HSCode } from '@/types/database'

interface HSCodeSelectorProps {
  value?: string
  onChange: (hsCode: string, dutyRate: number) => void
  label?: string
}

export function HSCodeSelector({ 
  value, 
  onChange,
  label = 'HS Code / Customs Tariff'
}: HSCodeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<HSCode[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchHSCodes(searchTerm)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [searchTerm])

  const searchHSCodes = async (query: string) => {
    setLoading(true)
    setShowResults(true)
    try {
      const response = await fetch(`/api/hs-codes/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching HS codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (hsCode: HSCode) => {
    onChange(hsCode.hs_code, hsCode.duty_rate_general)
    setSearchTerm(hsCode.hs_code)
    setShowResults(false)
    setResults([])
  }

  return (
    <div className="relative">
      <Input
        label={label}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by product name or HS code (e.g., 'gym gloves', '0101.21')"
        onFocus={() => {
          if (results.length > 0) {
            setShowResults(true)
          }
        }}
      />
      
      {/* Search Results Dropdown */}
      {showResults && (results.length > 0 || loading) && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-2">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">No HS codes found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-jeffy-yellow transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.hs_code}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        {item.chapter && (
                          <p className="text-xs text-gray-500 mt-1">
                            Chapter {item.chapter}
                            {item.statistical_unit && ` • Unit: ${item.statistical_unit}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {item.duty_rate_general === 0 ? 'Free' : `${item.duty_rate_general}%`}
                        </p>
                        {item.duty_rate_sadc !== item.duty_rate_general && (
                          <p className="text-xs text-gray-500 mt-1">
                            SADC: {item.duty_rate_sadc}%
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

