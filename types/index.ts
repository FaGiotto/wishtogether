import { CategoryKey } from '../constants/categories';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  partner_id: string | null;
  couple_id: string | null;
  invite_code: string | null;
  push_token: string | null;
  created_at: string;
}

export interface Wish {
  id: string;
  couple_id: string;
  category: CategoryKey;
  title: string;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  created_by: string;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
  // joined
  creator?: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export interface Comment {
  id: string;
  wish_id: string;
  user_id: string;
  text: string;
  created_at: string;
  // joined
  author?: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}
