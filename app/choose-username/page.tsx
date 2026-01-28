'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function ChooseUsernamePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      // User is already logged in, redirect to dashboard
      router.push('/creator/dashboard');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow alphanumeric and underscore characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9_]/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    // Check if username exists in database
    try {
      console.log('Username check attempt:', formData);
      
      const response = await fetch(`/api/test-username?username=${encodeURIComponent(formData.username)}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Username check error:', result.error);
        throw new Error('Failed to check username availability');
      }

      if (result.exists) {
        setErrors({ username: 'This username is already taken. Please choose another one.' });
        setIsLoading(false);
        return;
      }
      
      // Store username in sessionStorage for the next step
      sessionStorage.setItem('selectedUsername', formData.username);
      
      // Redirect to registration form
      router.push('/register');
    } catch (error) {
      setErrors({ general: 'Username check failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Logo Section */}
      <div className="w-full flex flex-col items-center mt-24 sm:mt-32 mb-6">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="Nisapoti" 
            width={120}
            height={40}
            className="h-12 w-auto object-contain"
            priority
            quality={100}
            onError={(e) => {
              console.log('Logo failed to load, trying fallback');
              e.currentTarget.src = '/assets/images/logos/logo.png';
            }}
          />
        </Link>
      </div>

      {/* Username Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">Choose your username</h1>
        <p className="text-gray-600 text-center mb-8">This is how people will find you on Nisapoti</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field with Prefix */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
              nisapoti.com/
            </div>
            <input 
              type="text" 
              name="username" 
              placeholder="username"
              value={formData.username}
              onChange={handleInputChange}
              pattern="[a-zA-Z0-9_]{3,30}"
              required
              className="w-full pl-[120px] pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
          </div>

          {/* Username Error */}
          {errors.username && (
            <div className="text-red-500 text-sm text-center">{errors.username}</div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}

          {/* Continue Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
