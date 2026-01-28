'use client'

import { useState, useEffect } from 'react'
// Removed old AuthContext import
import { Wallet, Lock, ArrowRightLeft, CreditCard, Smartphone, Building } from 'lucide-react'
import WithdrawalModal from '@/components/WithdrawalModal'
import SuccessModal from '@/components/SuccessModal'

interface WithdrawalData {
  id: string
  amount: number
  payment_method: 'mobile' | 'bank'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  phone_number?: string
  bank_name?: string
  account_number?: string
  full_name?: string
  created_at: string
  updated_at: string
}

interface BalanceData {
  available_balance: number
  locked_funds: number
  total_withdrawals: number
}

export default function WithdrawPage() {
  const MIN_WITHDRAW_AMOUNT = 50000
  const [user, setUser] = useState<any>(null)
  const [balanceData, setBalanceData] = useState<BalanceData>({
    available_balance: 0,
    locked_funds: 0,
    total_withdrawals: 0
  })
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'mobile' | 'bank' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [successTitle, setSuccessTitle] = useState<string>('')
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<any>(null)
  const [infoModalType, setInfoModalType] = useState<null | 'payment' | 'min'>(null)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchWithdrawalData()
      fetchPaymentInfo()
    }
  }, [user?.id])

  // Poll for withdrawal status updates
  useEffect(() => {
    if (!user?.id || withdrawals.length === 0) return

    const interval = setInterval(async () => {
      // Check status of processing withdrawals
      const processingWithdrawals = withdrawals.filter(w => w.status === 'PROCESSING' || w.status === 'PENDING')
      
      for (const withdrawal of processingWithdrawals) {
        try {
          const response = await fetch(`/api/withdrawals/check-status?withdrawal_id=${withdrawal.id}`)
          if (response.ok) {
            const data = await response.json()
            // If status changed, refresh the list
            if (data.status !== withdrawal.status) {
              fetchWithdrawalData()
            }
          }
        } catch (error) {
          console.error('Error checking withdrawal status:', error)
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [user?.id, withdrawals])

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch(`/api/payment-info/verify?creator_id=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasPaymentInfo && data.paymentInfo?.is_verified) {
          setVerifiedPaymentInfo(data.paymentInfo)
        }
      }
    } catch (error) {
      console.error('Error fetching payment info:', error)
    }
  }

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch balance data
      const balanceResponse = await fetch(`/api/withdrawals/balance?creator_id=${user?.id}`)
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        setBalanceData(balanceData)
      }

      // Fetch withdrawal history
      const historyResponse = await fetch(`/api/withdrawals/history?creator_id=${user?.id}`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setWithdrawals(historyData.withdrawals || [])
      }
    } catch (error) {
      console.error('Error fetching withdrawal data:', error)
      setError('Failed to load withdrawal data')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (formData: FormData) => {
    if (!user?.id) return

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/withdrawals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: user.id,
          amount: parseFloat(formData.get('amount') as string),
          payment_method: 'mobile', // Always mobile money
          full_name: formData.get('full_name') as string,
          phone_number: formData.get('phone_number') as string,
          bank_name: formData.get('bank_name') as string || null,
          account_number: formData.get('account_number') as string || null,
          provider: formData.get('provider') as string,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Set success message based on response
        if (result.instant) {
          setSuccessTitle('Withdrawal Processing')
          setSuccessMessage('Your withdrawal is being processed instantly. Funds will be transferred to your mobile wallet shortly.')
        } else if (result.message) {
          setSuccessTitle('Withdrawal Submitted')
          setSuccessMessage(result.message)
        } else {
          setSuccessTitle('Withdrawal Submitted')
          setSuccessMessage('Your withdrawal request has been received and will be processed shortly.')
        }
        
        setShowSuccess(true)
        setShowModal(false)
        setSelectedMethod(null)
        // Refresh data
        fetchWithdrawalData()
      } else {
        setError(result.error || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      setError('Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleOpenWithdraw = () => {
    if (!verifiedPaymentInfo) {
      setInfoModalType('payment')
      return
    }

    if (balanceData.available_balance < MIN_WITHDRAW_AMOUNT) {
      setInfoModalType('min')
      return
    }

    setShowModal(true)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'PENDING':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'PROCESSING':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Withdrawal Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWithdrawalData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-gray-500 text-sm font-medium">AVAILABLE BALANCE</h2>
            </div>
            <button
              onClick={handleOpenWithdraw}
              disabled={balanceData.available_balance <= 0}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 relative group"
              title={
                balanceData.available_balance <= 0
                  ? 'Insufficient balance'
                  : balanceData.available_balance < MIN_WITHDRAW_AMOUNT
                  ? `Minimum withdrawal amount is TZS ${MIN_WITHDRAW_AMOUNT.toLocaleString()}`
                  : !verifiedPaymentInfo
                  ? 'Add a payment method before withdrawing'
                  : ''
              }
            >
              Withdraw
            </button>
          </div>
          <div className={`text-3xl font-bold ${balanceData.available_balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(balanceData.available_balance)}
          </div>
        </div>

        {/* Locked Funds Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-gray-500 text-sm font-medium">LOCKED FUNDS</h2>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(balanceData.locked_funds)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Funds pledged to wishlists not yet fully funded
          </div>
        </div>

        {/* Total Withdrawals Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <ArrowRightLeft className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-gray-500 text-sm font-medium">TOTAL WITHDRAWALS</h2>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(balanceData.total_withdrawals)}
          </div>
        </div>
      </div>

      {/* Withdrawal History Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Payout History</h2>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block bg-orange-50 p-4 rounded-full mb-3">
              <CreditCard className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-gray-600">You haven&apos;t made any withdrawals yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(withdrawal.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {withdrawal.payment_method === 'mobile' ? (
                          <Smartphone className="w-4 h-4 mr-2" />
                        ) : (
                          <Building className="w-4 h-4 mr-2" />
                        )}
                        <div>
                          <div className="capitalize">{withdrawal.payment_method}</div>
                          <div className="text-xs text-gray-400">
                            {withdrawal.payment_method === 'mobile' 
                              ? withdrawal.phone_number 
                              : `${withdrawal.bank_name} - ${withdrawal.account_number}`
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(withdrawal.status)}>
                        {withdrawal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <WithdrawalModal
          availableBalance={balanceData.available_balance}
          onClose={() => {
            setShowModal(false)
            setSelectedMethod(null)
          }}
          onSubmit={handleWithdraw}
          selectedMethod={'mobile'}
          onSelectMethod={() => {}}
          submitting={submitting}
          verifiedPaymentInfo={verifiedPaymentInfo}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          onClose={() => {
            setShowSuccess(false)
            setSuccessMessage('')
            setSuccessTitle('')
          }}
          message={successMessage}
          title={successTitle}
        />
      )}

      {/* Info modal for missing payment method / minimum amount */}
      {infoModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md relative">
            <button
              onClick={() => setInfoModalType(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {infoModalType === 'payment' ? 'Add payment method' : 'Minimum balance required'}
              </h2>
              <p className="text-gray-600 mb-6">
                {infoModalType === 'payment'
                  ? 'Before you can withdraw, please add and verify your payout details on the Payment Info page.'
                  : `You need at least TZS ${MIN_WITHDRAW_AMOUNT.toLocaleString()} available before you can request a withdrawal.`}
              </p>

              {infoModalType === 'payment' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setInfoModalType(null)}
                    className="w-full sm:w-1/2 border border-gray-300 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/creator/payment-info'
                    }}
                    className="w-full sm:w-1/2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-full font-medium transition-all duration-200"
                  >
                    Go to Payment Info
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={() => setInfoModalType(null)}
                    className="w-full max-w-[220px] border border-gray-300 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}