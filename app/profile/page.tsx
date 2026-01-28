'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// Removed old AuthContext import

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    category: '',
    bio: '',
    website: ''
  });
  const [userEmail, setUserEmail] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Auth successful:', userData);
          setUser(userData);
          setUserEmail(userData.email || sessionStorage.getItem('userEmail') || '');
        } else {
          console.log('❌ Auth failed:', response.status, response.statusText);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check authentication and load user data
  useEffect(() => {
    console.log('🔄 Profile page useEffect triggered:', { authLoading, user: !!user });
    
    // Wait for auth to load
    if (authLoading) return;
    
    // If no user and no sessionStorage data, redirect to login
    if (!user && !sessionStorage.getItem('userEmail')) {
      console.log('❌ No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    const userName = sessionStorage.getItem('userName');
    const userEmailSS = sessionStorage.getItem('userEmail');
    if (!userEmail && userEmailSS) {
      setUserEmail(userEmailSS);
    }
    const userUsername = sessionStorage.getItem('userUsername');
    
    if (userName) {
      console.log('📝 Setting initial form data from sessionStorage:', userName);
      setFormData(prev => ({
        ...prev,
        displayName: userName, // Use displayName instead of name
        bio: '', // Ensure bio is clean
        category: '',
        website: ''
      }));
    }
    
    // If no username is provided, generate one from the name or email
    if (!userUsername && userName) {
      const generatedUsername = userName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      sessionStorage.setItem('userUsername', generatedUsername);
    }
    
    // If user is already logged in, load their existing profile data
    if (user) {
      console.log('👤 User found, loading existing profile:', user.id);
      
      // First try to use user_metadata if available
      if (user.user_metadata) {
        console.log('📊 Using user_metadata for profile data:', user.user_metadata);
        const metadata = user.user_metadata;
        
        setFormData(prev => {
          const newFormData = {
            ...prev,
            displayName: metadata.display_name || prev.displayName,
            category: metadata.category || '',
            bio: metadata.bio || '',
            website: metadata.website || ''
          };
          console.log('🔄 Updated form data from user_metadata:', newFormData);
          return newFormData;
        });
        
        if (metadata.avatar_url) {
          setPreviewImage(metadata.avatar_url);
        }
        
        if (metadata.username) {
          sessionStorage.setItem('userUsername', metadata.username);
        }
        
        setIsEditing(true);
      } else {
        // Fallback to API call if no user_metadata
        loadExistingProfile();
      }
    } else {
      console.log('⚠️ No user object available');
    }
    
    // Don't clear sessionStorage data yet - we need it for profile creation
    // Fetch categories from database
    fetchCategories();
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();

      if (response.ok && result.success) {
        const dynamicCategories = result.data.map((cat: any) => ({
          value: cat.slug,
          label: `${cat.icon} ${cat.name}`
        }));
        setCategories(dynamicCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Keep default categories as fallback
    }
  };

  // Debug formData changes
  useEffect(() => {
    console.log('📝 FormData updated:', formData);
  }, [formData]);

  const loadExistingProfile = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Loading profile for user:', user.id);
      const response = await fetch(`/api/profile?user_id=${user.id}`);
      const result = await response.json();
      
      console.log('📊 Profile API response:', { response: response.ok, result });

      if (response.ok) {
        const profile = (result && (result.data ?? result)) || null; // Normalize profile shape
        if (result?.success === false || !profile) {
          console.log('ℹ️ No existing profile found yet');
          setIsEditing(false);
          return;
        }
        console.log('👤 Profile data:', profile);
        // Ensure bio is clean and not containing system messages
        const cleanBio = profile.bio && 
          !profile.bio.includes('Initial verification code sent successfully') && 
          !profile.bio.includes('Verification code sent successfully') 
          ? profile.bio 
          : '';
          
        setFormData(prev => {
          const newFormData = {
            ...prev,
            displayName: profile.display_name || prev.displayName,
            category: profile.category || '',
            bio: cleanBio,
            website: profile.website || ''
          };
          console.log('🔄 Updating form data with profile:', newFormData);
          console.log('📊 Current formData before update:', prev);
          return newFormData;
        });
        
        // Set the existing username in sessionStorage
        if (profile.username) {
          sessionStorage.setItem('userUsername', profile.username);
          console.log('✅ Loaded existing username:', profile.username);
        } else {
          console.log('⚠️ No username found in existing profile');
        }
        
        if (profile.avatar_url) {
          setPreviewImage(profile.avatar_url);
        }
        
        // Set editing mode if profile exists
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading existing profile:', error);
    }
  };

  const [categories, setCategories] = useState([
    { value: 'entrepreneur', label: '💼 Entrepreneur' },
    { value: 'blogger', label: '✍️ Blogger' },
    { value: 'coach', label: '🎯 Coach' },
    { value: 'developer', label: '👨‍💻 Developer' },
    { value: 'educator', label: '📚 Educator' },
    { value: 'writer', label: '✒️ Writer' },
    { value: 'author', label: '📖 Author' },
    { value: 'artist', label: '🎨 Artist' },
    { value: 'marketer', label: '📊 Marketer' },
    { value: 'youtuber', label: '🎥 YouTuber' },
    { value: 'tiktoker', label: '📱 TikToker' },
    { value: 'designer', label: '🎨 Designer' },
    { value: 'content_creator', label: '🎬 Content Creator' }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ profile_image: 'Profile photo size should not exceed 5MB' });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ profile_image: 'Only JPG, PNG, GIF and WebP files are allowed' });
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, profile_image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload image to Supabase Storage
      if (user) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', user.id);

          const response = await fetch('/api/upload-profile-image', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            console.log('Image uploaded successfully:', data.url);
            // Store the uploaded image URL for later use
            setPreviewImage(data.url);
          } else {
            console.error('Error uploading image:', data.error);
            setErrors({ profile_image: 'Failed to upload image. Please try again.' });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setErrors({ profile_image: 'Failed to upload image. Please try again.' });
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio should be at least 50 characters long';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio should not exceed 500 characters';
    }

    if (!previewImage && !selectedFile) {
      newErrors.profile_image = 'Profile photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!user) {
        setErrors({ general: 'Please login to update your profile.' });
        setIsLoading(false);
        return;
      }

      // Get username from sessionStorage
      let userUsername = sessionStorage.getItem('userUsername');
      
      // Generate username if still null
      if (!userUsername) {
        if (formData.displayName) {
          userUsername = formData.displayName.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
          console.log('🔧 Generated username from name:', userUsername);
        } else if (user?.email) {
          userUsername = user.email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
          console.log('🔧 Generated username from email:', userUsername);
        } else {
          userUsername = 'user' + Date.now().toString().slice(-6);
          console.log('🔧 Generated fallback username:', userUsername);
        }
        sessionStorage.setItem('userUsername', userUsername || '');
      } else {
        console.log('✅ Using existing username:', userUsername);
      }
      
      console.log('Profile creation attempt:', {
        ...formData,
        username: userUsername
      });
      
      // Save profile data to Supabase (use upsert to handle both insert and update)
      // Format website URL (add https if missing)
      let formattedWebsite = formData.website?.trim();
      if (formattedWebsite && !formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      const updateResponse = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          username: userUsername,
          display_name: formData.displayName,
          bio: formData.bio,
          category: formData.category,
          website: formattedWebsite || null,
          avatar_url: previewImage || null
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Profile update error:', errorData.error);
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      console.log('Profile created successfully');
      console.log('Profile data saved:', {
        id: user.id,
        username: userUsername,
        display_name: formData.displayName,
        bio: formData.bio,
        category: formData.category,
        website: formData.website,
        avatar_url: previewImage || null
      });
      
      // Capture values for welcome email before clearing storage
      const emailForWelcome = sessionStorage.getItem('userEmail') || user?.email;
      const usernameForWelcome = (sessionStorage.getItem('userUsername') || userUsername || user?.username || '').toString();
      
      // Show success popup with progress animation
      setShowSuccessPopup(true);
      
      // Start progress animation
      setTimeout(() => {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          progressBar.style.width = '100%';
        }
      }, 100);
      
      // Update loading text during progress
      setTimeout(() => {
        const loadingText = document.querySelector('.loading-text') as HTMLElement;
        if (loadingText) {
          loadingText.textContent = 'Almost there...';
        }
      }, 2500);
      
      // Send welcome email for new creators
      if (!isEditing) {
        try {
          if (emailForWelcome && usernameForWelcome) {
            await fetch('/api/send-welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailForWelcome,
                username: usernameForWelcome
              })
            });
          }
        } catch (error) {
          console.log('Welcome email failed to send:', error);
        }
      }

      // If this user came via a referral, record a 'profile_complete' conversion once
      try {
        const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referralCode') : null;
        const guardKey = `referralProfileComplete:${user.id}:${referralCode || ''}`;
        if (referralCode && !localStorage.getItem(guardKey)) {
          fetch('/api/referrals/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referralCode,
              userId: user.id,
              conversionType: 'profile_complete',
              conversionValue: 0
            })
          }).catch(err => console.log('Referral profile_complete conversion failed:', err));
          localStorage.setItem(guardKey, '1');
        }
      } catch (err) {
        console.log('Referral conversion processing error:', err);
      }

      // Clear user data from sessionStorage after attempting to send email
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userPassword');
      sessionStorage.removeItem('userUsername');

      // Show success message and redirect
      setTimeout(() => {
        const loadingAnimation = document.querySelector('.loading-animation') as HTMLElement;
        const popupMessage = document.getElementById('popupMessage');
        const popupContent = document.querySelector('.popup-content') as HTMLElement;
        
        if (loadingAnimation) {
          loadingAnimation.style.display = 'none';
        }
        
        if (popupMessage && popupContent) {
          popupMessage.innerHTML = `
            <div class="success-message">
              <div class="checkmark-circle">
                <div class="checkmark"></div>
              </div>
              <h2>Profile Complete!</h2>
               <p class="success-text">${isEditing ? 'Profile updated successfully!' : 'Welcome to Nisapoti! 🎉'}</p>
            </div>
          `;
          popupContent.classList.add('success');
        }
        
        // Redirect after showing success message
        setTimeout(() => {
          if (isEditing) {
            console.log('Redirecting to dashboard...');
            router.push('/creator/dashboard');
          } else {
            console.log('Redirecting to welcome page...');
            router.push('/creator/welcome');
          }
        }, 2000);
      }, 7000);
    } catch (error) {
      setShowSuccessPopup(false); // Hide popup on error
      setErrors({ general: error instanceof Error ? error.message : 'Profile creation failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no user and no sessionStorage data
  if (!user && !sessionStorage.getItem('userEmail')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please login to access your profile page.</p>
            <Link 
              href="/login" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Popup Styles */}
      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        
        .popup-content {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        
        .loading-animation {
          margin-bottom: 20px;
        }
        
        .progress-container {
          width: 100%;
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 15px;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #FF6A1A, #FF9A3C);
          width: 0%;
          transition: width 7s ease-in-out;
          border-radius: 3px;
        }
        
        .loading-text {
          font-size: 16px;
          color: #666;
          font-weight: 500;
        }
        
        .popup-text p {
          font-size: 18px;
          color: #333;
          margin: 0;
          line-height: 1.5;
        }
        
        .success-message {
          text-align: center;
        }
        
        .checkmark-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: checkmarkPulse 0.6s ease-in-out;
        }
        
        .checkmark {
          width: 20px;
          height: 20px;
          border: 3px solid white;
          border-top: none;
          border-right: none;
          transform: rotate(-45deg);
          animation: checkmarkDraw 0.5s ease-in-out 0.3s both;
        }
        
        .success-message h2 {
          color: #333;
          font-size: 24px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        
        .success-text {
          color: #666;
          font-size: 16px;
          margin: 0;
        }
        
        @keyframes checkmarkPulse {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes checkmarkDraw {
          0% { opacity: 0; transform: rotate(-45deg) scale(0); }
          100% { opacity: 1; transform: rotate(-45deg) scale(1); }
        }
        
        .popup-content.success {
          animation: successBounce 0.6s ease-in-out;
        }
        
        @keyframes successBounce {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Logo Section */}
      <div className="w-full flex flex-col items-center mt-10 mb-6">
        <Link href="/">
          <Image 
            src="/assets/images/logos/logo.png" 
            alt="Nisapoti Logo" 
            width={40}
            height={40}
            className="h-10 w-auto mb-2 object-contain"
            onError={(e) => {
              console.log('Logo failed to load, trying fallback');
              e.currentTarget.src = '/logo.png';
            }}
          />
        </Link>
      </div>

      {/* Profile Form */}
      <div className="w-full max-w-full md:w-[600px] mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          {isEditing ? 'Profile Information' : 'Complete your page'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 mx-auto md:mx-0 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Upload profile photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {errors.profile_image && (
                <div className="text-red-500 text-sm mt-1 text-center">{errors.profile_image}</div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              {/* Name Field */}
              <div className="input-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input 
                  type="text" 
                  name="displayName" 
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
                />
                {errors.displayName && (
                  <div className="text-red-500 text-sm mt-1">{errors.displayName}</div>
                )}
              </div>

              {/* Category Field */}
              <div className="input-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  name="category" 
                  value={formData.category}
                  onChange={handleInputChange}
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
                >
                  <option value="" disabled>Select your category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <div className="text-red-500 text-sm mt-1">{errors.category}</div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Field */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell people about yourself..."
              rows={4}
              required 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors resize-none"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </div>
            {errors.bio && (
              <div className="text-red-500 text-sm mt-1">{errors.bio}</div>
            )}
          </div>

          {/* Website Field */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Website or social link <span className="text-gray-400 text-sm font-normal">(Optional)</span></label>
            <input 
              type="text" 
              name="website" 
              value={formData.website}
              onChange={handleInputChange}
              placeholder="yourwebsite.com or https://yourwebsite.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-gray-50 text-gray-700 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: We&apos;ll add https:// if needed</p>
          </div>

          {/* Account Information (Read-only email and username) */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`nisapoti.com/${sessionStorage.getItem('userUsername') || ''}`}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-bold text-lg shadow-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isEditing ? 'Updating profile...' : 'Creating profile...') : (isEditing ? 'Update Profile' : 'Next')}
          </button>

          {/* Danger Zone */}
          <div className="mt-8 border-t border-red-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Disable your account. You can contact support to re-enable it later.
            </p>
            {!user && (
              <p className="text-xs text-red-600 mb-3">You must be logged in to disable your account.</p>
            )}
            <button
              type="button"
              disabled={!user}
              onClick={async () => {
                if (!confirm('Are you sure you want to disable your account? This will log you out.')) return;
                try {
                  const resp = await fetch('/api/account/disable', { method: 'POST' });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data.error || 'Failed to disable account');
                  // Clear local/session storage and redirect to login
                  sessionStorage.clear();
                  localStorage.removeItem('referralCode');
                  window.location.href = '/login';
                } catch (e: any) {
                  alert(e.message || 'Failed to disable account. Please try again.');
                }
              }}
              className={`w-full md:w-auto px-4 py-2 rounded-lg text-white font-semibold transition ${
                !user ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Disable account
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="loading-animation">
              <div className="progress-container">
                <div className="progress-bar"></div>
              </div>
              <div className="loading-text">Loading...</div>
            </div>
            <div className="popup-text">
              <p id="popupMessage">{isEditing ? 'Updating your profile...' : 'We&apos;re setting up your Nisapoti profile...'}</p>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
