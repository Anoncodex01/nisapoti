import { NextRequest, NextResponse } from 'next/server';
import { creatorNotificationService } from '@/lib/creator-notifications';

export async function POST(request: NextRequest) {
  try {
    const { 
      creatorEmail = 'test@example.com',
      creatorName = 'Test Creator',
      creatorUsername = 'testcreator',
      purchaseType = 'shop',
      itemName = 'Test Product',
      amount = 1000,
      currency = 'TZS',
      buyerEmail = 'buyer@example.com',
      buyerName = 'Test Buyer'
    } = await request.json();

    const notificationData = {
      creator: {
        display_name: creatorName,
        email: creatorEmail,
        username: creatorUsername
      },
      purchase: {
        type: purchaseType as 'wishlist' | 'supporter' | 'shop',
        item_name: itemName,
        amount: parseFloat(amount.toString()),
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
      product: purchaseType === 'shop' ? {
        title: itemName,
        description: 'This is a test product description',
        category: 'Digital Product'
      } : undefined
    };

    const success = await creatorNotificationService.sendPurchaseNotification(notificationData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test creator notification sent successfully',
        data: notificationData
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test creator notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending test creator notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
