'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-auto px-4">
      <nav className="bg-white/90 backdrop-blur-lg rounded-full shadow-lg border border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/assets/images/logos/logo.png" 
              alt="Nisapoti Logo" 
              className="w-22 h-6 object-contain"
              style={{ display: 'block' }}
              onError={(e) => {
                console.log('Logo failed to load, trying fallback');
                e.currentTarget.src = '/logo.png';
              }}
            />
          </Link>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link href="/creator/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] hover:from-[#FF5A0A] hover:to-[#FF8A2C] text-white rounded-full px-4"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                    Log in
                  </Button>
                </Link>
                <Link href="/choose-username">
                  <Button size="sm" className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] hover:from-[#FF5A0A] hover:to-[#FF8A2C] text-white rounded-full px-4">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}