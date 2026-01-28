'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface PaymentData {
  depositId: string;
  amount: number;
  supporterName: string;
  creatorUsername: string;
  status: string;
}

export default function SupportThankYouPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get URL parameters
  const token = searchParams.get('token');
  const depositId = searchParams.get('depositId');
  const amount = searchParams.get('amount');
  const supporterName = searchParams.get('supporterName') || 'Anonymous';
  const creatorUsername = searchParams.get('creatorUsername');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch payment data and check status when component mounts
  useEffect(() => {
    if (!mounted) return;

    const fetchPaymentData = async () => {
      try {
        if (token) {
          // Use token-based verification
           const response = await fetch(`/api/payments/validate-token?token=${token}`);
          const result = await response.json();
          
          if (response.ok && result.success) {
            setPaymentData({
              depositId: result.data.depositId,
              amount: result.data.amount,
              supporterName: result.data.supporterName,
              creatorUsername: result.data.creatorUsername,
              status: result.data.status || 'pending'
            });
          } else {
            setError('Invalid payment token');
          }
        } else if (depositId && amount && creatorUsername) {
          // Fallback to URL parameters - check actual payment status
          const statusResponse = await fetch(`/api/payments/check-status?depositId=${depositId}`);
          const statusResult = await statusResponse.json();
          
          setPaymentData({
            depositId,
            amount: parseFloat(amount),
            supporterName,
            creatorUsername,
            status: statusResult.status || 'pending'
          });
        } else {
          setError('No payment data found');
        }
      } catch (err) {
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [mounted, token, depositId, amount, supporterName, creatorUsername]);

  // Poll for payment status updates if still pending
  useEffect(() => {
    if (!paymentData || paymentData.status === 'completed' || paymentData.status === 'failed') {
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/check-status?depositId=${paymentData.depositId}`);
        const result = await response.json();
        
        if (result.success) {
          if (result.status === 'completed' && paymentData.status !== 'completed') {
            setPaymentData(prev => prev ? { ...prev, status: 'completed' } : null);
          } else if (result.status === 'failed' && paymentData.status !== 'failed') {
            setPaymentData(prev => prev ? { ...prev, status: 'failed' } : null);
          } else if (result.status === 'pending') {
            // Keep polling if still pending (max 30 seconds)
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    };

    // Start polling after 2 seconds, then every 3 seconds
    const timeoutId = setTimeout(() => {
      checkStatus();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [paymentData]);

  // Trigger confetti when payment data is loaded
  useEffect(() => {
    if (!paymentData) return;
    
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(confettiInterval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);

    return () => clearInterval(confettiInterval);
  }, [paymentData]);

  // Show loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Show error if no valid data
  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error || 'No payment data found. Please try again.'}</p>
          <Link href="/" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
      <style jsx>{`
        .amount-display {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03));
          padding: 1.5rem;
          border-radius: 20px;
          margin: 2rem 0;
          position: relative;
          overflow: hidden;
        }

        .amount-display::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 107, 53, 0.1),
            transparent
          );
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        .success-content {
          text-align: center;
          padding: 3rem;
          max-width: 90%;
          width: 440px;
          animation: modalPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(145deg, #ffffff, #fff6f3);
          border-radius: 32px;
          box-shadow: 
            0 24px 48px -12px rgba(255, 107, 53, 0.18),
            0 0 0 1px rgba(255, 107, 53, 0.08);
        }

        @keyframes modalPop {
          0% { transform: scale(0.95); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center success-content">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF6B35] to-[#FF8B3D] rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              You're Amazing! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              You just supported <strong>{paymentData.creatorUsername}</strong>
            </p>
          </div>

          {/* Amount Display */}
          <div className="amount-display">
            <p className="text-[#FF6B35] text-5xl font-bold tracking-tight font-mono">
              TZS {Number(paymentData.amount).toLocaleString()}
            </p>
          </div>

          {/* Payment Status */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Payment Status</p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              paymentData.status === 'completed' ? 'bg-green-100 text-green-800' :
              paymentData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {paymentData.status === 'completed' ? '✅ Completed' :
               paymentData.status === 'pending' ? '⏳ Processing' :
               '❓ Unknown'}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8">
            <Link href={`/${paymentData.creatorUsername}`}>
              <button className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-medium transform transition-all duration-300 hover:bg-gray-800 hover:scale-105 hover:shadow-lg hover:shadow-gray-200 active:scale-95">
                Thank You! 🎉
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}