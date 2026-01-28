'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Heart, Gift, Share2, ExternalLink, Users, Star } from 'lucide-react'
import CreatorLayout from '@/components/CreatorLayout'
import WishlistDetailModal from '@/components/WishlistDetailModal'

interface CreatorData {
  user_id: string
  username: string
  display_name: string
  avatar_url?: string
  category: string
  bio: string
  creator_url: string
  website?: string
  supporter_count: number
  wishlist_items: WishlistItem[]
}

interface WishlistItem {
  id: string
  uuid: string
  name: string
  price: number
  amount_funded: number
  is_priority: boolean
  description?: string
  images: string[]
}

export default function CreatorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const username = params.username as string
  
  // Initialize activeTab from URL parameters
  const getInitialTab = (): 'support' | 'shop' | 'wishlist' => {
    const tab = searchParams.get('tab')
    if (tab === 'shop' || tab === 'wishlist') {
      return tab
    }
    return 'support'
  }
  
  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'support' | 'shop' | 'wishlist'>(getInitialTab())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedWishlistUuid, setSelectedWishlistUuid] = useState<string | null>(null)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [supportAmount, setSupportAmount] = useState(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [supporterName, setSupporterName] = useState('')
  const [supporterPhone, setSupporterPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [depositId, setDepositId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [showTimeout, setShowTimeout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [stopPaymentChecking, setStopPaymentChecking] = useState(false)

  useEffect(() => {
    if (username) {
      fetchCreatorData()
    }
  }, [username])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (processingPayment || showTimeout) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Prevent scroll to top
      window.scrollTo(0, scrollY);
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [processingPayment, showTimeout]);

  // Countdown timer for payment processing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (processingPayment && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setProcessingPayment(false)
            setShowTimeout(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [processingPayment, timeLeft])

  // Update activeTab when URL parameters change
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'shop' || tab === 'wishlist') {
      setActiveTab(tab)
    } else {
      setActiveTab('support')
    }
  }, [searchParams])

  const fetchCreatorData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/creator/${username}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch creator data')
      }

      setCreator(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const checkPaymentStatus = async (depositId: string) => {
    // Stop checking if flag is set
    if (stopPaymentChecking) {
      return
    }

    try {
      const response = await fetch(`/api/payments/check-status?depositId=${depositId}`)
      const result = await response.json()
      
      
      if (result.success && result.isCompleted) {
        // Payment completed successfully
        setShowSuccess(true)
        
        // Wait a moment then redirect to thank you page
        setTimeout(() => {
          setProcessingPayment(false);
          window.location.href = `/support-thank-you?depositId=${depositId}&amount=${supportAmount}&supporterName=${supporterName}&creatorUsername=${creator?.username}`;
        }, 2000); // Wait 2 seconds for database to update
      } else if (result.success && !result.isCompleted && !stopPaymentChecking) {
        // Payment still processing, check again in 3 seconds (only if not stopped)
        setTimeout(() => checkPaymentStatus(depositId), 3000)
      } else {
        // Payment failed or error
        setProcessingPayment(false)
        setShowTimeout(true)
      }
    } catch (error) {
      // Don't show timeout immediately on network error, try again
      if (timeLeft > 10 && !stopPaymentChecking) { // Only retry if we have time left and not stopped
        setTimeout(() => checkPaymentStatus(depositId), 3000)
      } else {
        setProcessingPayment(false)
        setShowTimeout(true)
      }
    }
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creator) return

    setSubmitting(true)
    try {
      // Use Snippe integration for support
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: creator.user_id,
          amount: supportAmount,
          supporter_name: supporterName,
          supporter_phone: supporterPhone,
          type: 'support',
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Store deposit ID and start processing
        setDepositId(result.deposit_id)
        setSubmitting(false)
        setProcessingPayment(true)
        setTimeLeft(60) // Reset timer to 60 seconds
        setShowTimeout(false)
        
        // Start checking payment status
        checkPaymentStatus(result.deposit_id)
      } else {
        alert(result.error || 'Support failed. Please try again.')
        setSubmitting(false)
      }
    } catch (err) {
      console.error('Support error:', err)
      alert('Support failed. Please try again.')
      setSubmitting(false)
    }
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleTabChange = (newTab: 'support' | 'shop' | 'wishlist') => {
    if (newTab === activeTab) return
    
    setIsTransitioning(true)
    
    // Update URL to reflect the new tab
    const newUrl = newTab === 'support' ? `/${username}` : `/${username}?tab=${newTab}`
    router.push(newUrl, { scroll: false })
    
    setTimeout(() => {
      setActiveTab(newTab)
      setIsTransitioning(false)
    }, 150)
  }

  const handleWishlistItemClick = (uuid: string) => {
    setSelectedWishlistUuid(uuid)
    setShowWishlistModal(true)
  }

  const handleCloseModal = () => {
    setShowWishlistModal(false)
    setSelectedWishlistUuid(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator not found</h1>
          <p className="text-gray-600 mb-6">{error || 'The creator you&apos;re looking for doesn&apos;t exist.'}</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            <Heart className="w-5 h-5 mr-2" />
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      {/* Universal Layout - Works on both Desktop and Mobile */}
      <CreatorLayout
        creator={creator}
        formatCurrency={formatCurrency}
        getInitials={getInitials}
        handleSupportSubmit={handleSupportSubmit}
        supporterName={supporterName}
        setSupporterName={setSupporterName}
        supporterMessage={supporterPhone}
        setSupporterMessage={setSupporterPhone}
        supportAmount={supportAmount}
        setSupportAmount={setSupportAmount}
        submitting={submitting}
        processingPayment={processingPayment}
        depositId={depositId}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isTransitioning={isTransitioning}
      />

      {/* Processing Payment Overlay */}
      {processingPayment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Countdown Timer */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#FF6B35"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / 60)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-orange-500">{timeLeft}</span>
                <span className="text-xs text-gray-500">seconds</span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check your phone</h3>
            <p className="text-gray-600 mb-6">
              A USSD prompt has been sent to your device.
            </p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <span className="text-gray-700">Open the USSD prompt on your phone</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <span className="text-gray-700">Enter your PIN to confirm payment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <span className="text-gray-700">Wait for confirmation</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Timeout Modal */}
      {showTimeout && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Timeout</h3>
            <p className="text-gray-600 mb-6">
              The payment process has timed out. Please try again.
            </p>
            <button
              onClick={() => {
                setStopPaymentChecking(true)
                setShowTimeout(false)
                setProcessingPayment(false)
                setTimeLeft(60)
                // Refresh the page to reset everything
                window.location.reload()
              }}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Wishlist Detail Modal */}
      {selectedWishlistUuid && (
        <WishlistDetailModal
          isOpen={showWishlistModal}
          onClose={handleCloseModal}
          uuid={selectedWishlistUuid}
        />
      )}
    </div>
  )
}