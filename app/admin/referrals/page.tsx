'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import {
  Gift,
  Settings,
  Users,
  TrendingUp,
  Check,
  Loader2,
  RefreshCw,
  Mail,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react'

interface ReferralSettings {
  id: string
  referrals_required: number
  referral_discount_percent: number
  max_free_product_value: number
  referral_expiry_days: number
  is_active: boolean
}

interface CampaignStats {
  total_campaigns: number
  active_campaigns: number
  completed_campaigns: number
  total_referrals: number
  verified_referrals: number
  rewards_claimed: number
}

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch settings
      const settingsRes = await fetch('/api/admin/referral-settings')
      const settingsData = await settingsRes.json()
      if (settingsData.success) {
        setSettings(settingsData.settings)
        setStats(settingsData.stats)
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/referral-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
            <p className="text-gray-600 mt-1">Manage your free product referral campaign</p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_campaigns}</div>
              <div className="text-xs text-gray-600">Total Campaigns</div>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.active_campaigns}</div>
              <div className="text-xs text-gray-600">Active</div>
            </Card>
            <Card className="p-4 text-center">
              <Check className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.completed_campaigns}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </Card>
            <Card className="p-4 text-center">
              <Mail className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_referrals}</div>
              <div className="text-xs text-gray-600">Total Referrals</div>
            </Card>
            <Card className="p-4 text-center">
              <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.verified_referrals}</div>
              <div className="text-xs text-gray-600">Verified</div>
            </Card>
            <Card className="p-4 text-center">
              <Gift className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.rewards_claimed}</div>
              <div className="text-xs text-gray-600">Rewards Claimed</div>
            </Card>
          </div>
        )}

        {/* Settings Form */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Program Settings</h2>
          </div>

          {settings && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Referrals Required for Free Product
                </label>
                <Input
                  type="number"
                  value={settings.referrals_required}
                  onChange={(e) => setSettings({
                    ...settings,
                    referrals_required: parseInt(e.target.value) || 10
                  })}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many verified referrals needed to earn a free product
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  Referral Discount (%)
                </label>
                <Input
                  type="number"
                  value={settings.referral_discount_percent}
                  onChange={(e) => setSettings({
                    ...settings,
                    referral_discount_percent: parseInt(e.target.value) || 30
                  })}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Discount given to people who sign up via referral link
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Reward Discount (%)
                </label>
                <Input
                  type="number"
                  value={50}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Referrers get 50% off any product (fixed to protect margins)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Campaign Duration (days)
                </label>
                <Input
                  type="number"
                  value={settings.referral_expiry_days}
                  onChange={(e) => setSettings({
                    ...settings,
                    referral_expiry_days: parseInt(e.target.value) || 30
                  })}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many days users have to complete their referrals
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_active}
                    onChange={(e) => setSettings({
                      ...settings,
                      is_active: e.target.checked
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Program Active</span>
                    <p className="text-sm text-gray-500">
                      When disabled, new campaigns cannot be started but existing ones will continue
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {message.text && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Quick Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>User creates account and starts a referral campaign</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>They share their unique link on WhatsApp, Instagram, Facebook, TikTok</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Friends sign up and verify email → get {settings?.referral_discount_percent || 30}% discount</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <span>After {settings?.referrals_required || 10} verified referrals → 50% off unlocked!</span>
              </li>
            </ol>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Cost Analysis</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reward discount:</span>
                <span className="font-medium text-green-600">50% off (you cover costs)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Referrals needed:</span>
                <span className="font-medium">{settings?.referrals_required || 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Referral discount:</span>
                <span className="font-medium">{settings?.referral_discount_percent || 30}% off</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-gray-500 text-xs">
                  With 50% off (instead of free), you always cover your product costs. 
                  Each of the 10 referrals gets {settings?.referral_discount_percent || 30}% off, 
                  driving revenue while growing your customer base.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

