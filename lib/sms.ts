/**
 * SMS Service for sending notifications via Mambo SMS
 */

interface SMSLoginRequest {
  phone_number: string;
  password: string;
}

interface SMSLoginResponse {
  success: boolean;
  data?: {
    token: string;
  };
  message?: string;
}

interface SMSSendRequest {
  sender_id: string;
  message: string;
  mobile: string;
}

interface SMSSendResponse {
  success: boolean;
  message: string;
  message_id?: string;
  recipients?: string[];
}

class SMSService {
  private baseUrl: string;
  private token: string | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.SMS_BASE_URL || 'https://mambosms.co.tz';
    this.apiKey = process.env.SMS_API_KEY;
  }

  /**
   * Authenticate with SMS API
   */
  async authenticate(credentials?: SMSLoginRequest): Promise<boolean> {
    try {
      const phoneNumber = credentials?.phone_number || process.env.SMS_PHONE_NUMBER || '0622551047';
      const password = credentials?.password || process.env.SMS_PASSWORD || '123456789';

      console.log('🔑 Authenticating with SMS API...');

      const response = await fetch(`${this.baseUrl}/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        this.token = data.data.token;
        console.log('✅ SMS API authentication successful');
        return true;
      } else {
        console.error('❌ SMS API authentication failed:', data);
        return false;
      }
    } catch (error) {
      console.error('🚨 SMS API authentication error:', error);
      return false;
    }
  }

  /**
   * Check if SMS service is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Format phone number for SMS (ensure it's in correct format)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, keep as is (local format)
    // If starts with 255, keep as is (international format)
    // Otherwise, assume it's local and add 0 if needed
    if (!cleaned.startsWith('0') && !cleaned.startsWith('255')) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send single SMS
   */
  async sendSingleSMS(mobile: string, message: string): Promise<SMSSendResponse> {
    // Auto-authenticate if not authenticated
    if (!this.token) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('SMS API not authenticated');
      }
    }

    // Format phone number
    const formattedMobile = this.formatPhoneNumber(mobile);

    try {
      const payload: SMSSendRequest = {
        sender_id: process.env.SMS_SENDER_ID || 'Nisapoti',
        message,
        mobile: formattedMobile,
      };

      console.log('📤 Sending SMS request:', {
        url: `${this.baseUrl}/api/v1/sms/single`,
        mobile: mobile.substring(0, 6) + '***',
        messageLength: message.length,
      });

      const response = await fetch(`${this.baseUrl}/api/v1/sms/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log('📥 SMS API response:', {
        status: response.status,
        success: data.success,
      });

      if (response.ok && data.success) {
        return {
          success: true,
          message: 'SMS sent successfully',
          message_id: data.data?.message_id,
          recipients: [mobile],
        };
      } else {
        console.error('❌ SMS API returned failure:', data);
        throw new Error(data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('🚨 SMS sending error:', error);
      throw error;
    }
  }

  /**
   * Format amount for SMS message
   */
  formatAmount(amount: number): string {
    return `TSh ${parseFloat(amount.toString()).toLocaleString('en-TZ', { minimumFractionDigits: 0 })}`;
  }

  /**
   * Generate withdrawal completion SMS message
   */
  getWithdrawalCompletedMessage(fullName: string, amount: number): string {
    // Format amount without currency prefix (we'll add TZS in message)
    const formattedAmount = parseFloat(amount.toString()).toLocaleString('en-TZ', { minimumFractionDigits: 0 });
    // Use first name only for SMS
    const firstName = fullName.split(' ')[0] || fullName;
    return `Ndugu ${firstName} Malipo yako ya TZS ${formattedAmount} yamekamilika! Angalia akaunti yako sasa. Endelea kuleta ubunifu zaidi! nisapoti.com`;
  }

  /**
   * Generate withdrawal processing SMS message
   */
  getWithdrawalProcessingMessage(fullName: string, amount: number): string {
    const formattedAmount = this.formatAmount(amount);
    // Use first name only for SMS
    const firstName = fullName.split(' ')[0] || fullName;
    return `Ndugu ${firstName} maombi yako ya ${formattedAmount} yamepokelewa. Tunashughulikia ndani ya muda mfupi.`;
  }
}

// Initialize SMS service
export const smsService = new SMSService();
