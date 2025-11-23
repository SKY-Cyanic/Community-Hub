export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  level: number;
  exp: number; // Experience points
  points: number; // Currency
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  level: number;
  exp?: number;
}

export interface Board {
  id: string;
  slug: string;
  name: string;
  description?: string;
  categories?: string[]; // Tab categories like [General, Info, Humor]
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  voted_users: string[]; // User IDs who voted
}

export interface Post {
  id: string;
  board_id: string;
  author_id: string;
  category?: string; // e.g. "Chat", "Info"
  title: string;
  content: string; // HTML content
  view_count: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: Profile;
  comment_count: number;
  is_hot?: boolean;
  has_image?: boolean;
  images?: string[]; // Array of base64 strings or URLs
  ip_addr?: string; // e.g. "123.45.***"
  poll?: Poll; // Embedded poll
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
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'reply' | 'level_up';
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}
