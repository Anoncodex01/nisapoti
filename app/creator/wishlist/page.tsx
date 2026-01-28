'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
// Removed old AuthContext import

interface WishlistItem {
  id: string;
  uuid: string;
  name: string;
  category: string;
  price: number;
  description: string;
  link?: string;
  is_priority: boolean;
  hashtags: string;
  amount_funded: number;
  created_at: string;
  images: string[];
  supporters_count: number;
}

export default function WishlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    link: '',
    is_priority: false,
    hashtags: '',
    duration_days: 30
  });
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [showHashtagSection, setShowHashtagSection] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<{[key: string]: number}>({});
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const categories = [
    { value: 'creative', label: '🎨 Creative Projects' },
    { value: 'career', label: '💼 Career & Hustle' },
    { value: 'education', label: '🧠 Education & Growth' },
    { value: 'justbecause', label: '❤️ Just Because' },
    { value: 'celebrations', label: '🎉 Celebrations & Life Events' },
    { value: 'health', label: '❤️‍🩹 Health & Wellness' },
    { value: 'community', label: '🌍 Community & Giving Back' },
    { value: 'faith', label: '💒 Faith & Spiritual Journey' }
  ];

  const hashtags = {
    creative: [
      '#SupportMyArt', '#NewPhoneForContent', '#RingLightSupport', '#YouTubeJourney', '#LevelUpMyGear'
    ],
    career: [
      '#SideHustleGrind', '#ToolsForWork', '#BossMoves', '#SupportMyHustle', '#StartUpSupport'
    ],
    education: [
      '#FundMyStudies', '#LaptopForSchool', '#LearningNeverStops', '#SchoolFeesHelp', '#EducationIsPower'
    ],
    justbecause: [
      '#TreatYourself', '#LittleSupportMatters', '#GiftMeThis', '#RandomKindness', '#YouOnlyLiveOnce'
    ],
    celebrations: [
      '#BirthdayWish', '#GraduationGift', '#WeddingSupport', '#NewBabyLove', '#CelebrateWithMe'
    ],
    health: [
      '#HealthIsWealth', '#MedicalSupport', '#FitnessJourney', '#WellnessFirst', '#HelpMeHeal'
    ],
    community: [
      '#HelpMyFamily', '#SupportLocal', '#GiveBack', '#TogetherWeCan', '#SponsorHope'
    ],
    faith: [
      '#FaithInAction', '#SpiritualSupport', '#HajjJourney', '#ChurchChoirDream', '#BuildFaith'
    ]
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchWishlistItems();
    }
  }, [user?.id]);

  const fetchWishlistItems = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/wishlist?user_id=${user.id}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWishlistItems(result.data || []);
        } else {
          console.error('Error fetching wishlist items:', result.error);
        }
      } else {
        console.error('Failed to fetch wishlist items');
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setNewItem(prev => ({ ...prev, category }));
    setSelectedHashtags([]);
    setShowHashtagSection(!!category && !!hashtags[category as keyof typeof hashtags]);
  };

  const handleHashtagToggle = (hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      } else if (prev.length < 3) {
        return [...prev, hashtag];
      }
      return prev;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (uploadedImages.length + validFiles.length > 5) {
      alert('You can only upload up to 5 images');
      return;
    }

    const newFiles = [...uploadedImages, ...validFiles];
    setUploadedImages(newFiles);

    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const nextImage = (itemId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (itemId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      setSubmitting(true);
      
      // Upload images first if any
      let uploadedImageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach(file => {
          formData.append('images', file);
        });
        
        const uploadResponse = await fetch('/api/wishlist/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (uploadResult.success) {
            uploadedImageUrls = uploadResult.data.images;
          }
        }
      }
      
      // Create wishlist item
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          name: newItem.name,
          category: newItem.category,
          price: parseInt(newItem.price),
          description: newItem.description,
          link: newItem.link,
          is_priority: newItem.is_priority,
          hashtags: selectedHashtags.join(','),
          images: uploadedImageUrls
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the wishlist
          await fetchWishlistItems();
          
          // Reset form
          setNewItem({
            name: '',
            category: '',
            price: '',
            description: '',
            link: '',
            is_priority: false,
            hashtags: ''
          });
          setSelectedHashtags([]);
          setShowHashtagSection(false);
          setUploadedImages([]);
          setImagePreviews([]);
          setShowAddForm(false);
        } else {
          console.error('Error adding wishlist item:', result.error);
        }
      } else {
        console.error('Failed to add wishlist item');
      }
    } catch (error) {
      console.error('Error adding wishlist item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (funded: number, total: number) => {
    return Math.min((funded / total) * 100, 100);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6A1A', '#FF8C42', '#FFB366', '#FFD700', '#32CD32']
    });
  };

  const isFullyFunded = (item: WishlistItem) => {
    return item.amount_funded >= item.price;
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      link: item.link || '',
      is_priority: item.is_priority,
      hashtags: item.hashtags
    });
    setSelectedHashtags(item.hashtags ? item.hashtags.split(',').map(tag => tag.trim()) : []);
    setShowHashtagSection(!!item.category && !!hashtags[item.category as keyof typeof hashtags]);
    setImagePreviews(item.images || []);
    setUploadedImages([]);
    setShowEditForm(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !editingItem) return;
    
    try {
      setSubmitting(true);
      
      // Upload new images if any
      let uploadedImageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach(file => {
          formData.append('images', file);
        });
        
        const uploadResponse = await fetch('/api/wishlist/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (uploadResult.success) {
            uploadedImageUrls = uploadResult.data.images;
          }
        }
      }
      
      // Combine existing images with new ones
      const allImages = [...imagePreviews, ...uploadedImageUrls];
      
      // Update wishlist item
      const response = await fetch(`/api/wishlist/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          price: parseInt(newItem.price),
          description: newItem.description,
          link: newItem.link,
          is_priority: newItem.is_priority,
          hashtags: selectedHashtags.join(','),
          images: allImages
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the wishlist
          await fetchWishlistItems();
          
          // Reset form
          setEditingItem(null);
          setNewItem({
            name: '',
            category: '',
            price: '',
            description: '',
            link: '',
            is_priority: false,
            hashtags: ''
          });
          setSelectedHashtags([]);
          setShowHashtagSection(false);
          setUploadedImages([]);
          setImagePreviews([]);
          setShowEditForm(false);
        } else {
          console.error('Error updating wishlist item:', result.error);
        }
      } else {
        console.error('Failed to update wishlist item');
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist item?')) return;
    
    try {
      const response = await fetch(`/api/wishlist/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the wishlist
          await fetchWishlistItems();
        } else {
          console.error('Error deleting wishlist item:', result.error);
        }
      } else {
        console.error('Failed to delete wishlist item');
      }
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage your wishlist items</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your wishlist items</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-lg hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Item</span>
        </button>
      </div>

      {/* Add/Edit Item Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-t-3xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  {showEditForm ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingItem(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={showEditForm ? handleUpdateItem : handleAddItem} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                    placeholder="e.g., MacBook Pro"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Price (TZS)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                    placeholder="2500000"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Link (Optional)</label>
                  <input
                    type="url"
                    value={newItem.link}
                    onChange={(e) => setNewItem(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Duration (Days)</label>
                  <select
                    value={newItem.duration_days}
                    onChange={(e) => setNewItem(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days (default)</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-2">
                    After this duration, any unfulfilled funds will be released to your available balance
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6A1A]/20 focus:border-[#FF6A1A] transition-all duration-200 text-lg bg-gray-50 hover:bg-white resize-none"
                  placeholder="Describe why you need this item and how it will help you..."
                />
              </div>
              {/* Hashtag Section */}
              {showHashtagSection && (
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800 mb-3">Choose up to 3 hashtags</label>
                  <div className="flex flex-wrap gap-3">
                    {hashtags[newItem.category as keyof typeof hashtags]?.map((hashtag) => (
                      <button
                        key={hashtag}
                        type="button"
                        onClick={() => handleHashtagToggle(hashtag)}
                        className={`px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium ${
                          selectedHashtags.includes(hashtag)
                            ? 'bg-[#FF6A1A] text-white border-[#FF6A1A] shadow-lg'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#FF6A1A]'
                        }`}
                      >
                        {hashtag}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedHashtags.length}/3 hashtags selected
                  </p>
                </div>
              )}

              {/* Image Upload Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Upload Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#FF6A1A] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="imageUpload"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg text-gray-600 mb-2">Click to upload images</p>
                    <p className="text-sm text-gray-500">Upload up to 5 images (JPG, PNG, WEBP, GIF)</p>
                    <p className="text-xs text-gray-400 mt-1">{uploadedImages.length}/5 images selected</p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
                          >
                            ×
                          </button>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#FF6A1A]/10 to-[#FF9A3C]/10 rounded-xl border border-[#FF6A1A]/20">
                <input
                  type="checkbox"
                  id="priority"
                  checked={newItem.is_priority}
                  onChange={(e) => setNewItem(prev => ({ ...prev, is_priority: e.target.checked }))}
                  className="h-5 w-5 text-[#FF6A1A] focus:ring-[#FF6A1A] border-gray-300 rounded"
                />
                <label htmlFor="priority" className="text-lg font-semibold text-gray-800">
                  Mark as priority item
                </label>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingItem(null);
                  }}
                  className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{showEditForm ? 'Updating Item...' : 'Adding Item...'}</span>
                    </div>
                  ) : (
                    showEditForm ? 'Update Item' : 'Add Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlistItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => router.push(`/wishlist/${item.uuid}`)}
          >
            {/* Image Section */}
            <div className="relative">
              <img
                src={item.images[currentImageIndex[item.id] || 0]}
                alt={item.name}
                className="w-full h-40 object-cover"
              />
              
              {/* Heart Icon */}
              <button className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-3.5 h-3.5 text-[#FF6A1A]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Item Name */}
              <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
              
              {/* Price */}
              <div className="text-lg font-bold text-[#FF6A1A] mb-3">
                {formatCurrency(item.price)}
              </div>

              {/* Hashtags */}
              {item.hashtags && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.hashtags.split(',').slice(0, 2).map((tag, index) => (
                      <span key={index} className="text-xs bg-[#FF6A1A]/10 text-[#FF6A1A] px-2 py-1 rounded-full font-medium">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Funding Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Funded: {formatCurrency(item.amount_funded)}</span>
                  <span>Remaining: {formatCurrency(item.price - item.amount_funded)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-[#FF6A1A] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(item.amount_funded, item.price)}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons or Congratulations */}
              {isFullyFunded(item) ? (
                <div className="text-center py-4">
                  <div 
                    className="text-green-600 font-semibold text-sm cursor-pointer"
                    onClick={() => triggerConfetti()}
                  >
                    🎉 Congratulations! Fully Funded! 🎉
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    className="flex-1 bg-[#FF6A1A] text-white py-2.5 rounded-lg font-medium hover:bg-[#FF5A0A] transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="px-3 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {wishlistItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-[#FF6A1A]/20 to-[#FF9A3C]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[#FF6A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No wishlist items yet</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Start building your wishlist to let supporters know what you need and help them support your goals.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] rounded-xl hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Add Your First Item
          </button>
        </div>
      )}
    </div>
  );
}
