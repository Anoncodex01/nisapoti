'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSessionInfo, isSessionExpiringSoon } from '@/lib/logout'

interface SessionStatusProps {
  showExpiryWarning?: boolean
}

export default function SessionStatus({ showExpiryWarning = true }: SessionStatusProps) {
  const { user } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  useEffect(() => {
    if (!user) {
      setSessionInfo(null)
      setIsExpiringSoon(false)
      return
    }

    const checkSession = async () => {
      const info = await getSessionInfo()
      setSessionInfo(info)
      
      if (showExpiryWarning) {
        const expiring = await isSessionExpiringSoon()
        setIsExpiringSoon(expiring)
      }
    }

    // Check session immediately
    checkSession()

    // Check session every minute
    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [user, showExpiryWarning])

  if (!user || !sessionInfo) {
    return null
  }

  return (
    <div className="text-xs text-gray-500">
      {isExpiringSoon && showExpiryWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-800">
              Your session expires in {sessionInfo.minutesUntilExpiry} minutes
            </span>
          </div>
        </div>
      )}
      
      <div className="text-gray-400">
        Session expires: {new Date(sessionInfo.expiresAt).toLocaleTimeString()}
      </div>
    </div>
  )
}
