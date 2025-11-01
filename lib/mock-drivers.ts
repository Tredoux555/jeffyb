import { Driver } from '@/types/database'

/**
 * Mock driver data for testing driver location map
 * Locations are in Johannesburg area
 */
export const mockDrivers: Driver[] = [
  {
    id: 'mock-driver-1',
    name: 'John Driver',
    email: 'john@jeffy.com',
    phone: '+27 11 123 4567',
    password_hash: 'mock-hash',
    vehicle_type: 'car',
    status: 'active',
    current_location: {
      lat: -26.2041,
      lng: 28.0473,
    },
    last_location_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-driver-2',
    name: 'Sarah Smith',
    email: 'sarah@jeffy.com',
    phone: '+27 11 234 5678',
    password_hash: 'mock-hash',
    vehicle_type: 'bike',
    status: 'busy',
    current_location: {
      lat: -26.2141,
      lng: 28.0573,
    },
    last_location_update: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-driver-3',
    name: 'Mike Johnson',
    email: 'mike@jeffy.com',
    phone: '+27 11 345 6789',
    password_hash: 'mock-hash',
    vehicle_type: 'car',
    status: 'active',
    current_location: {
      lat: -26.1941,
      lng: 28.0373,
    },
    last_location_update: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-driver-4',
    name: 'Emma Wilson',
    email: 'emma@jeffy.com',
    phone: '+27 11 456 7890',
    password_hash: 'mock-hash',
    vehicle_type: 'walking',
    status: 'inactive',
    current_location: {
      lat: -26.2241,
      lng: 28.0673,
    },
    last_location_update: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-driver-5',
    name: 'David Brown',
    email: 'david@jeffy.com',
    phone: '+27 11 567 8901',
    password_hash: 'mock-hash',
    vehicle_type: 'car',
    status: 'busy',
    current_location: {
      lat: -26.1841,
      lng: 28.0273,
    },
    last_location_update: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Helper function to check if mock mode is enabled
 * Set NEXT_PUBLIC_USE_MOCK_DRIVERS=true in .env.local to enable
 */
export const shouldUseMockDrivers = (): boolean => {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_USE_MOCK_DRIVERS === 'true'
}

