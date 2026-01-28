import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter with SMTP settings
    const config: EmailConfig = {
      host: process.env.MAIL_HOST || 'mail.nisapoti.com',
      port: parseInt(process.env.MAIL_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME || 'no-reply@nisapoti.com',
        pass: process.env.MAIL_PASSWORD || 'Alvin@2025',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  // Generate reward unlocked email HTML
  private generateRewardUnlockedEmailHTML(referrerName: string, tierTitle: string, invites: number): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reward Unlocked</title>
        <style>
          /* Reset styles for better email client compatibility */
          body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
          
          /* Main styles */
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
            width: 100% !important; 
            min-width: 100%;
          }
          
          .email-wrapper { 
            width: 100%; 
            background-color: #f8f9fa; 
            padding: 20px 0; 
          }
          
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
            overflow: hidden;
          }
          
          .container { 
            padding: 40px 30px; 
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          
          .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #FF6A1A; 
            margin-bottom: 15px; 
            display: block;
          }
          
          .badge { 
            text-align: center; 
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C); 
            color: #ffffff; 
            padding: 20px 25px; 
            border-radius: 12px; 
            font-weight: 700; 
            margin: 25px 0; 
            font-size: 18px;
            display: block;
          }
          
          .cta { 
            display: inline-block; 
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C); 
            color: #ffffff !important; 
            padding: 15px 30px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 700; 
            margin: 20px 0; 
            font-size: 16px;
            border: none;
          }
          
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #666666; 
            font-size: 14px; 
          }
          
          /* Responsive styles */
          @media only screen and (max-width: 600px) {
            .email-container { margin: 0 10px; }
            .container { padding: 30px 20px; }
            .logo { font-size: 28px; }
            .badge { padding: 15px 20px; font-size: 16px; }
            .cta { padding: 12px 25px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="container">
              <div class="header">
                <div class="logo">Nisapoti</div>
                <h1 style="color: #333333; font-size: 24px; margin: 0;">🎉 Congratulations, ${referrerName}!</h1>
              </div>
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6;">You just unlocked a new referral reward:</p>
              <div class="badge">${tierTitle}</div>
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6;">You reached this milestone with ${invites} invite${invites === 1 ? '' : 's'}. Keep sharing your link to unlock the next tier!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/creator/referrals" class="cta">View Your Rewards</a>
              </div>
              <div class="footer">
                <p style="margin: 5px 0;">© 2024 Nisapoti. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send reward unlocked notification email
  async sendRewardUnlockedEmail(referrerEmail: string, referrerName: string, tierTitle: string, invites: number): Promise<boolean> {
    try {
      const html = this.generateRewardUnlockedEmailHTML(referrerName, tierTitle, invites);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: referrerEmail,
        subject: `🎉 You unlocked a new reward: ${tierTitle}!`,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Reward unlocked email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send reward unlocked email:', error);
      return false;
    }
  }

  // Verify email configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }

  // Send email verification code
  async sendVerificationCode(email: string, code: string, type: 'email' | 'reset' = 'email'): Promise<boolean> {
    try {
      const subject = type === 'reset' ? 'Password Reset Code - Nisapoti' : 'Verify Your Email - Nisapoti';
      const html = this.generateVerificationEmailHTML(code, type);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: email,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const html = this.generateWelcomeEmailHTML(username);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: email,
        subject: 'Welcome to Nisapoti! 🎉',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  // Send referral click notification email
  async sendReferralClickEmail(referrerEmail: string, referrerName: string): Promise<boolean> {
    try {
      const html = this.generateReferralClickEmailHTML(referrerName);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: referrerEmail,
        subject: 'Someone clicked your referral link! 🎯',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Referral click email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send referral click email:', error);
      return false;
    }
  }

  // Send referral conversion notification email
  async sendReferralConversionEmail(referrerEmail: string, referrerName: string, referredUserName: string): Promise<boolean> {
    try {
      const html = this.generateReferralConversionEmailHTML(referrerName, referredUserName);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: referrerEmail,
        subject: '🎉 New referral conversion! Someone joined through your link!',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Referral conversion email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send referral conversion email:', error);
      return false;
    }
  }

  // Send welcome email to referred user
  async sendReferredUserWelcomeEmail(email: string, username: string, referrerName: string): Promise<boolean> {
    try {
      const html = this.generateReferredUserWelcomeEmailHTML(username, referrerName);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: email,
        subject: `Welcome to Nisapoti! You were invited by ${referrerName} 🎉`,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Referred user welcome email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send referred user welcome email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, newPassword: string): Promise<boolean> {
    try {
      const html = this.generatePasswordResetEmailHTML(newPassword);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Nisapoti',
          address: process.env.MAIL_FROM_ADDRESS || 'no-reply@nisapoti.com',
        },
        to: email,
        subject: 'Your New Password - Nisapoti',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  // Generate verification email HTML
  private generateVerificationEmailHTML(code: string, type: 'email' | 'reset'): string {
    const isReset = type === 'reset';
    const title = isReset ? 'Password Reset Code' : 'Email Verification';
    const description = isReset 
      ? 'Use this code to reset your password'
      : 'Use this code to verify your email address';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Nisapoti</title>
        <style>
          /* Reset styles for better email client compatibility */
          body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            width: 100% !important;
            min-width: 100%;
          }
          .email-wrapper {
            width: 100%;
            background-color: #f8f9fa;
            padding: 20px 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .container {
            padding: 40px 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 15px;
            display: block;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333333;
            margin: 0 0 15px 0;
          }
          .description {
            color: #666666;
            font-size: 16px;
            margin: 0 0 30px 0;
            line-height: 1.6;
          }
          .code-container {
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'Courier New', Consolas, monospace;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #666666;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          @media only screen and (max-width: 600px) {
            .email-container { margin: 0 10px; }
            .container { padding: 30px 20px; }
            .logo { font-size: 28px; }
            .code { font-size: 28px; letter-spacing: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="container">
              <div class="header">
                <div class="logo">Nisapoti</div>
                <h1 class="title">${title}</h1>
                <p class="description">${description}</p>
              </div>
              
              <div class="code-container">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>Important:</strong> This code will expire in 10 minutes. Do not share this code with anyone.
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">If you didn't request this ${isReset ? 'password reset' : 'verification'}, please ignore this email.</p>
                <p style="margin: 5px 0;">© 2024 Nisapoti. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate password reset email HTML
  private generatePasswordResetEmailHTML(newPassword: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your New Password - Nisapoti</title>
        <style>
          /* Reset styles for better email client compatibility */
          body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            width: 100% !important;
            min-width: 100%;
          }
          .email-wrapper {
            width: 100%;
            background-color: #f8f9fa;
            padding: 20px 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .container {
            padding: 40px 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 15px;
            display: block;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333333;
            margin: 0 0 15px 0;
          }
          .description {
            color: #666666;
            font-size: 16px;
            margin: 0 0 30px 0;
            line-height: 1.6;
          }
          .password-container {
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .password {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 2px;
            font-family: 'Courier New', Consolas, monospace;
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 8px;
            display: inline-block;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #666666;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            font-size: 16px;
          }
          @media only screen and (max-width: 600px) {
            .email-container { margin: 0 10px; }
            .container { padding: 30px 20px; }
            .logo { font-size: 28px; }
            .password { font-size: 20px; letter-spacing: 1px; }
            .cta-button { padding: 12px 25px; font-size: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="container">
              <div class="header">
                <div class="logo">Nisapoti</div>
                <h1 class="title">Your New Password</h1>
                <p class="description">Your password has been reset successfully!</p>
              </div>
              
              <div class="password-container">
                <p style="color: #ffffff; margin-bottom: 15px; font-size: 16px;">Your new password is:</p>
                <div class="password">${newPassword}</div>
              </div>
              
              <div class="warning">
                <strong>Important:</strong> Please login with this password and change it immediately for security reasons.
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="cta-button">
                  Login Now
                </a>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">If you didn't request this password reset, please contact our support team immediately.</p>
                <p style="margin: 5px 0;">© 2024 Nisapoti. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate welcome email HTML
  private generateWelcomeEmailHTML(username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nisapoti!</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Nisapoti</div>
            <h1 class="title">Welcome to Nisapoti! 🎉</h1>
            <p class="description">Hi ${username}, your account has been successfully created!</p>
          </div>
          
          <p>Thank you for joining Nisapoti! You can now:</p>
          <ul>
            <li>Create and manage your wishlist</li>
            <li>Connect with supporters</li>
            <li>Share your goals and dreams</li>
            <li>Track your progress</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="cta-button">
              Get Started
            </a>
          </div>
          
          <div class="footer">
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>© 2024 Nisapoti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate referral click notification email HTML
  private generateReferralClickEmailHTML(referrerName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Click Notification</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .highlight {
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Nisapoti</div>
            <h1 class="title">Someone clicked your referral link! 🎯</h1>
            <p class="description">Hi ${referrerName}, great news!</p>
          </div>
          
          <div class="highlight">
            🎉 Someone just clicked your referral link!
          </div>
          
          <p>This means someone is interested in joining Nisapoti through your invitation. They might be:</p>
          <ul>
            <li>Checking out the platform</li>
            <li>Considering creating an account</li>
            <li>Already in the process of signing up</li>
          </ul>
          
          <p>Keep sharing your referral link to grow your network and unlock exclusive rewards!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/creator/referrals" class="cta-button">
              View Your Referral Stats
            </a>
          </div>
          
          <div class="footer">
            <p>Keep sharing to unlock more rewards!</p>
            <p>© 2024 Nisapoti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate referral conversion notification email HTML
  private generateReferralConversionEmailHTML(referrerName: string, referredUserName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Conversion Notification</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .highlight {
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Nisapoti</div>
            <h1 class="title">🎉 New Referral Conversion!</h1>
            <p class="description">Hi ${referrerName}, congratulations!</p>
          </div>
          
          <div class="highlight">
            🎊 ${referredUserName} just joined Nisapoti through your referral link!
          </div>
          
          <p>This is amazing! You've successfully referred someone to join the Nisapoti community. Here's what this means:</p>
          <ul>
            <li>✅ You've earned a referral conversion</li>
            <li>🚀 You're one step closer to unlocking exclusive rewards</li>
            <li>💪 Your network is growing</li>
            <li>🎯 Keep sharing to reach the next reward tier!</li>
          </ul>
          
          <p>Check your referral dashboard to see your updated stats and track your progress toward the next reward tier!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/creator/referrals" class="cta-button">
              View Your Referral Stats
            </a>
          </div>
          
          <div class="footer">
            <p>Keep sharing to unlock more rewards!</p>
            <p>© 2024 Nisapoti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate referred user welcome email HTML
  private generateReferredUserWelcomeEmailHTML(username: string, referrerName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nisapoti!</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF6A1A;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .highlight {
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6A1A, #FF9A3C);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Nisapoti</div>
            <h1 class="title">Welcome to Nisapoti! 🎉</h1>
            <p class="description">Hi ${username}, you were invited by ${referrerName}!</p>
          </div>
          
          <div class="highlight">
            🎊 You're now part of the Nisapoti community!
          </div>
          
          <p>Thank you for joining Nisapoti through ${referrerName}'s referral! You can now:</p>
          <ul>
            <li>Create and manage your wishlist</li>
            <li>Connect with supporters</li>
            <li>Share your goals and dreams</li>
            <li>Track your progress</li>
            <li>Start your own referral program</li>
          </ul>
          
          <p>Since you joined through a referral, you and ${referrerName} will both benefit from this connection!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="cta-button">
              Get Started
            </a>
          </div>
          
          <div class="footer">
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>© 2024 Nisapoti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
export const emailService = new EmailService();
