/**
 * Comprehensive logout utility that handles all aspects of user logout
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Clear all browser storage
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('session')
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear any other auth-related storage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('auth') || key.includes('user') || key.includes('session'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }

    // Clear any cookies (if any are set)
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
      })
    }

    console.log('User logged out successfully')
  } catch (error) {
    console.error('Logout failed:', error)
    throw error
  }
}

/**
 * Session information and expiration details
 */
export const SESSION_INFO = {
  // MySQL session management
  SESSION_EXPIRY: '24 hours', // Session expires in 24 hours
  
  // Auto-refresh behavior
  AUTO_REFRESH: false, // No automatic refresh for MySQL sessions
  
  // Session persistence
  PERSIST_SESSION: true, // Session persists across browser restarts
}

/**
 * Get current session information
 */
export const getSessionInfo = () => {
  try {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('user')
    const sessionStr = localStorage.getItem('session')
    
    if (!userStr || !sessionStr) return null
    
    const user = JSON.parse(userStr)
    const session = JSON.parse(sessionStr)
    
    return {
      isActive: true,
      user: user,
      session: session
    }
  } catch (error) {
    console.error('Error getting session info:', error)
    return null
  }
}

/**
 * Check if session is about to expire (within 5 minutes)
 */
export const isSessionExpiringSoon = (): boolean => {
  const sessionInfo = getSessionInfo()
  if (!sessionInfo) return false
  
  // For MySQL sessions, we don't have automatic expiration
  // This is just a placeholder for future implementation
  return false
}