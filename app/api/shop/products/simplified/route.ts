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

// GET - Fetch products for a creator (simplified)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id') || user.id;
    const creatorUsername = searchParams.get('creator_username');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        p.*,
        COUNT(o.id) as total_sales,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM products p
      LEFT JOIN orders o ON p.id = o.product_id AND o.payment_status = 'paid'
    `;
    
    let whereClause = '';
    const params: any[] = [];

    if (creatorUsername) {
      // If filtering by username, join with users table
      query += `
        LEFT JOIN users u ON p.creator_id = u.user_id
        WHERE u.username = ?
      `;
      params.push(creatorUsername);
    } else {
      // Otherwise use creator_id
      query += `WHERE p.creator_id = ?`;
      params.push(creatorId);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const products = await db.query(query, params);

    // Get total count
    let countQuery = '';
    const countParams: any[] = [];
    
    if (creatorUsername) {
      countQuery = `
        SELECT COUNT(*) as total 
        FROM products p
        LEFT JOIN users u ON p.creator_id = u.user_id
        WHERE u.username = ?
      `;
      countParams.push(creatorUsername);
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM products WHERE creator_id = ?';
      countParams.push(creatorId);
    }
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }

    const [{ total }] = await db.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new digital product (simplified)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price, // Always in TZS
      category,
      feature_image_url,
      success_page_type = 'confirmation',
      confirmation_message,
      redirect_url,
      file_url, // For downloadable files
      content_url, // For links (podcasts, tutorials)
      limit_slots = false,
      max_slots,
      allow_quantity = false,
      status = 'active'
    } = body;

    // Validate required fields
    if (!title || !description || !price) {
      return NextResponse.json(
        { error: 'Title, description, and price are required' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate success page requirements
    if (success_page_type === 'confirmation' && !confirmation_message && !file_url && !content_url) {
      return NextResponse.json(
        { error: 'Confirmation message or file/content URL is required for confirmation page' },
        { status: 400 }
      );
    }

    if (success_page_type === 'redirect' && !redirect_url) {
      return NextResponse.json(
        { error: 'Redirect URL is required for redirect page' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `INSERT INTO products (
        creator_id, title, description, price, category,
        feature_image_url, success_page_type, confirmation_message,
        redirect_url, file_url, content_url, limit_slots,
        max_slots, allow_quantity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        title,
        description,
        parseFloat(price),
        category,
        feature_image_url,
        success_page_type,
        confirmation_message,
        redirect_url,
        file_url,
        content_url,
        limit_slots,
        limit_slots ? max_slots : null,
        allow_quantity,
        status
      ]
    );

    // Fetch the created product (db.query for INSERT returns ResultSetHeader with insertId)
    const insertId = (result as unknown as { insertId?: number }).insertId;
    const [product] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [insertId]
    );

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT - Update product (simplified)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const [product] = await db.query(
      'SELECT creator_id FROM products WHERE id = ?',
      [id]
    );

    if (!product || product.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'title', 'description', 'price', 'category', 'feature_image_url',
      'success_page_type', 'confirmation_message', 'redirect_url',
      'file_url', 'content_url', 'limit_slots', 'max_slots',
      'allow_quantity', 'status'
    ];

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    await db.query(
      `UPDATE products SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Fetch updated product
    const [updatedProduct] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (simplified)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const [product] = await db.query(
      'SELECT creator_id FROM products WHERE id = ?',
      [productId]
    );

    if (!product || product.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if product has any orders
    const [orderCount] = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE product_id = ?',
      [productId]
    );

    if (orderCount.count > 0) {
      // Don't delete, just deactivate
      await db.query(
        'UPDATE products SET status = "inactive" WHERE id = ?',
        [productId]
      );

      return NextResponse.json({
        success: true,
        message: 'Product deactivated (has existing orders)'
      });
    } else {
      // Safe to delete
      await db.query('DELETE FROM products WHERE id = ?', [productId]);

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
