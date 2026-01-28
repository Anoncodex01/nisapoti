'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Smartphone, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

interface PaymentInfo {
  id: string
  provider: string
  full_name: string
  phone_number: string
  is_verified: boolean
  verified_at: string | null
  created_at: string
}

export default function PaymentInfoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [formData, setFormData] = useState({
    provider: '',
    full_name: '',
    phone_number: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (user?.id) {
      fetchPaymentInfo()
    }
  }, [user?.id])

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payment-info/verify?creator_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasPaymentInfo && data.paymentInfo) {
          setPaymentInfo(data.paymentInfo)
          // Format phone for display (remove 255 prefix if present)
          let displayPhone = data.paymentInfo.phone_number
          if (displayPhone.startsWith('255')) {
            displayPhone = '0' + displayPhone.substring(3)
          }
          setFormData({
            provider: data.paymentInfo.provider,
            full_name: data.paymentInfo.full_name,
            phone_number: displayPhone
          })
        }
      }
    } catch (error) {
      console.error('Error fetching payment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/payment-info/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: user.id,
          provider: formData.provider,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        fetchPaymentInfo()
        setTimeout(() => {
          router.push('/creator/withdraw')
        }, 2000)
      } else {
        setError(result.error || 'Failed to verify payment information')
      }
    } catch (error) {
      console.error('Error submitting payment info:', error)
      setError('Failed to verify payment information')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  // If payment info is already verified, show read-only view
  if (paymentInfo?.is_verified) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <Smartphone className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mobile Money</h1>
              <p className="text-sm sm:text-base text-gray-500">Your mobile money account for receiving payouts</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{paymentInfo.provider}</h3>
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{paymentInfo.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-500">Phone Number</span>
                <span className="font-medium text-gray-900">
                  {paymentInfo.phone_number.startsWith('255') 
                    ? '+255' + paymentInfo.phone_number.substring(3)
                    : paymentInfo.phone_number}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500">Added</span>
                <span className="font-medium text-gray-900">
                  {new Date(paymentInfo.verified_at || paymentInfo.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Mobile money details cannot be modified once added. Contact support if you need to make changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full mr-4">
            <Smartphone className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verify Payment Information</h1>
            <p className="text-gray-500">Add your mobile money account for receiving payouts</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-sm text-green-800">
                Payment information verified successfully! Redirecting...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Money Provider
            </label>
            <select
              required
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              <option value="">Select Provider</option>
              <option value="Mix by Yas">Mix by Yas (Tigo)</option>
              <option value="Airtel">Airtel Money</option>
              <option value="Halotel">Halotel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Enter your full name as it appears on your mobile money account"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              required
              pattern="[0-9]{10}"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="e.g., 0755123456"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the phone number registered with your mobile money account
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once verified, you cannot change these details. Please ensure all information is correct before submitting.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !formData.provider || !formData.full_name || !formData.phone_number}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-lg font-medium transition-all duration-200"
          >
            {submitting ? 'Verifying...' : 'Verify Payment Information'}
          </button>
        </form>
      </div>
    </div>
  )
}
