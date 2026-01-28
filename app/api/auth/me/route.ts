import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

// Add CORS headers for mobile apps
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Type assertion to help TypeScript understand JWT_SECRET is defined
const jwtSecret = JWT_SECRET as string;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('🔍 Auth/me called, all cookies:', allCookies.map(c => c.name));
    console.log('🔍 Auth/me called, token found:', !!token);

    if (!token) {
      console.log('❌ No auth token found in cookies');
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      console.log('✅ Token verified successfully for user:', decoded.userId);

      // Fetch user and profile data from DB
      const userRow = await db.getUserById(decoded.userId);
      const profileRow = await db.getProfileByUserId(decoded.userId);
      
      const email = userRow.success && userRow.data ? userRow.data.email : undefined;
      
      // Use profile data if available, otherwise fall back to JWT data
      const profileData = profileRow.success && profileRow.data ? profileRow.data : null;
      
      // Convert image paths to public paths for Next.js
      const convertImagePath = (imageUrl: string | null | undefined) => {
        if (!imageUrl) return imageUrl;
        if (imageUrl.startsWith('/creator/assets/')) {
          return imageUrl.replace('/creator/assets/', '/uploads/');
        }
        return imageUrl;
      };
      
      // Return user information with profile data taking priority
      const response = NextResponse.json({
        id: decoded.userId,
        email,
        username: profileData?.username || decoded.username,
        display_name: profileData?.display_name || decoded.display_name,
        avatar_url: convertImagePath(profileData?.avatar_url || decoded.avatar_url)
      });
      return addCorsHeaders(response);
    } catch (jwtError) {
      console.log('❌ Token verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      return addCorsHeaders(response);
    }
  } catch (error) {
    console.error('Auth check error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
