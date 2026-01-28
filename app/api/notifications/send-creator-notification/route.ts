import { NextRequest, NextResponse } from 'next/server';
import { creatorNotificationService } from '@/lib/creator-notifications';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { 
      creatorId, 
      purchaseType, 
      itemName, 
      amount, 
      currency = 'TZS',
      buyerEmail,
      buyerName,
      productId 
    } = await request.json();

    if (!creatorId || !purchaseType || !itemName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get creator information
    const creatorQuery = `
      SELECT display_name, email, username 
      FROM users 
      WHERE id = ?
    `;
    const creator = await db.queryOne(creatorQuery, [creatorId]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get product information if it's a shop purchase
    let product = null;
    if (purchaseType === 'shop' && productId) {
      const productQuery = `
        SELECT title, description, category 
        FROM products 
        WHERE id = ?
      `;
      product = await db.queryOne(productQuery, [productId]);
    }

    // Prepare notification data
    const notificationData = {
      creator: {
        display_name: creator.display_name,
        email: creator.email,
        username: creator.username
      },
      purchase: {
        type: purchaseType as 'wishlist' | 'supporter' | 'shop',
        item_name: itemName,
        amount: parseFloat(amount),
        currency: currency,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        buyer_email: buyerEmail,
        buyer_name: buyerName
      },
      product: product ? {
        title: product.title,
        description: product.description,
        category: product.category
      } : undefined
    };

    // Send notification
    const success = await creatorNotificationService.sendPurchaseNotification(notificationData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Creator notification sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send creator notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending creator notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
