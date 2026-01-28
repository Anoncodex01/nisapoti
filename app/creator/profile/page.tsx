'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  display_name: string;
  category: string;
  bio: string;
  website?: string;
  avatar_url?: string;
  email: string;
  username: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    category: '',
    bio: '',
    website: '',
    avatar_url: '',
    email: '',
    username: '',
    created_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  // Debug profile state changes
  useEffect(() => {
    console.log('📝 Creator profile state updated:', profile);
  }, [profile]);

  const categories = [
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
  ];

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    console.log('🔄 Creator profile useEffect triggered:', { authLoading, user: !!user, userId: user?.id });
    
    if (!authLoading) {
      if (!user) {
        console.log('❌ No user found, redirecting to login');
        router.push('/login');
        return;
      }
      console.log('👤 User found, fetching profile');
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.error('No user found');
        return;
      }

      console.log('🔍 Creator profile: Fetching profile for user:', user.id);
      
      // Fetch profile data from MySQL
      const response = await fetch(`/api/profile?user_id=${user.id}`);
      const result = await response.json();
      
      console.log('📊 Creator profile API response:', { response: response.ok, result });

      if (!response.ok) {
        console.error('Error fetching profile:', result.error);
        return;
      }

      const profileData = result.data || result; // Handle both response formats

      if (profileData) {
        console.log('📊 Creator profile data loaded:', profileData);
        setProfile({
          display_name: profileData.display_name || '',
          category: profileData.category || '',
          bio: profileData.bio || '',
          website: profileData.website || '',
          avatar_url: profileData.avatar_url || '',
          email: user.email || '',
          username: profileData.username || '',
          created_at: profileData.created_at || user.created_at || ''
        });
      } else {
        // Fallback to user_metadata if no profile data found
        console.log('⚠️ No profile data found, trying user_metadata fallback');
        if (user.user_metadata) {
          const metadata = user.user_metadata;
          setProfile({
            display_name: metadata.display_name || '',
            category: metadata.category || '',
            bio: metadata.bio || '',
            website: metadata.website || '',
            avatar_url: metadata.avatar_url || '',
            email: user.email || '',
            username: metadata.username || '',
            created_at: user.created_at || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (!user) {
        console.error('No user found');
        return;
      }

      // Upload avatar if new file is selected
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        const response = await fetch('/api/upload-profile-image', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          avatarUrl = result.url;
          console.log('✅ Avatar uploaded:', avatarUrl);
        } else {
          console.error('❌ Failed to upload avatar');
        }
      }

      // Format website URL (add https if missing)
      let formattedWebsite = profile.website?.trim();
      if (formattedWebsite && !formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      // Update profile in MySQL
      const updateResponse = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          category: profile.category,
          bio: profile.bio,
          website: formattedWebsite || null,
          avatar_url: avatarUrl
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Error updating profile:', errorData.error);
        return;
      }

      // Update local state with new avatar URL
      setProfile(prev => ({
        ...prev,
        avatar_url: avatarUrl
      }));

      console.log('✅ Profile updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your profile information and preferences</p>
        </div>
        <div className="flex items-center ml-6">
          <a
            href={`/creator/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            View Page
          </a>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-[#FF6A1A] to-[#FF9A3C] rounded-full mr-4"></div>
            <h3 className="text-2xl font-bold text-gray-900">Profile Information</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="lg:col-span-1">
              <label className="block text-lg font-semibold text-gray-800 mb-4">Profile Photo</label>
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#FF6A1A] to-[#FF9A3C] rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-2xl object-cover"
                      />
                    ) : profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="w-32 h-32 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {profile.display_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                {showAvatarUpload && (
                  <div className="mt-6 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-[#FF6A1A] file:to-[#FF9A3C] file:text-white hover:file:from-orange-500 hover:file:to-orange-300 transition-all duration-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Display Name</label>
                  <input
                    type="text"
                    name="display_name"
                    value={profile.display_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Category</label>
                  <select
                    name="category"
                    value={profile.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                  >
                    <option value="" disabled>Select your category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows={5}
                  required
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white resize-none"
                  placeholder="Tell people about yourself, your expertise, and what makes you unique..."
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">Share your story and expertise</p>
                  <p className="text-sm text-gray-500">{profile.bio.length}/500 characters</p>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Website <span className="text-gray-400 text-sm font-normal">(Optional)</span></label>
                <input
                  type="text"
                  name="website"
                  value={profile.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                  placeholder="yourwebsite.com or https://yourwebsite.com"
                />
                <p className="text-sm text-gray-500 mt-2">Optional: Link to your website or social media. We&apos;ll add https:// if needed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-[#FF6A1A] to-[#FF9A3C] rounded-full mr-4"></div>
            <h3 className="text-2xl font-bold text-gray-900">Account Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">Username</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 py-4 text-lg text-gray-600 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl font-medium">
                  nisapoti.com/
                </span>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-r-xl bg-gray-100 text-gray-600 text-lg"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Username cannot be changed</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">Member Since</label>
            <div className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-[#FF6A1A]/10 to-[#FF9A3C]/10 border border-[#FF6A1A]/20 rounded-xl">
              <svg className="w-5 h-5 text-[#FF6A1A] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg text-gray-700 font-medium">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-4"></div>
            <h3 className="text-2xl font-bold text-gray-900">Danger Zone</h3>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-red-800 mb-2">Disable Account</h4>
            <p className="text-red-700 mb-4">
              Disable your account. You can contact support to re-enable it later.
            </p>
            {!user && (
              <p className="text-sm text-red-600 mb-4">You must be logged in to disable your account.</p>
            )}
            <button
              type="button"
              disabled={!user}
              onClick={() => setShowDisableModal(true)}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                !user 
                  ? 'bg-red-300 text-red-100 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              Disable Account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <button
            type="button"
            className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {saving ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-t-3xl p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Success!</h3>
            </div>

            {/* Modal Body */}
            <div className="p-8 text-center">
              <p className="text-lg text-gray-700 mb-6">
                Your profile has been updated successfully!
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Your changes are now live and visible to your supporters.
              </p>

              {/* Action Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-white font-semibold rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Account Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-3xl p-6 text-center">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-2xl font-bold text-white">We'll Miss You!</h3>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700 mb-4">
                  We're sad to see you go! Before you disable your account, please let us know why you're leaving.
                </p>
                <p className="text-sm text-gray-600">
                  Your feedback helps us improve Nisapoti for everyone.
                </p>
              </div>

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you disabling your account? (Optional)
                </label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="Tell us what went wrong or what we could improve..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 resize-none"
                />
              </div>

              {/* Support Contact */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Need Help Instead?</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      If you're having issues, our support team is here to help!
                    </p>
                    <a 
                      href="mailto:support@nisapoti.com" 
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      support@nisapoti.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 py-3 px-6 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Keep My Account
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Submit feedback if provided
                      if (disableReason.trim()) {
                        await fetch('/api/feedback/disable', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            reason: disableReason.trim(),
                            user_id: user?.id
                          })
                        }).catch(() => {}); // Don't block disable if feedback fails
                      }

                      // Disable account
                      const resp = await fetch('/api/account/disable', { method: 'POST' });
                      const data = await resp.json();
                      if (!resp.ok) throw new Error(data.error || 'Failed to disable account');
                      
                      // Clear storage and redirect
                      sessionStorage.clear();
                      localStorage.removeItem('referralCode');
                      window.location.href = '/login';
                    } catch (e: any) {
                      alert(e.message || 'Failed to disable account. Please try again.');
                    }
                  }}
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
                >
                  Yes, Disable Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
