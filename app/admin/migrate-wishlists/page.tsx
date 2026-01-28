'use client';

import { useState } from 'react';

export default function MigrateWishlistsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-wishlists', {
        method: 'POST',
        headers: {
          'Authorization': 'admin-token', // Simple admin auth
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to run migration' });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-wishlists', {
        method: 'GET',
        headers: {
          'Authorization': 'admin-token'
        }
      });
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Wishlist Migration Dashboard
          </h1>
          
          <div className="space-y-6">
            {/* Status Check */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Migration Status
              </h2>
              <button
                onClick={checkStatus}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Check Status
              </button>
              
              {status && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {status.data?.total_wishlists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Wishlists</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {status.data?.migrated_wishlists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Migrated</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {status.data?.needs_migration || 0}
                    </div>
                    <div className="text-sm text-gray-600">Needs Migration</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {status.data?.expired_wishlists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Expired</div>
                  </div>
                </div>
              )}
            </div>

            {/* Migration Action */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">
                Run Migration
              </h2>
              <p className="text-orange-800 mb-4">
                This will add duration and expiration fields to existing wishlists.
                The migration is safe and will not affect existing data.
              </p>
              
              <button
                onClick={runMigration}
                disabled={loading}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
              >
                {loading ? 'Running Migration...' : 'Run Migration'}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className={`border rounded-lg p-6 ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-4 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Migration Completed' : 'Migration Failed'}
                </h2>
                
                {result.success ? (
                  <div className="space-y-2">
                    <p className="text-green-800">
                      ✅ {result.message}
                    </p>
                    {result.data && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-bold text-gray-900">
                            {result.data.totalWishlists}
                          </div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-bold text-green-600">
                            {result.data.migrated}
                          </div>
                          <div className="text-sm text-gray-600">Migrated</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-bold text-blue-600">
                            {result.data.skipped}
                          </div>
                          <div className="text-sm text-gray-600">Skipped</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-bold text-red-600">
                            {result.data.expired}
                          </div>
                          <div className="text-sm text-gray-600">Expired</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">
                    ❌ {result.error || 'Unknown error occurred'}
                  </p>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Migration Details
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>• <strong>Wishlists older than 30 days:</strong> Get 7 more days to complete</p>
                <p>• <strong>Wishlists 14-30 days old:</strong> Get 14 more days to complete</p>
                <p>• <strong>Wishlists less than 14 days old:</strong> Get 30 days total</p>
                <p>• <strong>Fully funded wishlists:</strong> Skipped (no changes needed)</p>
                <p>• <strong>Expired wishlists:</strong> Marked as expired, funds released to creators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
