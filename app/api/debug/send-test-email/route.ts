import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
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

    // Test email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email - Nisapoti</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Test Email Working!</h1>
            <p>Email configuration is set up correctly.</p>
          </div>
          <div class="content">
            <p>This is a test email to verify that the email service is working properly.</p>
            <p>If you received this email, the purchase confirmation emails will work correctly!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"Nisapoti Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: 'Test Email - Nisapoti Purchase System',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    console.log('📧 Test email sent to:', to);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
