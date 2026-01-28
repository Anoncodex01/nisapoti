'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    
    if (referralCode) {
      // Track referral click
      const trackReferral = async () => {
        try {
          const response = await fetch('/api/referrals/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referralCode,
              ipAddress: '', // Will be handled server-side
              userAgent: navigator.userAgent,
              referrerUrl: document.referrer
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Referral tracked:', data);
            
            // Store referral info in localStorage for later use
            localStorage.setItem('referralCode', referralCode);
            localStorage.setItem('referrerInfo', JSON.stringify(data.data.referrer));
          }
        } catch (error) {
          console.error('Error tracking referral:', error);
        }
      };

      trackReferral();
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}
