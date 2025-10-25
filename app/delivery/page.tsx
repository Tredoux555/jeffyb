'use client'

import React, { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { Package, Truck, MapPin, User, Phone } from 'lucide-react'

export default function DeliveryPage() {
  const [requestType, setRequestType] = useState<'pickup' | 'send_products'>('pickup')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Pickup request form data
  const [pickupData, setPickupData] = useState({
    shop_name: '',
    shop_address: '',
    product_description: '',
    delivery_address: '',
    special_instructions: ''
  })
  
  // Send products form data
  const [sendData, setSendData] = useState({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    product_description: '',
    special_instructions: ''
  })
  
  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('delivery_requests')
        .insert({
          type: 'pickup',
          shop_name: pickupData.shop_name,
          shop_address: pickupData.shop_address,
          product_description: pickupData.product_description,
          delivery_address: pickupData.delivery_address,
          special_instructions: pickupData.special_instructions,
          status: 'pending'
        })
      
      if (error) throw error
      
      setSuccess(true)
      setPickupData({
        shop_name: '',
        shop_address: '',
        product_description: '',
        delivery_address: '',
        special_instructions: ''
      })
    } catch (error) {
      console.error('Error submitting pickup request:', error)
      alert('There was an error submitting your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('delivery_requests')
        .insert({
          type: 'send_products',
          sender_info: {
            name: sendData.sender_name,
            phone: sendData.sender_phone,
            address: sendData.sender_address
          },
          recipient_info: {
            name: sendData.recipient_name,
            phone: sendData.recipient_phone,
            address: sendData.recipient_address
          },
          product_description: sendData.product_description,
          special_instructions: sendData.special_instructions,
          status: 'pending'
        })
      
      if (error) throw error
      
      setSuccess(true)
      setSendData({
        sender_name: '',
        sender_phone: '',
        sender_address: '',
        recipient_name: '',
        recipient_phone: '',
        recipient_address: '',
        product_description: '',
        special_instructions: ''
      })
    } catch (error) {
      console.error('Error submitting send request:', error)
      alert('There was an error submitting your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your delivery request has been submitted successfully. We'll contact you soon to confirm the details.
          </p>
          <Button onClick={() => setSuccess(false)}>
            Submit Another Request
          </Button>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Service</h1>
            <p className="text-gray-600">Request a delivery or send products to someone</p>
          </div>
          
          {/* Request Type Selection */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Service Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setRequestType('pickup')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  requestType === 'pickup' 
                    ? 'border-jeffy-yellow bg-jeffy-yellow-light' 
                    : 'border-gray-300 hover:border-jeffy-yellow'
                }`}
              >
                <Package className="w-8 h-8 text-jeffy-yellow mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Request Pickup</h3>
                <p className="text-sm text-gray-600">
                  Have us pick up products from a shop and deliver them to you
                </p>
              </button>
              
              <button
                onClick={() => setRequestType('send_products')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  requestType === 'send_products' 
                    ? 'border-jeffy-yellow bg-jeffy-yellow-light' 
                    : 'border-gray-300 hover:border-jeffy-yellow'
                }`}
              >
                <Truck className="w-8 h-8 text-jeffy-yellow mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Send Products</h3>
                <p className="text-sm text-gray-600">
                  Send products from your location to someone else
                </p>
              </button>
            </div>
          </Card>
          
          {/* Forms */}
          {requestType === 'pickup' ? (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Pickup Request Form</h2>
              <form onSubmit={handlePickupSubmit} className="space-y-4">
                <Input
                  label="Shop Name *"
                  value={pickupData.shop_name}
                  onChange={(e) => setPickupData({...pickupData, shop_name: e.target.value})}
                  placeholder="Enter the shop name"
                  required
                />
                
                <Input
                  label="Shop Address *"
                  value={pickupData.shop_address}
                  onChange={(e) => setPickupData({...pickupData, shop_address: e.target.value})}
                  placeholder="Enter the shop address"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description *
                  </label>
                  <textarea
                    value={pickupData.product_description}
                    onChange={(e) => setPickupData({...pickupData, product_description: e.target.value})}
                    placeholder="Describe the products you want us to pick up"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                    rows={3}
                    required
                  />
                </div>
                
                <Input
                  label="Delivery Address *"
                  value={pickupData.delivery_address}
                  onChange={(e) => setPickupData({...pickupData, delivery_address: e.target.value})}
                  placeholder="Where should we deliver the products?"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={pickupData.special_instructions}
                    onChange={(e) => setPickupData({...pickupData, special_instructions: e.target.value})}
                    placeholder="Any special instructions or notes?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                    rows={2}
                  />
                </div>
                
                <Button type="submit" loading={loading} className="w-full">
                  Submit Pickup Request
                </Button>
              </form>
            </Card>
          ) : (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send Products Form</h2>
              <form onSubmit={handleSendSubmit} className="space-y-4">
                {/* Sender Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Sender Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Your Name *"
                      value={sendData.sender_name}
                      onChange={(e) => setSendData({...sendData, sender_name: e.target.value})}
                      placeholder="Enter your name"
                      required
                    />
                    <Input
                      label="Your Phone *"
                      value={sendData.sender_phone}
                      onChange={(e) => setSendData({...sendData, sender_phone: e.target.value})}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <Input
                    label="Pickup Address *"
                    value={sendData.sender_address}
                    onChange={(e) => setSendData({...sendData, sender_address: e.target.value})}
                    placeholder="Where should we pick up the products?"
                    required
                  />
                </div>
                
                {/* Recipient Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Recipient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Recipient Name *"
                      value={sendData.recipient_name}
                      onChange={(e) => setSendData({...sendData, recipient_name: e.target.value})}
                      placeholder="Enter recipient name"
                      required
                    />
                    <Input
                      label="Recipient Phone *"
                      value={sendData.recipient_phone}
                      onChange={(e) => setSendData({...sendData, recipient_phone: e.target.value})}
                      placeholder="Enter recipient phone number"
                      required
                    />
                  </div>
                  <Input
                    label="Delivery Address *"
                    value={sendData.recipient_address}
                    onChange={(e) => setSendData({...sendData, recipient_address: e.target.value})}
                    placeholder="Where should we deliver the products?"
                    required
                  />
                </div>
                
                {/* Product Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description *
                  </label>
                  <textarea
                    value={sendData.product_description}
                    onChange={(e) => setSendData({...sendData, product_description: e.target.value})}
                    placeholder="Describe the products you want to send"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={sendData.special_instructions}
                    onChange={(e) => setSendData({...sendData, special_instructions: e.target.value})}
                    placeholder="Any special instructions or notes?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                    rows={2}
                  />
                </div>
                
                <Button type="submit" loading={loading} className="w-full">
                  Submit Send Request
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
