import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { orderId, depositId } = await request.json();

    if (!orderId && !depositId) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Deposit ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    let order;
    if (orderId) {
      const orders = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      order = orders[0];
    } else if (depositId) {
      // Find order by payment_reference from pending_payments
      const pendingPayment = await db.queryOne(
        'SELECT payment_reference FROM pending_payments WHERE deposit_id = ?',
        [depositId]
      );
      
      if (pendingPayment && pendingPayment.payment_reference) {
        const orders = await db.query(
          'SELECT * FROM orders WHERE payment_reference = ?',
          [pendingPayment.payment_reference]
        );
        order = orders[0];
      }
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get creator details
    const creators = await db.query(
      'SELECT display_name, username FROM profiles WHERE user_id = ?',
      [order.creator_id]
    );
    const creator = creators[0];

    // Get product details
    const products = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [order.product_id]
    );
    const product = products[0];

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.nisapoti.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Generate download links and attachments
    const downloadLinks: Array<{ type: string; title: string; url: string; description: string }> = [];
    const attachments: Array<{ filename: string; content: Buffer | string }> = [];

    // Handle downloadable files
    if (product.file_url && product.file_url !== '' && product.file_url !== 'null') {
      const fileUrl = product.file_url.startsWith('http') 
        ? product.file_url 
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${product.file_url}`;
      
      downloadLinks.push({
        type: 'file',
        title: product.title,
        url: fileUrl,
        description: 'Download your purchased file'
      });
    }

    // Handle online content (courses, tutorials, podcasts)
    if (product.content_url && product.content_url !== '' && product.content_url !== 'null') {
      const contentUrl = product.content_url.startsWith('http') 
        ? product.content_url 
        : `https://${product.content_url}`;
      
      downloadLinks.push({
        type: 'content',
        title: product.title,
        url: contentUrl,
        description: 'Access your online content'
      });
    }

    // Handle redirect URLs
    if (product.redirect_url && product.redirect_url !== '' && product.redirect_url !== 'null') {
      const redirectUrl = product.redirect_url.startsWith('http') 
        ? product.redirect_url 
        : `https://${product.redirect_url}`;
      
      downloadLinks.push({
        type: 'redirect',
        title: product.title,
        url: redirectUrl,
        description: 'Access your content'
      });
    }

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank You for Your Purchase!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .product-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .download-btn { display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .order-details { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thank You for Your Purchase!</h1>
            <p>Your order has been confirmed and processed successfully.</p>
          </div>
          
          <div class="content">
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Product:</strong> ${order.product_title}</p>
              <p><strong>Amount:</strong> TZS ${parseFloat(order.total_amount).toLocaleString()}</p>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div class="product-card">
              <h3>📚 Your Content</h3>
              <p><strong>${product.title}</strong></p>
              <p>${product.description || 'Thank you for your purchase!'}</p>
              
              ${product.confirmation_message ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107;">
                  <strong>Message from ${creator.display_name}:</strong><br>
                  ${product.confirmation_message}
                </div>
              ` : ''}

              ${downloadLinks.length > 0 ? `
                <h4>🔗 Access Your Content</h4>
                ${downloadLinks.map(link => `
                  <a href="${link.url}" class="download-btn" target="_blank">
                    ${link.type === 'file' ? '📥 Download' : '🔗 Access'} ${link.title}
                  </a>
                `).join('')}
              ` : ''}
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h4>💡 Important Notes</h4>
              <ul>
                <li>You can access your content anytime using the links above</li>
                <li>Keep this email for your records</li>
                <li>If you have any questions, contact ${creator.display_name}</li>
              </ul>
            </div>

            <div class="footer">
              <p>Thank you for supporting ${creator.display_name}!</p>
              <p>Visit their page: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${creator.username}">${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${creator.username}</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"${creator.display_name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: order.buyer_email,
      subject: `Thank You for Your Purchase - ${product.title}`,
      html: emailHtml,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);

    console.log('📧 Purchase confirmation email sent:', {
      to: order.buyer_email,
      orderNumber: order.order_number,
      productTitle: product.title
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Send purchase confirmation email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
