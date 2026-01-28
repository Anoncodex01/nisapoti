'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  email_confirmed_at?: string
  created_at: string
  updated_at: string
  user_metadata?: {
    display_name?: string
    username?: string
    bio?: string
    category?: string
    website?: string
    avatar_url?: string
  }
}

interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profileComplete: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  checkProfileComplete: (userToCheck?: User) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user')
    const savedSession = localStorage.getItem('session')
    
    if (savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser))
        setSession(JSON.parse(savedSession))
      } catch (error) {
        console.error('Error parsing saved auth data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('session')
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setUser(data.user)
      setSession(null) // No session object from login API
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      // Don't save session since it's not returned by the API
      
      // Check if profile is complete
      await checkProfileComplete(data.user)
      
      return data.user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // After successful registration, user needs to verify email
      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('session')
      
      // Clear user state
      setUser(null)
      setSession(null)
      setProfileComplete(false)
      
      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      setUser(null)
      setSession(null)
      setProfileComplete(false)
    }
  }

  const resetPassword = async (email: string) => {
    // Use custom verification system instead of Supabase's built-in reset
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send verification code');
    }
  }

  const updatePassword = async (password: string) => {
    // This would need to be implemented with a custom API
    throw new Error('Password update not implemented yet')
  }

  const checkProfileComplete = async (userToCheck?: User): Promise<boolean> => {
    const currentUser = userToCheck || user;
    if (!currentUser) {
      return false
    }
    
    try {
      const response = await fetch(`/api/profile?user_id=${currentUser.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error checking profile:', data.error)
        return false
      }
      
      // Check if profile has all required fields (avatar and website are optional)
      const profileData = data.data || data; // Handle both response formats
      const isComplete = !!(profileData && 
        profileData.display_name && 
        profileData.username &&
        profileData.bio && 
        profileData.category)
      
      console.log('Profile completion check:', {
        display_name: !!profileData?.display_name,
        username: !!profileData?.username,
        bio: !!profileData?.bio,
        category: !!profileData?.category,
        isComplete
      })
      
      setProfileComplete(!!isComplete)
      return !!isComplete
    } catch (error) {
      console.error('Error checking profile completion:', error)
      return false
    }
  }

  const value = {
    user,
    session,
    loading,
    profileComplete,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkProfileComplete
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}