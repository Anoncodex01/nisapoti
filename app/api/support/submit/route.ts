import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { snippe, SnippeService } from '@/lib/snippe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      creator_id, 
      wishlist_id,
      amount, 
      supporter_name, 
      supporter_phone,
      supporter_email,
      type = 'support'
    } = body;

    // Validate required fields
    if (!creator_id || !amount || !supporter_name || !supporter_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount (minimum 500 TZS as per Snippe)
    if (parseFloat(amount) < 500) {
      return NextResponse.json(
        { error: 'Minimum support amount is TZS 500' },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creatorQuery = `
      SELECT user_id, display_name, username 
      FROM profiles 
      WHERE user_id = ? AND status = 'active'
    `;
    const creator = await db.queryOne(creatorQuery, [creator_id]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Format phone number for Tanzania (keep with country code for internal use)
    let formattedPhone = supporter_phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10 && formattedPhone.startsWith('0')) {
      formattedPhone = '255' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9) {
      formattedPhone = '255' + formattedPhone;
    } else if (!formattedPhone.startsWith('255')) {
      formattedPhone = '255' + formattedPhone;
    }

    // Generate deposit ID (internal reference)
    const depositId = uuidv4();

    // Split supporter name into firstname and lastname
    const { firstname, lastname } = SnippeService.splitName(supporter_name);

    // Generate email if not provided
    const email = supporter_email || `supporter_${depositId.substring(0, 8)}@nisapoti.com`;

    // Create payment with Snippe
    const paymentResult = await snippe.createPayment({
      payment_type: 'mobile',
      details: {
        amount: Math.round(parseFloat(amount)), // Amount in TZS (smallest unit)
        currency: 'TZS',
      },
      phone_number: formattedPhone,
      customer: {
        firstname,
        lastname,
        email,
      },
      metadata: {
        deposit_id: depositId,
        creator_id: creator_id,
        type: type,
        wishlist_id: wishlist_id || null,
        supporter_name: supporter_name,
      },
    });

    if (paymentResult.status !== 'success' || !paymentResult.data) {
      console.error('❌ Snippe payment creation failed:', paymentResult);
      return NextResponse.json(
        { 
          error: paymentResult.message || 'Failed to initiate payment. Please try again.',
          details: paymentResult
        },
        { status: 400 }
      );
    }

    // Store pending payment in database
    const pendingPaymentQuery = `
      INSERT INTO pending_payments (
        deposit_id, creator_id, supporter_name, phone_number, amount, type, wishlist_id, status, 
        payment_reference, payment_provider, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'snippe', NOW(), NOW())
    `;

    // Extract payment reference (response structure may vary)
    const responseData = paymentResult.data as any;
    const paymentReference = responseData.reference || 
                            responseData.id || 
                            responseData.payment_id ||
                            responseData.paymentReference ||
                            depositId; // Fallback to our deposit ID

    await db.execute(pendingPaymentQuery, [
      depositId,
      creator_id,
      supporter_name,
      formattedPhone,
      parseFloat(amount),
      type,
      wishlist_id || null,
      paymentReference, // Snippe payment reference
    ]);

    console.log('✅ Payment initiated successfully:', {
      depositId,
      snippeReference: paymentReference,
      responseData: responseData,
    });

    return NextResponse.json({
      success: true,
      deposit_id: depositId,
      payment_reference: paymentReference,
      external_reference: responseData.external_reference || responseData.externalReference,
      status: responseData.status || 'pending',
      message: 'Payment initiated successfully. Please check your phone for the USSD prompt.',
    });

  } catch (error) {
    console.error('❌ Support submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit support',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
