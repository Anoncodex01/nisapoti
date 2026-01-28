export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const response = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Registration failed' } };
    }

    return { data, error: null };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const response = await fetch('/api/auth/login-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Login failed' } };
    }

    return { data, error: null };
  },

  // Sign out
  async signOut() {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    }
    return { error: null };
  },

  // Get current user
  async getCurrentUser() {
    if (typeof window === 'undefined') {
      return { user: null, error: null };
    }

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return { user: null, error: null };
      }

      const user = JSON.parse(userStr);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: { message: 'Failed to get current user' } };
    }
  },

  // Reset password using custom verification system
  async resetPassword(email: string) {
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: { message: errorData.error || 'Failed to send verification code' } };
    }

    return { data: { message: 'Verification code sent' }, error: null };
  },

  // Update password
  async updatePassword(password: string) {
    // This would need to be implemented with a custom API
    return { data: null, error: { message: 'Password update not implemented yet' } };
  },

  // Listen to auth state changes (placeholder for MySQL)
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // For MySQL, we don't have real-time auth state changes
    // This is a placeholder for future implementation
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}