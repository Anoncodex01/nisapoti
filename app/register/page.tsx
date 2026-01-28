'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthLogo from '@/components/AuthLogo';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function RegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState('');

  // Check if user is already authenticated and get username from sessionStorage
  useEffect(() => {
    if (!authLoading && user) {
      // User is already logged in, redirect to dashboard
      router.push('/creator/dashboard');
      return;
    }
    
    const username = sessionStorage.getItem('selectedUsername');
    if (username) {
      setSelectedUsername(username);
    } else {
      // If no username found, redirect back to choose username
      router.push('/choose-username');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    // Registration process with custom API
    try {
      console.log('Registration attempt:', { ...formData, username: selectedUsername });
      
      // First check if email already exists by trying to create user
      // The API will handle this check and return appropriate response
      
      // Create user using our custom API
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.displayName,
          username: selectedUsername,
          referralCode: localStorage.getItem('referralCode')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration response:', data);
      
      // Store user data in sessionStorage for profile creation
      sessionStorage.setItem('userEmail', formData.email);
      sessionStorage.setItem('userName', formData.displayName);
      sessionStorage.setItem('userUsername', selectedUsername);
      
      // Clear the username from sessionStorage
      sessionStorage.removeItem('selectedUsername');
      
      // Handle different actions based on user status
      if (data.action === 'verify') {
        // User needs email verification - this is the normal flow
        router.push('/verify-email');
      } else if (data.action === 'profile') {
        // User is verified but needs to complete profile
        router.push('/profile');
      } else if (data.action === 'login') {
        // User is fully registered, show message and redirect to login
        setErrors({ 
          general: 'This email is already registered. Please log in instead.' 
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Default: always go to email verification first
        router.push('/verify-email');
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Registration failed. Please try again.' });
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
      <AuthLogo />

      {/* Registration Form */}
      <div className="w-full max-w-full md:w-[450px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">Create your account</h1>
        {selectedUsername && (
          <p className="text-gray-600 text-center mb-8">
            Your username: <span className="font-semibold text-orange-600">nisapoti.com/{selectedUsername}</span>
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name Field */}
          <div className="input-group">
            <input 
              type="text" 
              name="displayName" 
              placeholder="Display name" 
              value={formData.displayName}
              onChange={handleInputChange}
              required 
              autoFocus 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            {errors.displayName && (
              <div className="text-red-500 text-sm mt-1">{errors.displayName}</div>
            )}
          </div>

          {/* Email Field */}
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              placeholder="Email address" 
              value={formData.email}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            {errors.email && (
              <div className="text-red-500 text-sm mt-1">{errors.email}</div>
            )}
          </div>

          {/* Password Field */}
          <div className="input-group">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleInputChange}
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            {errors.password && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>


          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm">{errors.general}</div>
          )}

          {/* Register Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>

          {/* Links */}
          <div className="text-center text-sm mt-4">
            <Link href="/login" className="text-gray-500 hover:text-orange-500 transition-colors">
              Already have an account? <span className="underline">Log in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
