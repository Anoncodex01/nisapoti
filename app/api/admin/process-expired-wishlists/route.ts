import { NextRequest, NextResponse } from 'next/server';
import { processExpiredWishlists } from '@/lib/wishlist-expiration';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (you can add proper admin authentication here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const result = await processExpiredWishlists();
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.expiredWishlists} expired wishlists`,
      data: {
        expiredWishlists: result.expiredWishlists,
        releasedAmount: result.releasedAmount,
        affectedCreators: result.affectedCreators,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing expired wishlists:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process expired wishlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const result = await processExpiredWishlists();
    
    return NextResponse.json({
      success: true,
      data: {
        expiredWishlists: result.expiredWishlists,
        releasedAmount: result.releasedAmount,
        affectedCreators: result.affectedCreators,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking expired wishlists:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check expired wishlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
