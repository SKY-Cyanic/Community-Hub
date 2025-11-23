
import { Post, Comment, Board, User, Notification, WikiPage, ChatMessage, ShopItem } from '../types';

const STORAGE_KEYS = {
  POSTS: 'k_community_posts',
  COMMENTS: 'k_community_comments',
  USERS: 'k_community_users',
  SESSION: 'k_community_session',
  NOTIFICATIONS: 'k_community_notifications',
  WIKI: 'k_community_wiki',
  CHAT: 'k_community_chat',
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
  username: '운영자',
  level: 99,
  exp: 999999,
  points: 999999,
  email: 'admin@k-hub.com',
  inventory: [],
  active_items: { name_color: '#FF0000', name_style: 'bold', badge: '👑' },
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

const SEED_POSTS: Post[] = [
  {
    id: 'notice-free',
    board_id: 'free',
    author_id: 'admin',
    category: '공지',
    title: '[공지] 자유게시판 이용 수칙 및 가이드라인',
    content: '<p><strong>안녕하세요, K-Community Hub입니다.</strong></p><p><br></p><p>자유게시판은 누구나 자유롭게 이야기를 나누는 공간입니다.</p><p>단, 욕설, 비방, 도배, 광고성 게시물은 예고 없이 삭제될 수 있으며 이용이 제한될 수 있습니다.</p><p><br></p><p>서로 존중하며 즐거운 커뮤니티를 만들어주세요.</p>',
    view_count: 45210,
    upvotes: 1240,
    downvotes: 5,
    created_at: new Date('2024-01-01T09:00:00').toISOString(),
    author: { ...ADMIN_USER, created_at: new Date().toISOString() },
    comment_count: 152,
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
    view_count: 89032,
    upvotes: 5201,
    downvotes: 112,
    created_at: new Date('2024-01-02T10:30:00').toISOString(),
    author: { ...ADMIN_USER, created_at: new Date().toISOString() },
    comment_count: 892,
    is_hot: true,
    has_image: false,
    ip_addr: '1.1.***.***'
  },
];

export const storage = {
  getBoards: (): Board[] => SEED_BOARDS,

  getPosts: (): Post[] => {
    const data = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    return JSON.parse(data);
  },

  savePost: (post: Post) => {
    const posts = storage.getPosts();
    if (!post.ip_addr) post.ip_addr = generateFakeIP();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    storage.addExp(post.author_id, 10); 
  },

  updatePost: (updatedPost: Post) => {
     const posts = storage.getPosts();
     const index = posts.findIndex(p => p.id === updatedPost.id);
     if (index !== -1) {
       posts[index] = updatedPost;
       localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
     }
  },

  getComments: (): Comment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveComment: (comment: Comment) => {
    const comments = storage.getComments();
    if (!comment.ip_addr) comment.ip_addr = generateFakeIP();
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

    storage.addExp(comment.author_id, 2); 

    if (postAuthorId && postAuthorId !== comment.author_id) {
      storage.createNotification({
        user_id: postAuthorId,
        type: 'comment',
        message: '내 글에 새로운 댓글이 달렸습니다.',
        link: `/board/${posts[postIndex].board_id}/${comment.post_id}`
      });
    }
  },

  getSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  // EXP & User Logic
  addExp: (userId: string, amount: number) => {
    const session = storage.getSession();
    if (session && session.id === userId) {
      session.exp += amount;
      session.points += amount; // Give points same as exp for now
      session.level = getLevel(session.exp);
      storage.setSession(session);
    }
  },

  // User Blocking
  blockUser: (blockerId: string, targetId: string) => {
    const session = storage.getSession();
    if (session && session.id === blockerId) {
        if (!session.blocked_users.includes(targetId)) {
            session.blocked_users.push(targetId);
            storage.setSession(session);
        }
    }
  },

  // Shop
  buyItem: (userId: string, itemId: string): boolean => {
      const session = storage.getSession();
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      
      if (session && item && session.id === userId) {
          if (session.points >= item.price) {
              session.points -= item.price;
              if (!session.inventory.includes(itemId)) {
                  session.inventory.push(itemId);
              }
              // Auto equip
              if (item.type === 'color') session.active_items.name_color = item.value;
              if (item.type === 'style' && item.value === 'bold') session.active_items.name_style = 'bold';
              if (item.type === 'badge') session.active_items.badge = item.value;
              
              storage.setSession(session);
              return true;
          }
      }
      return false;
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const allnotes: Notification[] = data ? JSON.parse(data) : [];
    return allnotes.filter(n => n.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification: (note: Partial<Notification>) => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const allnotes: Notification[] = data ? JSON.parse(data) : [];
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
  },

  markNotificationsRead: (userId: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) return;
    const allnotes: Notification[] = JSON.parse(data);
    const updated = allnotes.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  // Wiki
  getWikiPages: (): WikiPage[] => {
      const data = localStorage.getItem(STORAGE_KEYS.WIKI);
      return data ? JSON.parse(data) : [];
  },
  
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
  },

  // Chat
  getChatMessages: (): ChatMessage[] => {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      return data ? JSON.parse(data) : [];
  },

  sendChatMessage: (msg: ChatMessage) => {
      const msgs = storage.getChatMessages();
      msgs.push(msg);
      // Keep last 50
      if (msgs.length > 50) msgs.shift();
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(msgs));
  }
};
