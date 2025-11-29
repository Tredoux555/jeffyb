import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all users from auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 500 }
      )
    }
    
    // Get profiles for all users
    const userIds = users.map(u => u.id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']) // Dummy ID if no users
    
    // Combine user data with profiles
    const usersWithProfiles = users.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      profile: profiles?.find(p => p.id === user.id) || null
    }))
    
    return NextResponse.json({
      success: true,
      data: usersWithProfiles
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new user manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, autoVerify = true } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // Create user with admin API (bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: autoVerify, // Auto-verify email
      user_metadata: {
        full_name: fullName || email.split('@')[0]
      }
    })
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update user (verify email, reset password, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, ...params } = body
    
    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    switch (action) {
      case 'verify_email':
        // Verify user's email
        const { data: verifyData, error: verifyError } = await supabase.auth.admin.updateUserById(
          userId,
          { email_confirm: true }
        )
        if (verifyError) throw verifyError
        return NextResponse.json({ success: true, data: verifyData })
        
      case 'reset_password':
        // Reset user password
        if (!params.newPassword) {
          return NextResponse.json(
            { success: false, error: 'New password is required' },
            { status: 400 }
          )
        }
        const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: params.newPassword }
        )
        if (resetError) throw resetError
        return NextResponse.json({ success: true, data: resetData })
        
      case 'update_profile':
        // Update user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .update(params)
          .eq('id', userId)
          .select()
          .single()
        if (profileError) throw profileError
        return NextResponse.json({ success: true, data: profileData })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

