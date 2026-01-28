// User and Profile interfaces for type safety

export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  bio?: string;
  category?: string;
  website?: string;
  creator_url?: string;
  instagram?: string;
  pinterest?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface SupportRequest {
  creator_id: string;
  supporter_name: string;
  supporter_phone: string;
  amount: number;
  message?: string;
  is_monthly?: boolean;
}

export interface WishlistItem {
  id: string;
  uuid: string;
  creator_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface Supporter {
  id: string;
  creator_id: string;
  name: string;
  phone: string;
  amount: number;
  type: 'one_time' | 'monthly';
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Withdrawal {
  id: string;
  creator_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bank_details?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Verification {
  id: string;
  user_id: string;
  code: string;
  type: 'email' | 'phone';
  expires_at: Date;
  created_at: Date;
}
