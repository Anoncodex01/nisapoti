import { NextRequest, NextResponse } from 'next/server';
import { processExpiredWishlists } from '@/lib/wishlist-expiration';

export async function POST(request: NextRequest) {
  try {
    const result = await processExpiredWishlists();
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.expiredWishlists} expired wishlists`,
      data: result
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
    const result = await processExpiredWishlists();
    
    return NextResponse.json({
      success: true,
      data: result
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
