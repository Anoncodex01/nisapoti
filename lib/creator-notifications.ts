import nodemailer from 'nodemailer';

interface CreatorNotificationData {
  creator: {
    display_name: string;
    email: string;
    username: string;
  };
  purchase: {
    type: 'wishlist' | 'supporter' | 'shop';
    item_name: string;
    amount: number;
    currency: string;
    date: string;
    buyer_email?: string;
    buyer_name?: string;
  };
  product?: {
    title: string;
    description?: string;
    category?: string;
  };
}

export class CreatorNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPurchaseNotification(data: CreatorNotificationData): Promise<boolean> {
    try {
      const emailHtml = this.generateEmailHtml(data);
      const subject = this.generateSubject(data);

      const mailOptions = {
        from: `"Nisapoti" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: data.creator.email,
        subject: subject,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Creator notification sent to ${data.creator.email} for ${data.purchase.type} purchase`);
      return true;
    } catch (error) {
      console.error('Error sending creator notification:', error);
      return false;
    }
  }

  private generateSubject(data: CreatorNotificationData): string {
    const { purchase, product } = data;
    
    switch (purchase.type) {
      case 'wishlist':
        return `🎁 Wishlist Alert: Someone supported your wishlist item!`;
      case 'supporter':
        return `💝 Support Alert: You received a supporter payment!`;
      case 'shop':
        return `🛒 Sale Alert: Your "${product?.title || purchase.item_name}" has been purchased!`;
      default:
        return `💰 Purchase Alert: You received a payment!`;
    }
  }

  private generateEmailHtml(data: CreatorNotificationData): string {
    const { creator, purchase, product } = data;
    
    const formatAmount = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency === 'TZS' ? 'TZS' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const getCategoryIcon = (type: string) => {
      switch (type) {
        case 'wishlist': return '🎁';
        case 'supporter': return '💝';
        case 'shop': return '🛒';
        default: return '💰';
      }
    };

    const getCategoryTitle = (type: string) => {
      switch (type) {
        case 'wishlist': return 'Wishlist Support';
        case 'supporter': return 'Supporter Payment';
        case 'shop': return 'Product Sale';
        default: return 'Purchase';
      }
    };

    const getCategoryMessage = (type: string) => {
      switch (type) {
        case 'wishlist':
          return 'Someone supported your wishlist item! This shows that your community values what you\'re working towards.';
        case 'supporter':
          return 'You received a supporter payment! This direct support helps you continue creating amazing content.';
        case 'shop':
          return 'Your product was purchased! Your hard work is paying off and making an impact on your community.';
        default:
          return 'You received a payment! Thank you for being a valuable part of the Nisapoti community.';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Alert - Nisapoti</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: white;
          }
          .header { 
            background: linear-gradient(135deg, #FF6B35, #F7931E); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 12px 12px 0 0; 
            margin-bottom: 0;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
          }
          .header p { 
            margin: 10px 0 0 0; 
            font-size: 16px; 
            opacity: 0.9;
          }
          .content { 
            background: #f9f9f9; 
            padding: 40px 30px; 
            border-radius: 0 0 12px 12px;
          }
          .alert-card { 
            background: white; 
            padding: 30px; 
            margin: 20px 0; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid #FF6B35;
          }
          .purchase-details { 
            background: #e8f4f8; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
          }
          .amount { 
            font-size: 32px; 
            font-weight: 700; 
            color: #FF6B35; 
            margin: 10px 0;
          }
          .category-badge { 
            display: inline-block; 
            background: #FF6B35; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600; 
            margin: 10px 0;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 14px;
          }
          .cta-button { 
            display: inline-block; 
            background: #FF6B35; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0;
            transition: background-color 0.3s;
          }
          .cta-button:hover { 
            background: #e55a2b; 
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0;
          }
          .stat-item { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            border: 1px solid #e9ecef;
          }
          .stat-value { 
            font-size: 24px; 
            font-weight: 700; 
            color: #FF6B35; 
            margin-bottom: 5px;
          }
          .stat-label { 
            font-size: 14px; 
            color: #666; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${getCategoryIcon(purchase.type)} ${getCategoryTitle(purchase.type)}</h1>
            <p>Congratulations! Your hard work has paid off.</p>
          </div>
          
          <div class="content">
            <div class="alert-card">
              <h2>Hi ${creator.display_name},</h2>
              <p>${getCategoryMessage(purchase.type)}</p>
              
              <div class="purchase-details">
                <div class="category-badge">${getCategoryIcon(purchase.type)} ${getCategoryTitle(purchase.type)}</div>
                <h3>${purchase.item_name}</h3>
                <div class="amount">${formatAmount(purchase.amount, purchase.currency)}</div>
                <p><strong>Date:</strong> ${purchase.date}</p>
                ${purchase.buyer_email ? `<p><strong>Buyer:</strong> ${purchase.buyer_name || purchase.buyer_email}</p>` : ''}
                ${product?.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">${formatAmount(purchase.amount, purchase.currency)}</div>
                  <div class="stat-label">This Sale</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${purchase.type === 'shop' ? 'Product' : 'Support'}</div>
                  <div class="stat-label">Type</div>
                </div>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/creator/dashboard" class="cta-button">
                  View Your Dashboard
                </a>
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #333;">💡 What's Next?</h4>
              <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Check your dashboard for updated earnings and analytics</li>
                <li>Keep creating and uploading amazing content</li>
                <li>Engage with your supporters and community</li>
                <li>Consider creating more products to increase your income</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>Thank you for being a valuable part of the Nisapoti community!</strong></p>
              <p>Keep creating and uploading amazing designs—your work is making an impact!</p>
              <p style="margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${creator.username}" 
                   style="color: #FF6B35; text-decoration: none;">
                  Visit Your Profile
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const creatorNotificationService = new CreatorNotificationService();
