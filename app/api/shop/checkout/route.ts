import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { snippe, SnippeService } from '@/lib/snippe';

export const dynamic = 'force-dynamic';

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      quantity = 1,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_user_id = null,
      buyer_answer = null,
    } = body;

    // Validate required fields
    if (!product_id || !buyer_name || !buyer_email || !buyer_phone) {
      return NextResponse.json(
        { error: 'Product ID, buyer name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await db.queryOne(
      'SELECT * FROM products WHERE id = ? AND status = "active"',
      [product_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Check slot availability if limited
    if (product.limit_slots && product.max_slots) {
      if (product.sold_slots + quantity > product.max_slots) {
        return NextResponse.json(
          { error: 'Not enough slots available' },
          { status: 400 }
        );
      }
    }

    // Check if quantity is allowed
    if (!product.allow_quantity && quantity > 1) {
      return NextResponse.json(
        { error: 'Multiple quantities not allowed for this product' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const unit_price = parseFloat(product.price);
    const total_amount = unit_price * quantity;

    // Validate minimum amount (500 TZS as per Snippe)
    if (total_amount < 500) {
      return NextResponse.json(
        { error: 'Minimum purchase amount is TZS 500' },
        { status: 400 }
      );
    }

    // Format phone number for Tanzania (keep with country code for internal use)
    let formattedPhone = buyer_phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10 && formattedPhone.startsWith('0')) {
      formattedPhone = '255' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9) {
      formattedPhone = '255' + formattedPhone;
    } else if (!formattedPhone.startsWith('255')) {
      formattedPhone = '255' + formattedPhone;
    }

    // Generate deposit ID (internal reference)
    const depositId = uuidv4();
    const orderNumber = generateOrderNumber();

    // Split buyer name into firstname and lastname
    const { firstname, lastname } = SnippeService.splitName(buyer_name);

    // Create payment with Snippe
    const paymentResult = await snippe.createPayment({
      payment_type: 'mobile',
      details: {
        amount: Math.round(total_amount), // Amount in TZS (smallest unit)
        currency: 'TZS',
      },
      phone_number: formattedPhone,
      customer: {
        firstname,
        lastname,
        email: buyer_email,
      },
      metadata: {
        deposit_id: depositId,
        order_number: orderNumber,
        product_id: product_id,
        creator_id: product.creator_id,
        quantity: quantity,
        buyer_name: buyer_name,
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
        deposit_id, creator_id, supporter_name, phone_number, amount, type, product_id, status, 
        payment_reference, payment_provider, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'shop', ?, 'pending', ?, 'snippe', NOW(), NOW())
    `;

    await db.execute(pendingPaymentQuery, [
      depositId,
      product.creator_id,
      buyer_name,
      formattedPhone,
      total_amount,
      product_id,
      paymentResult.data.reference, // Snippe payment reference
    ]);

    // Create order in database
    const orderQuery = `
      INSERT INTO orders (
        order_number, creator_id, buyer_user_id, buyer_email, buyer_name,
        product_id, product_title, quantity, unit_price, total_amount,
        payment_status, payment_method, payment_reference, buyer_answer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'mobile_money', ?, ?)
    `;

    const orderResult = await db.execute(orderQuery, [
      orderNumber,
      product.creator_id,
      buyer_user_id,
      buyer_email,
      buyer_name,
      product_id,
      product.title,
      quantity,
      unit_price,
      total_amount,
      paymentResult.data.reference,
      buyer_answer,
    ]);

    // Update sold slots if applicable (reserve them, will be confirmed on payment completion)
    if (product.limit_slots) {
      await db.execute(
        'UPDATE products SET sold_slots = sold_slots + ? WHERE id = ?',
        [quantity, product_id]
      );
    }

    console.log('✅ Shop checkout initiated successfully:', {
      depositId,
      orderNumber,
      snippeReference: paymentResult.data.reference,
      status: paymentResult.data.status,
    });

    return NextResponse.json({
      success: true,
      deposit_id: depositId,
      order_number: orderNumber,
      order_id: orderResult.insertId,
      payment_reference: paymentResult.data.reference,
      external_reference: paymentResult.data.external_reference,
      status: paymentResult.data.status,
      message: 'Payment initiated successfully. Please check your phone for the USSD prompt.',
    });

  } catch (error) {
    console.error('❌ Shop checkout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process checkout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
