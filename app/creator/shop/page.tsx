'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Package, 
  Calendar, 
  Clock,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  X,
  Upload,
  Info,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import OrderDetailsModal from '@/components/OrderDetailsModal';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  timeAgo: string;
  avatar: string;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'draft';
  sales: number;
  createdAt: string;
  feature_image_url?: string;
  file_url?: string;
  limit_slots: boolean;
  max_slots?: number;
  sold_slots: number;
  allow_quantity?: boolean;
}

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'listings'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    last30DaysRevenue: 0,
    totalProducts: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    hasMore: false
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    featuredImage: null as File | null,
    successPage: 'confirmation',
    confirmationMessage: '',
    redirectUrl: '',
    file: null as File | null,
    categories: [] as string[],
    contentDeclaration: false,
    askQuestion: false,
    question: '',
    limitSlots: false,
    maxSlots: '',
    allowQuantity: false
  });

  const [availableCategories, setAvailableCategories] = useState([
    'ebooks', 'podcasts', 'tutorials', 'courses', 'templates', 'software', 'music', 'videos'
  ]);

  // Fetch real data from API
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        // Fetch products
        const productsResponse = await fetch('/api/shop/products/simplified');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          if (productsData.success) {
            setProducts(productsData.data.products);
            
            // Update products count in stats
            setStats(prevStats => ({
              ...prevStats,
              totalProducts: productsData.data.products.length
            }));
          }
        }
        
        // Fetch orders with pagination and search
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const ordersResponse = await fetch(`/api/shop/orders/simplified?limit=${pageSize}&offset=${(currentPage - 1) * pageSize}${searchParam}`);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          if (ordersData.success) {
            // Transform orders data to match the expected format
            const transformedOrders = ordersData.data.orders.map((order: any) => ({
              id: order.id,
              customerName: order.buyer_name,
              customerEmail: order.buyer_email,
              amount: parseFloat(order.total_amount),
              status: order.payment_status,
              timeAgo: new Date(order.order_date).toLocaleDateString(),
              avatar: order.buyer_name.charAt(0).toUpperCase()
            }));
            setOrders(transformedOrders);
            
            // Update pagination info
            setPaginationInfo({
              total: ordersData.data.pagination.total,
              hasMore: ordersData.data.pagination.hasMore
            });
            setTotalPages(Math.ceil(ordersData.data.pagination.total / pageSize));
            
            // Update stats from orders data
            setStats(prevStats => ({
              ...prevStats,
              totalOrders: ordersData.data.stats.total_orders || 0,
              totalRevenue: ordersData.data.stats.total_revenue || 0,
              last30DaysRevenue: ordersData.data.stats.last_30_days_revenue || 0
            }));
          }
        }
        
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [currentPage, pageSize, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'refunded':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProductTypeColor = (category: string) => {
    switch (category) {
      case 'ebooks':
        return 'text-blue-600 bg-blue-50';
      case 'podcasts':
        return 'text-purple-600 bg-purple-50';
      case 'tutorials':
        return 'text-green-600 bg-green-50';
      case 'courses':
        return 'text-orange-600 bg-orange-50';
      case 'templates':
        return 'text-pink-600 bg-pink-50';
      case 'software':
        return 'text-indigo-600 bg-indigo-50';
      case 'music':
        return 'text-red-600 bg-red-50';
      case 'videos':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      featuredImage: null,
      successPage: 'confirmation',
      confirmationMessage: '',
      redirectUrl: '',
      file: null,
      categories: [],
      contentDeclaration: false,
      askQuestion: false,
      question: '',
      limitSlots: false,
      maxSlots: '',
      allowQuantity: false
    });
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setExistingImageUrl(product.feature_image_url || null);
    setExistingFileUrl(product.file_url || null);
    setProductForm({
      name: product.title,
      description: product.description || '',
      price: product.price.toString(),
      featuredImage: null,
      successPage: 'confirmation',
      confirmationMessage: '',
      redirectUrl: '',
      file: null,
      categories: product.category ? [product.category] : [],
      contentDeclaration: false,
      askQuestion: false,
      question: '',
      limitSlots: product.limit_slots || false,
      maxSlots: product.max_slots?.toString() || '',
      allowQuantity: product.allow_quantity || false
    });
    setShowProductForm(true);
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      const newCategory = customCategory.trim().toLowerCase();
      if (!availableCategories.includes(newCategory)) {
        setAvailableCategories(prev => [...prev, newCategory]);
      }
      // Select the new category
      setProductForm(prev => ({
        ...prev,
        categories: [newCategory]
      }));
      setCustomCategory('');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shop/products/simplified?id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the products list
          const productsResponse = await fetch('/api/shop/products/simplified');
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (productsData.success) {
              setProducts(productsData.data.products);
              setStats(prevStats => ({
                ...prevStats,
                totalProducts: productsData.data.products.length
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'featuredImage' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      setProductForm(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Product form submitted:', productForm);
    
    try {
      let featureImageUrl = null;
      let fileUrl = null;

      // Upload featured image if provided
      if (productForm.featuredImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', productForm.featuredImage);
        
        const imageResponse = await fetch('/api/upload/product-image', {
          method: 'POST',
          body: imageFormData
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          featureImageUrl = imageData.url;
        } else {
          console.error('Failed to upload featured image');
        }
      } else if (editingProduct && existingImageUrl) {
        // Keep existing image if no new one uploaded
        featureImageUrl = existingImageUrl;
      }

      // Upload product file if provided
      if (productForm.file) {
        const fileFormData = new FormData();
        fileFormData.append('file', productForm.file);
        
        const fileResponse = await fetch('/api/upload/product-file', {
          method: 'POST',
          body: fileFormData
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileUrl = fileData.url;
        } else {
          console.error('Failed to upload product file');
        }
      } else if (editingProduct && existingFileUrl) {
        // Keep existing file if no new one uploaded
        fileUrl = existingFileUrl;
      }

      const productData = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        title: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.categories[0] || 'ebooks',
        feature_image_url: featureImageUrl,
        success_page_type: productForm.successPage,
        confirmation_message: productForm.confirmationMessage,
        redirect_url: productForm.redirectUrl,
        file_url: fileUrl,
        content_url: productForm.redirectUrl, // For content links
        limit_slots: productForm.limitSlots,
        max_slots: productForm.limitSlots ? parseInt(productForm.maxSlots) : null,
        allow_quantity: productForm.allowQuantity,
        status: 'active'
      };

      const url = editingProduct 
        ? `/api/shop/products/simplified` 
        : '/api/shop/products/simplified';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(editingProduct ? 'Product updated successfully:' : 'Product created successfully:', result.data);
          // Refresh the products list
          const productsResponse = await fetch('/api/shop/products/simplified');
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (productsData.success) {
              setProducts(productsData.data.products);
              setStats(prevStats => ({
                ...prevStats,
                totalProducts: productsData.data.products.length
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
    
    setProductForm({
      name: '',
      description: '',
      price: '',
      featuredImage: null,
      successPage: 'confirmation',
      confirmationMessage: '',
      redirectUrl: '',
      file: null,
      categories: [],
      contentDeclaration: false,
      askQuestion: false,
      question: '',
      limitSlots: false,
      maxSlots: '',
      allowQuantity: false
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedOrderId(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleExportOrders = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all orders for export
      const response = await fetch('/api/shop/orders/simplified?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch orders');
      }
      
      const orders = data.data.orders;
      
      // Create CSV content
      const csvHeaders = [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Product Title',
        'Product Category',
        'Quantity',
        'Unit Price',
        'Total Amount',
        'Payment Status',
        'Payment Method',
        'Order Date'
      ];
      
      const csvRows = orders.map((order: any) => [
        order.order_number || '',
        order.buyer_name || '',
        order.buyer_email || '',
        order.product_title || '',
        order.product_category || '',
        order.quantity || 1,
        order.unit_price || 0,
        order.total_amount || 0,
        order.payment_status || '',
        order.payment_method || '',
        new Date(order.order_date).toLocaleDateString()
      ]);
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((field: string | number) => `"${field}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Failed to export orders. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProducts = async () => {
    try {
      setIsExporting(true);
      
      // Create CSV content for products
      const csvHeaders = [
        'Product ID',
        'Title',
        'Description',
        'Category',
        'Price',
        'Status',
        'Sales Count',
        'Created Date',
        'Feature Image URL',
        'File URL',
        'Limit Slots',
        'Max Slots',
        'Sold Slots',
        'Allow Quantity'
      ];
      
      const csvRows = products.map((product: any) => [
        product.id || '',
        product.title || '',
        product.description || '',
        product.category || '',
        product.price || 0,
        product.status || '',
        product.sales || 0,
        new Date(product.createdAt).toLocaleDateString(),
        product.feature_image_url || '',
        product.file_url || '',
        product.limit_slots ? 'Yes' : 'No',
        product.max_slots || '',
        product.sold_slots || 0,
        product.allow_quantity ? 'Yes' : 'No'
      ]);
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((field: string | number) => `"${field}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting products:', error);
      alert('Failed to export products. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // For orders, we'll use the API search instead of client-side filtering
  // const filteredOrders = orders.filter(order => 
  //   order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  // );
  const filteredOrders = orders; // Use orders directly since API handles pagination

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Shop Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your products, orders, and digital content</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'listings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Listings
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs sm:text-sm text-gray-600">Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">Tzs {stats.last30DaysRevenue.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-600">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">Tzs {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-600">All-time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs sm:text-sm text-gray-600">Products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'orders' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Orders Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">RECENT ORDERS</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleExportOrders}
                    disabled={isExporting || orders.length === 0}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="px-4 sm:px-6 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">When people purchase your digital products, their orders will appear here.</p>
                <button 
                  onClick={handleAddProduct}
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div 
                        className="flex items-center space-x-3 sm:space-x-4 cursor-pointer flex-1"
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {order.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{order.customerName}</p>
                          <p className="text-sm text-gray-500 truncate">{order.customerEmail}</p>
                          <p className="text-xs text-gray-400 mt-1">Click to view details</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            Tzs {order.amount.toLocaleString()} ({order.status})
                          </span>
                          <span className="text-sm text-gray-500">{order.timeAgo}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {filteredOrders.length > 0 && totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  {/* Page size selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value={6}>6 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                  
                  {/* Pagination info */}
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, paginationInfo.total)} of {paginationInfo.total} orders
                  </div>
                  
                  {/* Pagination controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded-md border ${
                              currentPage === pageNum
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Listings Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">YOUR PRODUCTS</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleExportProducts}
                    disabled={isExporting || products.length === 0}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                  <button 
                    onClick={handleAddProduct}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <div className="px-4 sm:px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500 mb-6">Start selling by adding your first digital product</p>
                  <button 
                    onClick={handleAddProduct}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </button>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.feature_image_url ? (
                            <img 
                              src={product.feature_image_url} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="font-medium text-gray-900 truncate">{product.title}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(product.category)} self-start`}>
                              {product.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Tzs {product.price.toLocaleString()} • {product.sales} sales</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.status === 'active' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-600 bg-gray-50'
                        }`}>
                          {product.status}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Product Creation Form Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-4xl w-full my-4 max-h-none">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Create Product'}
                </h2>
                <button
                  onClick={() => setShowProductForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                    placeholder="What are you offering?"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                    <Info className="w-4 h-4 inline ml-1 text-gray-400" />
                  </label>
                  <div className="border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2 p-2 border-b border-gray-200">
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">
                        <strong className="text-sm font-bold">B</strong>
                      </button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">
                        <em className="text-sm italic">I</em>
                      </button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">
                        <span className="text-sm underline">U</span>
                      </button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">
                        <span className="text-sm">•</span>
                      </button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">
                        <span className="text-sm">🔗</span>
                      </button>
                    </div>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-3 border-0 bg-transparent focus:ring-0 resize-none"
                      rows={4}
                      placeholder="Describe what you're selling in a few sentence"
                      required
                    />
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Featured image (optional)</label>
                  <div className="flex items-start space-x-4">
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 w-32 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                      {existingImageUrl && !productForm.featuredImage ? (
                        <img 
                          src={existingImageUrl} 
                          alt="Current image" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'featuredImage')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        We recommend an image should be square, at least 1080x1080px, and JPG, PNG or GIF format.
                      </p>
                      {productForm.featuredImage && (
                        <p className="text-sm text-green-600 mt-1">Selected: {productForm.featuredImage.name}</p>
                      )}
                      {existingImageUrl && !productForm.featuredImage && (
                        <p className="text-sm text-blue-600 mt-1">Current image will be kept</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">TZS</span>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-lg"
                      placeholder="10000"
                      required
                    />
                  </div>
                </div>

                {/* Success Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Success page
                    <Info className="w-4 h-4 inline ml-1 text-gray-400" />
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="successPage"
                        value="confirmation"
                        checked={productForm.successPage === 'confirmation'}
                        onChange={(e) => setProductForm(prev => ({ ...prev, successPage: e.target.value }))}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Confirmation message</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="successPage"
                        value="redirect"
                        checked={productForm.successPage === 'redirect'}
                        onChange={(e) => setProductForm(prev => ({ ...prev, successPage: e.target.value }))}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Redirect to a URL after purchase</span>
                    </label>
                  </div>
                  
                  {productForm.successPage === 'confirmation' && (
                    <textarea
                      value={productForm.confirmationMessage}
                      onChange={(e) => setProductForm(prev => ({ ...prev, confirmationMessage: e.target.value }))}
                      className="w-full mt-3 px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                      rows={3}
                      placeholder="Enter confirmation message here"
                    />
                  )}
                  
                  {productForm.successPage === 'redirect' && (
                    <input
                      type="url"
                      value={productForm.redirectUrl}
                      onChange={(e) => setProductForm(prev => ({ ...prev, redirectUrl: e.target.value }))}
                      className="w-full mt-3 px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                      placeholder="https://example.com"
                    />
                  )}
                </div>

                {/* Upload File */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Upload file</span>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'file')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  </div>
                  {productForm.file && (
                    <p className="text-sm text-green-600 mt-1">✓ Selected: {productForm.file.name}</p>
                  )}
                </div>



                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Category (select one)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={productForm.categories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProductForm(prev => ({
                                ...prev,
                                categories: [category] // Only allow one category
                              }));
                            }
                          }}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom category input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      disabled={!customCategory.trim()}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Content Declaration */}
                <div className="border-t pt-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={productForm.contentDeclaration}
                      onChange={(e) => setProductForm(prev => ({ ...prev, contentDeclaration: e.target.checked }))}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I created this and it doesn&apos;t contain any illegal, adult, copyrighted or{' '}
                      <span className="underline">prohibited content</span>.
                    </span>
                  </label>
                </div>

                {/* Advanced Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced settings</h3>
                  
                  {/* Ask a question */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Ask a question (optional)</span>
                      <Info className="w-4 h-4 ml-1 text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.askQuestion}
                        onChange={(e) => setProductForm(prev => ({ ...prev, askQuestion: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {productForm.askQuestion && (
                    <input
                      type="text"
                      value={productForm.question}
                      onChange={(e) => setProductForm(prev => ({ ...prev, question: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                      placeholder="What question would you like to ask buyers?"
                    />
                  )}

                  {/* Limit slots */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Limit slots (optional)</span>
                      <Info className="w-4 h-4 ml-1 text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.limitSlots}
                        onChange={(e) => setProductForm(prev => ({ ...prev, limitSlots: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {productForm.limitSlots && (
                    <input
                      type="number"
                      value={productForm.maxSlots}
                      onChange={(e) => setProductForm(prev => ({ ...prev, maxSlots: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                      placeholder="Maximum number of slots"
                      min="1"
                    />
                  )}

                  {/* Allow quantity */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Allow buyer to choose a quantity</span>
                      <Info className="w-4 h-4 ml-1 text-gray-400" />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.allowQuantity}
                        onChange={(e) => setProductForm(prev => ({ ...prev, allowQuantity: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />
    </div>
  );
}
