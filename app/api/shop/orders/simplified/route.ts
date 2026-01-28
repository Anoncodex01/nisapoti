import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get user from JWT token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // The JWT contains userId, but we need to return it as id for compatibility
    return {
      id: decoded.userId,
      username: decoded.username,
      display_name: decoded.display_name,
      avatar_url: decoded.avatar_url
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-6)}${random}`;
}

// GET - Fetch orders for a creator (simplified)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id') || user.id;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        o.*,
        p.title as product_title,
        p.category as product_category
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.creator_id = ?
    `;
    
    const params: any[] = [creatorId];

    if (status) {
      query += ' AND o.payment_status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.buyer_name LIKE ? OR o.buyer_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += `
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const orders = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE creator_id = ?';
    const countParams: any[] = [creatorId];
    
    if (status) {
      countQuery += ' AND payment_status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (buyer_name LIKE ? OR buyer_email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [{ total }] = await db.query(countQuery, countParams);

    // Get summary stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total_amount ELSE 0 END), 0) as last_30_days_revenue,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_orders
      FROM orders 
      WHERE creator_id = ?
    `, [creatorId]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order (simplified)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      buyer_email,
      buyer_name,
      buyer_user_id = null, // Optional for logged-in users
      quantity = 1,
      buyer_answer = null, // Optional answer to creator's question
      payment_method = 'mobile_money',
      payment_reference = null
    } = body;

    // Validate required fields
    if (!product_id || !buyer_email || !buyer_name) {
      return NextResponse.json(
        { error: 'Product ID, buyer email, and buyer name are required' },
        { status: 400 }
      );
    }

    // Get product details
    const [product] = await db.query(
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

    // Generate order number
    const order_number = generateOrderNumber();

    // Create order
    const result = await db.query(
      `INSERT INTO orders (
        order_number, creator_id, buyer_user_id, buyer_email, buyer_name,
        product_id, product_title, quantity, unit_price, total_amount,
        payment_status, payment_method, payment_reference, buyer_answer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        product.creator_id,
        buyer_user_id,
        buyer_email,
        buyer_name,
        product_id,
        product.title,
        quantity,
        unit_price,
        total_amount,
        'pending', // Default status
        payment_method,
        payment_reference,
        buyer_answer
      ]
    );

    // Update sold slots if applicable
    if (product.limit_slots) {
      await db.query(
        'UPDATE products SET sold_slots = sold_slots + ? WHERE id = ?',
        [quantity, product_id]
      );
    }

    // Fetch the created order (db.query for INSERT returns ResultSetHeader with insertId)
    const insertId = (result as unknown as { insertId?: number }).insertId;
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [insertId]
    );

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT - Update order status (simplified)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, payment_status, payment_reference } = body;

    if (!id || !payment_status) {
      return NextResponse.json(
        { error: 'Order ID and payment status are required' },
        { status: 400 }
      );
    }

    // Verify order ownership
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order || order.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update order
    await db.query(
      `UPDATE orders SET 
        payment_status = ?, 
        payment_reference = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [payment_status, payment_reference, id]
    );

    // If order is being refunded, update sold slots
    if (payment_status === 'refunded' && order.payment_status === 'paid') {
      await db.query(
        'UPDATE products SET sold_slots = GREATEST(0, sold_slots - ?) WHERE id = ?',
        [order.quantity, order.product_id]
      );
    }

    // Fetch updated order
    const [updatedOrder] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
