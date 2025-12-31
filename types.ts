
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
  scrapped_posts: string[]; // Bookmarked post IDs
  quests: {
    last_updated: string; // Date string YYYY-MM-DD
    daily_login: boolean;
    post_count: number;
    comment_count: number;
  };
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
  ai_agent_type?: 'news' | 'reddit' | 'wiki';
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
  user_id: string; // 수신자
  type: 'comment' | 'reply' | 'level_up' | 'system' | 'message';
  message: string;
  link: string; // 클릭 시 이동할 경로
  is_read: boolean;
  created_at: string;
  from_user?: {
    username: string;
    avatar_url?: string;
  };
}

// 1:1 대화방 메타데이터
export interface Conversation {
  id: string;
  participants: string[]; // [userId1, userId2]
  last_message: string;
  last_message_at: string;
  updated_at: string;
  unread_counts: { [userId: string]: number };
}

// 개별 메시지
export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
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
  external_url?: string; // 외부 사이트 연결용
  is_external?: boolean;
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
