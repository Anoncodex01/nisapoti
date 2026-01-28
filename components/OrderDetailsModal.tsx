'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Package, 
  DollarSign, 
  CreditCard, 
  Download, 
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface OrderDetails {
  id: string;
  order_number: string;
  creator_id: string;
  buyer_email: string;
  buyer_name: string;
  product_id: string;
  product_title: string;
  product_category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  payment_reference: string;
  deposit_id: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  product_description?: string;
  product_image_url?: string;
  product_type?: string;
  product_file_url?: string;
  product_access_url?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch order details - cookies will be sent automatically with credentials: 'include'
      // The API will handle authentication via cookies (same as other shop API calls)
      const response = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Order not found');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch order details');
        }
      }
      
      const data = await response.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              {order && (
                <p className="text-sm text-gray-500">#{order.order_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="ml-3 text-gray-600">Loading order details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="ml-3 text-red-600">{error}</span>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Order Status & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Status */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Order Status
                  </h3>
                  <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.payment_status)}`}>
                    {getStatusIcon(order.payment_status)}
                    <span className="ml-2 capitalize">{order.payment_status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {formatDate(order.order_date)}
                  </p>
                </div>

                {/* Payment Amount */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Amount
                  </h3>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.quantity} × {formatCurrency(order.unit_price)}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="flex items-center mt-1">
                      <span className="text-gray-900">{order.buyer_name}</span>
                      <button
                        onClick={() => copyToClipboard(order.buyer_name, 'name')}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied === 'name' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{order.buyer_email}</span>
                      <button
                        onClick={() => copyToClipboard(order.buyer_email, 'email')}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied === 'email' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Product Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product Name</label>
                    <p className="text-gray-900 font-medium">{order.product_title}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="text-gray-900 capitalize">{order.product_category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Product ID</label>
                      <div className="flex items-center">
                        <span className="text-gray-900 font-mono text-sm">{order.product_id}</span>
                        <button
                          onClick={() => copyToClipboard(order.product_id, 'productId')}
                          className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copied === 'productId' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {order.product_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-900 text-sm mt-1">{order.product_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-gray-900 capitalize">{order.payment_method || 'Mobile Money'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <div className="flex items-center">
                      <span className="text-gray-900 font-mono text-sm">{order.deposit_id}</span>
                      <button
                        onClick={() => copyToClipboard(order.deposit_id, 'transactionId')}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied === 'transactionId' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {order.payment_reference && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Reference</label>
                      <p className="text-gray-900 font-mono text-sm">{order.payment_reference}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Order Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Created</p>
                      <p className="text-xs text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                      <p className="text-xs text-gray-600">{formatDate(order.order_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-600">{formatDate(order.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {order.payment_status === 'paid' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {order.product_type === 'digital' && order.product_file_url && (
                    <a
                      href={order.product_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Product
                    </a>
                  )}
                  {order.product_type === 'link' && order.product_access_url && (
                    <a
                      href={order.product_access_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Access Content
                    </a>
                  )}
                  <button
                    onClick={() => copyToClipboard(order.order_number, 'orderNumber')}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copied === 'orderNumber' ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy Order Number
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
