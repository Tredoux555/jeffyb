'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, X, Download } from 'lucide-react'

export function ServiceWorkerRegistration() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                  console.log('[App] New content available, refresh to update')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error)
        })
    }

    // Handle online/offline status
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      if (!online) {
        setShowOfflineAlert(true)
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show install prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        const hasDeclined = localStorage.getItem('pwa-install-declined')
        if (!hasDeclined) {
          setShowInstallPrompt(true)
        }
      }, 30000) // 30 seconds after page load
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Track successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[App] PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-declined', 'true')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const dismissInstallPrompt = () => {
    localStorage.setItem('pwa-install-declined', 'true')
    setShowInstallPrompt(false)
  }

  return (
    <>
      {/* Offline Alert Banner */}
      {showOfflineAlert && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
          </div>
          <button
            onClick={() => setShowOfflineAlert(false)}
            className="p-1 hover:bg-amber-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back Online Alert */}
      {showOfflineAlert && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white px-4 py-2 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">You're back online!</span>
          </div>
          <button
            onClick={() => setShowOfflineAlert(false)}
            className="p-1 hover:bg-green-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-slide-up">
          <button
            onClick={dismissInstallPrompt}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📦</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Install Jeffy App</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add Jeffy to your home screen for quick access and offline shopping!
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={dismissInstallPrompt}
              className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-2 hover:shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          </div>
        </div>
      )}
    </>
  )
}

