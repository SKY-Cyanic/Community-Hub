
import { Post, Comment, Board, User, Notification, WikiPage, ChatMessage, ShopItem, AiLog } from '../types';

const STORAGE_KEYS = {
  POSTS: 'k_community_posts',
  COMMENTS: 'k_community_comments',
  USERS: 'k_community_users',
  SESSION: 'k_community_session',
  NOTIFICATIONS: 'k_community_notifications',
  WIKI: 'k_community_wiki',
  CHAT: 'k_community_chat',
  AI_LOGS: 'k_community_ai_logs', // New
};

// Broadcast Channel for Cross-Tab Sync
const channel = new BroadcastChannel('k_community_sync');

export const notifyChanges = (type: string) => {
  channel.postMessage({ type, timestamp: Date.now() });
};

// Initial Seed Data
const SEED_BOARDS: Board[] = [
  { id: '1', slug: 'free', name: '자유게시판', description: '자유롭게 이야기를 나누는 공간입니다.', categories: ['잡담', '질문', '후기'] },
  { id: '2', slug: 'humor', name: '유머게시판', description: '오늘의 유머 모음', categories: ['유머', '감동', '이슈'] },
  { id: '3', slug: 'dev', name: '개발자게시판', description: '코딩과 기술 이야기', categories: ['질문', '팁', '채용', '프로젝트'] },
  { id: '4', slug: 'stock', name: '주식게시판', description: '성투를 기원합니다', categories: ['국장', '미장', '코인', '뉴스'] },
];

const ADMIN_USER: User = {
  id: 'admin',
  username: 'admin',
  password: 'admin_password_placeholder', 
  is_admin: true,
  level: 99,
  exp: 999999,
  points: 999999,
  email: 'admin@k-hub.com',
  inventory: [],
  active_items: { name_color: '#FF0000', name_style: 'bold', badge: '👑' },
  blocked_users: []
};

const BOT_USER: User = {
  id: 'ai_manager',
  username: 'AI_파딱',
  password: '', 
  is_admin: false,
  is_bot: true,
  level: 100,
  exp: 0,
  points: 0,
  email: 'ai@k-hub.com',
  inventory: [],
  active_items: { name_color: '#3b82f6', name_style: 'bold', badge: '🤖' },
  blocked_users: []
};

// Shop Items
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'color_blue', name: '닉네임: 블루', description: '닉네임을 파란색으로 변경합니다.', price: 100, type: 'color', value: '#3b82f6', icon: '🎨' },
  { id: 'color_green', name: '닉네임: 그린', description: '닉네임을 초록색으로 변경합니다.', price: 100, type: 'color', value: '#22c55e', icon: '🎨' },
  { id: 'style_bold', name: '닉네임: 굵게', description: '닉네임을 굵게 표시합니다.', price: 200, type: 'style', value: 'bold', icon: 'B' },
  { id: 'badge_star', name: '별 배지', description: '닉네임 옆에 별 배지를 답니다.', price: 500, type: 'badge', value: '⭐', icon: '🎖️' },
  { id: 'badge_dia', name: '다이아 배지', description: '닉네임 옆에 다이아 배지를 답니다.', price: 1000, type: 'badge', value: '💎', icon: '🎖️' },
];

// Utility to generate fake IP
const generateFakeIP = () => {
  const p1 = Math.floor(Math.random() * 255);
  const p2 = Math.floor(Math.random() * 255);
  return `${p1}.${p2}.***.***`;
};

// EXP Table
const getLevel = (exp: number) => Math.floor(exp / 100) + 1;

// Seed posts
const SEED_POSTS: Post[] = [
  {
    id: 'notice-free',
    board_id: 'free',
    author_id: 'admin',
    category: '공지',
    title: '[공지] 자유게시판 이용 수칙 및 가이드라인',
    content: '<p><strong>안녕하세요, K-Community Hub입니다.</strong></p><p><br></p><p>자유게시판은 누구나 자유롭게 이야기를 나누는 공간입니다.</p><p>단, 욕설, 비방, 도배, 광고성 게시물은 예고 없이 삭제될 수 있으며 이용이 제한될 수 있습니다.</p><p><br></p><p>서로 존중하며 즐거운 커뮤니티를 만들어주세요.</p>',
    view_count: 120,
    upvotes: 15,
    downvotes: 0,
    liked_users: [],
    created_at: new Date('2024-01-01T09:00:00').toISOString(),
    author: { ...ADMIN_USER, username: '운영자', created_at: new Date().toISOString() },
    comment_count: 5,
    is_hot: true,
    has_image: false,
    ip_addr: '1.1.***.***'
  },
  {
    id: 'notice-humor',
    board_id: 'humor',
    author_id: 'admin',
    category: '공지',
    title: '[공지] 유머게시판 베스트 선정 기준 안내',
    content: '<p>추천 수 10개 이상을 받을 시 실시간 베스트로 자동 이동됩니다.</p><p>중복 자료는 자제 부탁드립니다.</p>',
    view_count: 85,
    upvotes: 10,
    downvotes: 0,
    liked_users: [],
    created_at: new Date('2024-01-02T10:30:00').toISOString(),
    author: { ...ADMIN_USER, username: '운영자', created_at: new Date().toISOString() },
    comment_count: 2,
    is_hot: true,
    has_image: false,
    ip_addr: '1.1.***.***'
  },
];

// Helper to safely parse JSON
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
    return fallback;
  }
};

export const storage = {
  // Expose channel for listener registration
  channel,

  getBoards: (): Board[] => SEED_BOARDS,

  getPosts: (): Post[] => {
    const posts = safeParse<Post[]>(STORAGE_KEYS.POSTS, []);
    return posts.length > 0 ? posts : SEED_POSTS;
  },

  savePost: (post: Post) => {
    const posts = storage.getPosts();
    if (!post.ip_addr) post.ip_addr = generateFakeIP();
    if (!post.liked_users) post.liked_users = [];
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    if(!post.author.is_bot) storage.addExp(post.author_id, 10);
    notifyChanges('POST_UPDATE');
  },

  updatePost: (updatedPost: Post) => {
     const posts = storage.getPosts();
     const index = posts.findIndex(p => p.id === updatedPost.id);
     if (index !== -1) {
       posts[index] = updatedPost;
       localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
       notifyChanges('POST_UPDATE');
     }
  },

  deletePost: (postId: string) => {
    let posts = storage.getPosts();
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    notifyChanges('POST_UPDATE');
  },

  getComments: (): Comment[] => safeParse<Comment[]>(STORAGE_KEYS.COMMENTS, []),

  saveComment: (comment: Comment) => {
    const comments = storage.getComments();
    if (!comment.ip_addr && !comment.author.is_bot) comment.ip_addr = generateFakeIP();
    comments.push(comment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    
    const posts = storage.getPosts();
    const postIndex = posts.findIndex(p => p.id === comment.post_id);
    let postAuthorId = '';
    
    if (postIndex !== -1) {
      posts[postIndex].comment_count += 1;
      postAuthorId = posts[postIndex].author_id;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    if(!comment.author.is_bot) storage.addExp(comment.author_id, 2); 

    if (postAuthorId && postAuthorId !== comment.author_id) {
      storage.createNotification({
        user_id: postAuthorId,
        type: 'comment',
        message: comment.author.is_bot ? 'AI 파딱이 댓글을 남겼습니다.' : '내 글에 새로운 댓글이 달렸습니다.',
        link: `/board/${posts[postIndex].board_id}/${comment.post_id}`
      });
    }
    notifyChanges('COMMENT_UPDATE');
  },

  getSession: (): User | null => safeParse<User | null>(STORAGE_KEYS.SESSION, null),

  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    notifyChanges('SESSION_UPDATE');
  },
  
  getUsers: (): User[] => {
    const users = safeParse<User[]>(STORAGE_KEYS.USERS, []);
    // Ensure Bot User exists
    if (!users.find(u => u.id === BOT_USER.id)) {
        users.push(BOT_USER);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  },

  getUser: (username: string): User | undefined => {
    const users = storage.getUsers();
    return users.find(u => u.username === username);
  },

  getBotUser: (): User => {
      // Ensure existence logic is in getUsers
      const users = storage.getUsers();
      return users.find(u => u.id === BOT_USER.id) || BOT_USER;
  },
  
  saveUser: (user: User) => {
    const users = storage.getUsers();
    const existingIdx = users.findIndex(u => u.id === user.id);
    if (existingIdx !== -1) {
        users[existingIdx] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyChanges('USER_UPDATE');
  },

  deleteUser: (userId: string) => {
    let users = storage.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyChanges('USER_UPDATE');
  },

  // EXP & User Logic
  addExp: (userId: string, amount: number) => {
    const users = storage.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1 && !users[userIndex].is_bot) {
      users[userIndex].exp += amount;
      users[userIndex].points += amount;
      users[userIndex].level = getLevel(users[userIndex].exp);
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Update session if it's the current user
      const session = storage.getSession();
      if (session && session.id === userId) {
         storage.setSession(users[userIndex]);
      } else {
         notifyChanges('USER_UPDATE');
      }
    }
  },

  // User Blocking
  blockUser: (blockerId: string, targetId: string) => {
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === blockerId);
    if (idx !== -1) {
        if (!users[idx].blocked_users.includes(targetId)) {
            users[idx].blocked_users.push(targetId);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            
            const session = storage.getSession();
            if (session && session.id === blockerId) {
                storage.setSession(users[idx]);
            } else {
                notifyChanges('USER_UPDATE');
            }
        }
    }
  },

  // Shop
  buyItem: (userId: string, itemId: string): boolean => {
      const users = storage.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      
      if (idx !== -1 && item) {
          if (users[idx].points >= item.price) {
              users[idx].points -= item.price;
              if (!users[idx].inventory.includes(itemId)) {
                  users[idx].inventory.push(itemId);
              }
              // Auto equip
              if (item.type === 'color') users[idx].active_items.name_color = item.value;
              if (item.type === 'style' && item.value === 'bold') users[idx].active_items.name_style = 'bold';
              if (item.type === 'badge') users[idx].active_items.badge = item.value;
              
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

              const session = storage.getSession();
              if (session && session.id === userId) {
                  storage.setSession(users[idx]);
              } else {
                  notifyChanges('USER_UPDATE');
              }
              return true;
          }
      }
      return false;
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    const allnotes = safeParse<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return allnotes.filter(n => n.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification: (note: Partial<Notification>) => {
    const allnotes = safeParse<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNote: Notification = {
      id: `noti-${Date.now()}-${Math.random()}`,
      user_id: note.user_id!,
      type: note.type || 'comment',
      message: note.message || '알림',
      link: note.link || '/',
      is_read: false,
      created_at: new Date().toISOString()
    };
    allnotes.push(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allnotes));
    notifyChanges('NOTI_UPDATE');
  },

  markNotificationsRead: (userId: string) => {
    const allnotes = safeParse<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = allnotes.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyChanges('NOTI_UPDATE');
  },

  // Wiki
  getWikiPages: (): WikiPage[] => safeParse<WikiPage[]>(STORAGE_KEYS.WIKI, []),
  
  getWikiPage: (slug: string): WikiPage | undefined => {
      const pages = storage.getWikiPages();
      return pages.find(p => p.slug === slug);
  },

  saveWikiPage: (page: WikiPage) => {
      const pages = storage.getWikiPages();
      const idx = pages.findIndex(p => p.slug === page.slug);
      if (idx !== -1) {
          pages[idx] = page;
      } else {
          pages.push(page);
      }
      localStorage.setItem(STORAGE_KEYS.WIKI, JSON.stringify(pages));
      notifyChanges('WIKI_UPDATE');
  },

  // Chat
  getChatMessages: (): ChatMessage[] => safeParse<ChatMessage[]>(STORAGE_KEYS.CHAT, []),

  sendChatMessage: (msg: ChatMessage) => {
      const msgs = storage.getChatMessages();
      msgs.push(msg);
      // Keep last 50
      if (msgs.length > 50) msgs.shift();
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(msgs));
      notifyChanges('CHAT_UPDATE');
  },

  // AI Logs
  getAiLogs: (): AiLog[] => safeParse<AiLog[]>(STORAGE_KEYS.AI_LOGS, []),

  saveAiLog: (action: AiLog['action'], target_id: string, detail: string) => {
      const logs = storage.getAiLogs();
      logs.unshift({
          id: `log-${Date.now()}`,
          action,
          target_id,
          detail,
          timestamp: new Date().toISOString()
      });
      // Keep last 100 logs
      if (logs.length > 100) logs.pop();
      localStorage.setItem(STORAGE_KEYS.AI_LOGS, JSON.stringify(logs));
  }
};
