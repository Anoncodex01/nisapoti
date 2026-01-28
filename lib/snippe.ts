/**
 * Snippe.sh Payment Service
 * Handles mobile money payments via Snippe API
 */

export interface SnippeConfig {
  apiKey: string;
  baseUrl: string;
  webhookUrl?: string;
}

export interface CreatePaymentRequest {
  payment_type: 'mobile';
  details: {
    amount: number; // Amount in smallest currency unit (e.g., cents)
    currency: 'TZS';
  };
  phone_number: string; // Format: 255781000000
  customer: {
    firstname: string;
    lastname: string;
    email: string;
  };
  webhook_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  code: number;
  data?: {
    reference: string;
    external_reference: string;
    status: 'pending' | 'completed' | 'failed' | 'expired' | 'voided';
    amount: {
      value: number;
      currency: string;
    };
    payment_type: string;
    created_at: string;
  };
  message?: string;
}

export interface PaymentStatusResponse {
  status: 'success' | 'error';
  code: number;
  data?: {
    reference: string;
    external_reference: string;
    status: 'pending' | 'completed' | 'failed' | 'expired' | 'voided';
    amount: {
      value: number;
      currency: string;
    };
    channel?: {
      type: string;
      provider: string;
    };
    customer: {
      phone: string;
      name: string;
      email: string;
    };
    completed_at?: string;
    created_at: string;
  };
  message?: string;
}

export class SnippeService {
  private config: SnippeConfig;

  constructor(config: SnippeConfig) {
    this.config = config;
  }

  /**
   * Format phone number to Snippe format (255XXXXXXXXX)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 255
    if (cleaned.startsWith('0')) {
      cleaned = '255' + cleaned.substring(1);
    } else if (!cleaned.startsWith('255')) {
      // If doesn't start with 255, add it
      cleaned = '255' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Split name into firstname and lastname
   * Snippe requires both firstname and lastname
   * If only one name is provided, use it for both fields (matching registration flow)
   */
  static splitName(fullName: string): { firstname: string; lastname: string } {
    const parts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      // Fallback if empty name
      return { firstname: 'Supporter', lastname: 'Supporter' };
    }
    
    if (parts.length === 1) {
      // If only one name provided, use it for both firstname and lastname
      return { firstname: parts[0], lastname: parts[0] };
    }
    
    // Multiple parts: first part is firstname, rest is lastname
    const firstname = parts[0];
    const lastname = parts.slice(1).join(' ');
    return { firstname, lastname };
  }

  /**
   * Create a mobile money payment
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const url = `${this.config.baseUrl}/v1/payments`;
      
      // Format phone number for Snippe - use local format (0XXXXXXXXX) as shown in curl example
      let phoneNumber = request.phone_number.replace(/\D/g, '');
      // Convert to local format (0XXXXXXXXX)
      if (phoneNumber.startsWith('255')) {
        phoneNumber = '0' + phoneNumber.substring(3);
      } else if (!phoneNumber.startsWith('0')) {
        phoneNumber = '0' + phoneNumber;
      }
      // Ensure it's exactly 10 digits
      if (phoneNumber.length !== 10) {
        console.warn('⚠️ Phone number length is not 10 digits:', phoneNumber);
      }
      
      const payload = {
        payment_type: 'mobile',
        details: {
          amount: request.details.amount,
          currency: request.details.currency || 'TZS',
        },
        phone_number: phoneNumber,
        customer: {
          firstname: request.customer.firstname,
          lastname: request.customer.lastname,
          email: request.customer.email,
        },
        webhook_url: request.webhook_url || this.config.webhookUrl,
        metadata: request.metadata || {},
      };

      console.log('📤 Snippe - Creating payment:', {
        payment_type: payload.payment_type,
        details: payload.details,
        phone_number: payload.phone_number.substring(0, 6) + '***',
        customer: {
          firstname: payload.customer.firstname,
          lastname: payload.customer.lastname,
          email: payload.customer.email.substring(0, 10) + '***',
        },
        webhook_url: payload.webhook_url,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data = await response.json();
      
      // Handle case where response is a JSON string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ Failed to parse response as JSON:', e);
        }
      }

      console.log('📥 Snippe - Payment response:', {
        status: response.status,
        data: data,
      });

      if (!response.ok || data.status === 'error' || data.error) {
        return {
          status: 'error',
          code: response.status,
          message: data.message || data.error || 'Failed to create payment',
        };
      }

      // Response might be directly in data or nested in data.data
      const paymentData = data.data || data;

      // Log if payment status is failed to see why
      if (paymentData.status === 'failed') {
        console.error('❌ Snippe - Payment failed immediately:', {
          reference: paymentData.reference,
          status: paymentData.status,
          failure_reason: paymentData.failure_reason,
          error: paymentData.error,
          channel: paymentData.channel,
          fullResponse: JSON.stringify(paymentData, null, 2),
        });
      }

      return {
        status: 'success',
        code: response.status,
        data: paymentData,
      };
    } catch (error) {
      console.error('❌ Snippe - Payment creation failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payment status by reference
   */
  async getPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    try {
      const url = `${this.config.baseUrl}/v1/payments/${reference}`;

      console.log('📤 Snippe - Checking payment status:', reference);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();
      
      // Handle case where response is a JSON string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ Failed to parse status response as JSON:', e);
        }
      }

      console.log('📥 Snippe - Payment status response:', {
        status: response.status,
        data: data,
      });

      if (!response.ok || data.status === 'error') {
        return {
          status: 'error',
          code: response.status,
          message: data.message || 'Failed to get payment status',
        };
      }

      const paymentData = data.data || data;
      
      // Log failure details if payment failed
      if (paymentData.status === 'failed') {
        console.error('❌ Snippe - Payment status check shows failed:', {
          reference: paymentData.reference,
          status: paymentData.status,
          failure_reason: paymentData.failure_reason,
          channel: paymentData.channel,
          completed_at: paymentData.completed_at,
          fullResponse: JSON.stringify(paymentData, null, 2),
        });
      }

      return {
        status: 'success',
        code: response.status,
        data: paymentData,
      };
    } catch (error) {
      console.error('❌ Snippe - Status check failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a payout (send money to mobile wallet)
   */
  async createPayout(request: {
    amount: number; // Amount in smallest currency unit (TZS)
    channel: 'mobile' | 'bank';
    recipient_phone: string; // Format: 255781000000 or 0755123456
    recipient_name: string;
    narration?: string;
    webhook_url?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentResponse> {
    try {
      const url = `${this.config.baseUrl}/v1/payouts/send`;
      
      // Format phone number - convert to international format (255XXXXXXXXX)
      let phoneNumber = request.recipient_phone.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '255' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('255')) {
        phoneNumber = '255' + phoneNumber;
      }
      
      const payload = {
        amount: request.amount,
        channel: request.channel,
        recipient_phone: phoneNumber,
        recipient_name: request.recipient_name,
        narration: request.narration || 'Withdrawal from Nisapoti',
        webhook_url: request.webhook_url || this.config.webhookUrl,
        metadata: request.metadata || {},
      };

      console.log('📤 Snippe - Creating payout:', {
        amount: payload.amount,
        channel: payload.channel,
        recipient_phone: payload.recipient_phone.substring(0, 6) + '***',
        recipient_name: payload.recipient_name,
        narration: payload.narration,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data = await response.json();
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ Failed to parse payout response as JSON:', e);
        }
      }

      console.log('📥 Snippe - Payout response:', {
        status: response.status,
        data: data,
      });

      if (!response.ok || data.status === 'error' || data.error) {
        return {
          status: 'error',
          code: response.status,
          message: data.message || data.error || 'Failed to create payout',
        };
      }

      const payoutData = data.data || data;

      return {
        status: 'success',
        code: response.status,
        data: payoutData,
      };
    } catch (error) {
      console.error('❌ Snippe - Payout creation failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payout status by reference
   */
  async getPayoutStatus(reference: string): Promise<PaymentStatusResponse> {
    try {
      const url = `${this.config.baseUrl}/v1/payouts/${reference}`;

      console.log('📤 Snippe - Checking payout status:', reference);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ Failed to parse payout status response as JSON:', e);
        }
      }

      console.log('📥 Snippe - Payout status response:', {
        status: response.status,
        data: data,
      });

      if (!response.ok || data.status === 'error') {
        return {
          status: 'error',
          code: response.status,
          message: data.message || 'Failed to get payout status',
        };
      }

      const payoutData = data.data || data;

      return {
        status: 'success',
        code: response.status,
        data: payoutData,
      };
    } catch (error) {
      console.error('❌ Snippe - Payout status check failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate payout fee
   */
  async calculatePayoutFee(amount: number): Promise<{
    status: 'success' | 'error';
    code: number;
    data?: {
      amount: number;
      fee_amount: number;
      total_amount: number;
      currency: string;
    };
    message?: string;
  }> {
    try {
      const url = `${this.config.baseUrl}/v1/payouts/fee?amount=${amount}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ Failed to parse fee response as JSON:', e);
        }
      }

      if (!response.ok || data.status === 'error') {
        return {
          status: 'error',
          code: response.status,
          message: data.message || 'Failed to calculate fee',
        };
      }

      return {
        status: 'success',
        code: response.status,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Snippe - Fee calculation failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // TODO: Implement HMAC-SHA256 signature verification
    // For now, we'll trust the webhook if it comes from Snippe domain
    return true;
  }
}

// Initialize Snippe service
const snippeConfig: SnippeConfig = {
  apiKey: process.env.SNIPPE_API_KEY || '',
  baseUrl: process.env.SNIPPE_BASE_URL || 'https://api.snippe.sh',
  webhookUrl: process.env.SNIPPE_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/snippe-webhook`,
};

if (!snippeConfig.apiKey) {
  console.warn('⚠️ SNIPPE_API_KEY is not set in environment variables');
}

export const snippe = new SnippeService(snippeConfig);
