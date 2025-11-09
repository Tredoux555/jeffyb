import React from 'react'
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
} from 'lucide-react'

// Function to get icon component by name - supports all icons from IconPicker
export function getIconComponent(iconName: string | null | undefined): React.ComponentType<{ className?: string }> {
  switch (iconName) {
    // Sports & Fitness
    case 'Dumbbell':
      return Dumbbell
    case 'Target':
      return Target
    case 'Bike':
      return Bike
    
    // Outdoor
    case 'Tent':
      return Tent
    case 'Tree':
    case 'Trees':
      return Trees
    case 'Sun':
      return Sun
    case 'Moon':
      return Moon
    case 'Cloud':
      return Cloud
    
    // Food & Drink
    case 'ChefHat':
      return ChefHat
    case 'Utensils':
      return Utensils
    case 'Coffee':
      return Coffee
    case 'Wine':
      return Wine
    case 'IceCream':
      return IceCream
    case 'Apple':
      return Apple
    case 'Pizza':
      return Pizza
    case 'Fish':
      return Fish
    
    // Beauty & Personal
    case 'Sparkles':
      return Sparkles
    case 'Flower':
      return Flower
    case 'Scissors':
      return Scissors
    
    // Baby & Kids
    case 'Baby':
      return Baby
    case 'Gift':
      return Gift
    
    // Electronics
    case 'Laptop':
      return Laptop
    case 'Phone':
      return Phone
    case 'Watch':
      return Watch
    case 'Camera':
      return Camera
    case 'Gamepad2':
      return Gamepad2
    case 'Music':
      return Music
    
    // Shopping
    case 'ShoppingBag':
      return ShoppingBag
    case 'ShoppingCart':
      return ShoppingCart
    
    // Transport
    case 'Car':
      return Car
    case 'Plane':
      return Plane
    case 'Ship':
      return Ship
    
    // Home & Building
    case 'Home':
      return Home
    case 'Building':
      return Building
    case 'MapPin':
      return MapPin
    case 'Navigation':
      return Navigation
    
    // Tools
    case 'Wrench':
      return Wrench
    case 'Hammer':
      return Hammer
    case 'Tool':
    case 'ToolCase':
      return ToolCase
    
    // General
    case 'Star':
      return Star
    case 'Heart':
      return Heart
    case 'Crown':
      return Crown
    case 'Book':
      return Book
    case 'Settings':
      return Settings
    case 'Bell':
      return Bell
    case 'Mail':
      return Mail
    case 'User':
      return User
    case 'Users':
      return Users
    case 'UserPlus':
      return UserPlus
    case 'Shield':
      return Shield
    case 'Lock':
      return Lock
    case 'Unlock':
      return Unlock
    case 'Key':
      return Key
    case 'MessageCircle':
      return MessageCircle
    case 'PhoneCall':
      return PhoneCall
    case 'Video':
      return Video
    case 'Mic':
      return Mic
    case 'CheckCircle':
      return CheckCircle
    case 'XCircle':
      return XCircle
    case 'AlertCircle':
      return AlertCircle
    case 'Info':
      return Info
    case 'HelpCircle':
      return HelpCircle
    case 'Droplet':
      return Droplet
    case 'Flame':
      return Flame
    case 'Zap':
      return Zap
    case 'Palette':
      return Palette
    case 'Brush':
      return Brush
    
    default:
      return Package
  }
}

