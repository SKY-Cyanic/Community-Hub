
export interface User {
  id: string;
  username: string;
  password?: string;
  second_password?: string;
  is_admin?: boolean;
  is_bot?: boolean;
  avatar_url?: string;
  email?: string;
  level: number;
  exp: number;
  points: number;
  inventory: string[];
  active_items: {
    name_color?: string;
    name_style?: 'normal' | 'bold';
    badge?: string;
  };
  blocked_users: string[];
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  level: number;
  exp?: number;
  active_items?: {
    name_color?: string;
    name_style?: 'normal' | 'bold';
    badge?: string;
  };
  is_admin?: boolean;
  is_bot?: boolean;
}

export interface Board {
  id: string;
  slug: string;
  name: string;
  description?: string;
  categories?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  voted_users: string[];
}

export interface Post {
  id: string;
  board_id: string;
  author_id: string;
  category?: string;
  title: string;
  content: string;
  view_count: number;
  upvotes: number;
  downvotes: number;
  liked_users: string[];
  created_at: string;
  author: Profile;
  comment_count: number;
  is_hot?: boolean;
  has_image?: boolean;
  images?: string[];
  ip_addr?: string;
  poll?: Poll;
  ai_agent_type?: 'news' | 'reddit' | 'wiki'; // Origin agent
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: Profile;
  depth: number;
  children?: Comment[];
  ip_addr?: string;
  is_blinded?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'reply' | 'level_up' | 'ai_info';
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'color' | 'style' | 'badge';
  value: string;
  icon: string;
}

export interface WikiPage {
  slug: string;
  title: string;
  content: string;
  last_updated: string;
  last_editor: string;
  sources?: string[];
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  text: string;
  timestamp: string;
  user_level: number;
}

export interface AiLog {
  id: string;
  action: 'summary' | 'fact_check' | 'moderation' | 'comment' | 'wiki' | 'swarm_activity';
  target_id: string;
  detail: string;
  timestamp: string;
}
