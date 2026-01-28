'use client'

import { useState } from 'react'
import { Smartphone, Building } from 'lucide-react'

interface WithdrawalModalProps {
  availableBalance: number
  onClose: () => void
  onSubmit: (formData: FormData) => void
  selectedMethod: 'mobile' | 'bank' | null
  onSelectMethod: (method: 'mobile' | 'bank') => void
  submitting: boolean
  verifiedPaymentInfo?: {
    provider: string
    full_name: string
    phone_number: string
  } | null
}

export default function WithdrawalModal({
  availableBalance,
  onClose,
  onSubmit,
  selectedMethod,
  onSelectMethod,
  submitting,
  verifiedPaymentInfo
}: WithdrawalModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    full_name: verifiedPaymentInfo?.full_name || '',
    phone_number: verifiedPaymentInfo?.phone_number ? (verifiedPaymentInfo.phone_number.startsWith('255') ? '0' + verifiedPaymentInfo.phone_number.substring(3) : verifiedPaymentInfo.phone_number) : '',
    bank_name: '',
    account_number: '',
    provider: verifiedPaymentInfo?.provider || '' // Mobile money provider
  })
  const [confirmedPhoneNumber, setConfirmedPhoneNumber] = useState(false)

  const calculateNetAmount = (amount: number) => {
    const commission = amount * 0.18 // 18% commission
    return amount - commission
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value)
    })
    onSubmit(form)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Withdrawal Form - Direct to mobile money */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Mobile Money Withdrawal</h2>
            </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    disabled={!!verifiedPaymentInfo}
                    className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white ${verifiedPaymentInfo ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:border-gray-300'}`}
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Money Provider</label>
                <select
                  required
                  value={formData.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  disabled={!!verifiedPaymentInfo}
                  className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white ${verifiedPaymentInfo ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:border-gray-300'}`}
                >
                  <option value="">Select Provider</option>
                  <option value="Mix by Yas">Mix by Yas (Tigo)</option>
                  <option value="Airtel">Airtel Money</option>
                  <option value="Halotel">Halotel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{10}"
                  placeholder="e.g., 0755123456"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  disabled={!!verifiedPaymentInfo}
                  className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white ${verifiedPaymentInfo ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:border-gray-300'}`}
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (TZS)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter amount"
                  />
                  {formData.amount && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Commission (18%)</span>
                        <span className="text-sm font-medium text-gray-700">
                          {new Intl.NumberFormat('en-TZ', {
                            style: 'currency',
                            currency: 'TZS',
                            minimumFractionDigits: 0,
                          }).format(parseFloat(formData.amount) * 0.18)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">You'll receive</span>
                        <span className="text-base font-bold text-gray-900">
                          {new Intl.NumberFormat('en-TZ', {
                            style: 'currency',
                            currency: 'TZS',
                            minimumFractionDigits: 0,
                          }).format(calculateNetAmount(parseFloat(formData.amount)))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="confirm-phone"
                    checked={confirmedPhoneNumber}
                    onChange={(e) => setConfirmedPhoneNumber(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirm-phone" className="text-sm text-gray-700 cursor-pointer">
                    I confirm that the payment information is correct
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting || 
                    !formData.amount || 
                    parseFloat(formData.amount) <= 0 || 
                    parseFloat(formData.amount) > availableBalance ||
                    !confirmedPhoneNumber || 
                    !formData.provider
                  }
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {submitting ? 'Processing...' : 'Submit Withdrawal'}
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  )
}
