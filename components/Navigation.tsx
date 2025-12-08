'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Menu, X, User, Package, LogOut, Settings, Heart, ShoppingBag, Bell, Home, Shield, Gift, Search } from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { getUnreadNotifications } from '@/lib/notifications'
import { SmartSearch } from '@/components/SmartSearch'

interface NavigationProps {
  cartItemCount?: number
}

export function Navigation({ cartItemCount = 0 }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const unread = await getUnreadNotifications(user.id)
        setUnreadNotificationsCount(unread.length)
      } catch (error) {
        console.error('Error fetching unread notifications count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`user-notifications-nav-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/free-product', label: '50% Off!', icon: Gift },
    { href: '/admin', label: 'Admin', icon: Shield },
  ]
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }
  
  return (
    <nav className="bg-slate-900 shadow-nav sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-jeffy-yellow flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Package className="w-5 h-5 text-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white leading-tight">Jeffy</span>
              <span className="text-xs text-yellow-400 font-medium -mt-0.5">in a Jiffy</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                    isActive(item.href)
                      ? 'bg-jeffy-yellow text-slate-900 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop Search - shown on large screens */}
          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <SmartSearch />
          </div>
          
          {/* Cart, Auth & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Mobile/Tablet Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-xl text-white hover:bg-slate-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-xl text-white hover:bg-slate-800 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span 
                  key={cartItemCount}
                  className="absolute -top-1 -right-1 bg-jeffy-yellow text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce-in"
                >
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Auth: Login or Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all text-white hover:bg-slate-800"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-jeffy-yellow to-yellow-500 flex items-center justify-center shadow-md">
                      <span className="text-slate-900 font-bold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl z-20 overflow-hidden border border-gray-100 animate-fade-in">
                      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                        <p className="text-sm font-bold text-slate-900">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          href="/profile/orders"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/profile/favorites"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>Favorites</span>
                        </Link>
                        <Link
                          href="/profile/notifications"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 transition-colors"
                        >
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Notifications</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/profile/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-yellow-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Settings</span>
                        </Link>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={async () => {
                              await signOut()
                              setIsProfileMenuOpen(false)
                              router.push('/')
                            }}
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                  isActive('/auth/login') || isActive('/auth/register')
                    ? 'bg-jeffy-yellow text-slate-900 shadow-md'
                    : 'text-white hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile/Tablet Search Overlay */}
        {isSearchOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 animate-fade-in">
            <SmartSearch />
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 animate-fade-in">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? 'bg-jeffy-yellow text-slate-900 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut()
                      setIsMenuOpen(false)
                      router.push('/')
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-slate-800 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <User className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
