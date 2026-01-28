import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUserFromToken(request: NextRequest) {
  try {
    // Try Authorization header first (for client-side requests)
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // If no header token, try cookie (for server-side requests)
    if (!token) {
      // Try using request.cookies directly first
      token = request.cookies.get('auth-token')?.value;
      
      // If still no token, try cookies() function
      if (!token) {
        try {
          const cookieStore = cookies();
          token = cookieStore.get('auth-token')?.value;
        } catch (cookieError) {
          // Ignore cookie access errors
        }
      }
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;

    // Convert orderId to integer since the database expects int
    const orderIdInt = parseInt(orderId);
    if (isNaN(orderIdInt)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Fetch order details with product information
    const orderQuery = `
      SELECT 
        o.*,
        p.title as product_title,
        p.category as product_category,
        p.description as product_description,
        p.feature_image_url as product_image_url,
        p.category as product_type,
        p.file_url as product_file_url,
        p.content_url as product_access_url
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ? AND o.creator_id = ?
    `;

    // Handle both 'id' and 'userId' fields from JWT token
    const creatorId = user.id || user.userId;
    const order = await db.queryOne(orderQuery, [orderIdInt, creatorId]);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch order details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
