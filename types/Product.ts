export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  rating?: number;
  isFree?: boolean;
  category: 'digital' | 'physical' | 'service' | string;
  description?: string;
  features?: string[];
  creator?: {
    name: string;
    avatar?: string;
  };
  creator_id?: string;
  feature_image_url?: string;
  status?: string;
  total_sales?: number;
  file_url?: string;
  content_url?: string;
  redirect_url?: string;
  confirmation_message?: string;
  success_page_type?: string;
  creator_username?: string;
  limit_slots?: boolean;
  max_slots?: number;
  sold_slots?: number;
  allow_quantity?: boolean;
  quantity?: number;
}
