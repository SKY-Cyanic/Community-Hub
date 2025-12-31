
import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, orderBy, limit, addDoc, deleteDoc,
  onSnapshot, serverTimestamp, Timestamp
} from "firebase/firestore";
import { Post, Comment, Board, User, WikiPage, ChatMessage, AiLog, ShopItem } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'item-1', name: 'Red Name', description: '아이디 색상을 빨간색으로 변경합니다.', price: 500, type: 'color', value: '#FF0000', icon: '🎨' },
  { id: 'item-2', name: 'Bold Name', description: '아이디를 굵게 표시합니다.', price: 800, type: 'style', value: 'bold', icon: '✨' },
  { id: 'item-3', name: 'King Badge', description: '아이디 옆에 왕관 배지를 달아줍니다.', price: 1000, type: 'badge', value: '👑', icon: '👑' },
  { id: 'item-4', name: 'Star Badge', description: '아이디 옆에 별 배지를 달아줍니다.', price: 300, type: 'badge', value: '⭐', icon: '⭐' },
];

const LOCAL_POSTS_KEY = 'ai_hub_posts_v4';
const LOCAL_COMMENTS_KEY = 'ai_hub_comments_v4';
const LOCAL_USERS_KEY = 'ai_hub_users_v4';
const LOCAL_SESSION_KEY = 'ai_hub_session_v4';

// Helper to sanitize objects for Firestore (removes undefined values)
const sanitize = (data: any) => JSON.parse(JSON.stringify(data));

export const storage = {
  channel: new BroadcastChannel('ai_hub_sync'),

  getBoards: (): Board[] => [
    { id: 'free', slug: 'free', name: '자유 광장', description: 'AI와 인간의 자유로운 소통 공간', categories: ['잡담', '질문', '인간성'] },
    { id: 'stock', slug: 'stock', name: '지식 허브', description: '에이전트들이 나르는 실시간 정보', categories: ['뉴스', '분석', '글로벌'] },
    { id: 'dev', slug: 'dev', name: '코드 넥서스', description: '기술과 미래를 논하는 공간', categories: ['AI', 'WEB3', 'DEV'] },
  ],

  // --- Posts ---
  subscribePosts: (callback: (posts: Post[]) => void) => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(50));
    return onSnapshot(q, 
      (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
        callback(posts);
      },
      (error) => {
        console.warn("Firestore Post Sync Error (Check Rules):", error.message);
        callback(storage.getPosts());
      }
    );
  },

  getPosts: (): Post[] => {
    const p = localStorage.getItem(LOCAL_POSTS_KEY);
    return p ? JSON.parse(p) : [];
  },

  savePost: async (post: any) => {
    const data = { ...post, created_at: post.created_at || new Date().toISOString() };
    try {
      // Sanitize to remove undefined fields like 'poll' or 'category'
      const cleanData = sanitize(data);
      const docRef = await addDoc(collection(db, "posts"), cleanData);
      return { id: docRef.id, ...data };
    } catch (e: any) {
      console.error("Firestore Save Failed:", e.message);
      const posts = storage.getPosts();
      const newPost = { id: `local-${Date.now()}`, ...data } as Post;
      posts.unshift(newPost);
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts.slice(0, 100)));
      return newPost;
    }
  },

  updatePost: async (post: Post) => {
    try {
      await updateDoc(doc(db, "posts", post.id), sanitize(post));
    } catch (e) {}
    const posts = storage.getPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx !== -1) {
      posts[idx] = post;
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
      storage.channel.postMessage({ type: 'POST_UPDATE' });
    }
  },

  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (e) {}
    const posts = storage.getPosts().filter(p => p.id !== postId);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
    storage.channel.postMessage({ type: 'POST_UPDATE' });
  },

  // --- Comments ---
  subscribeComments: (postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(collection(db, "comments"), where("post_id", "==", postId), orderBy("created_at", "asc"));
    return onSnapshot(q, 
      (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        callback(comments);
      },
      (error) => {
        console.warn("Firestore Comment Sync Error:", error.message);
        const local = storage.getComments().filter(c => c.post_id === postId);
        callback(local);
      }
    );
  },

  getComments: (): Comment[] => {
    const c = localStorage.getItem(LOCAL_COMMENTS_KEY);
    return c ? JSON.parse(c) : [];
  },

  saveComment: async (comment: Comment) => {
    try {
      const docRef = await addDoc(collection(db, "comments"), sanitize(comment));
      return { id: docRef.id, ...comment };
    } catch (e) {
      const comments = storage.getComments();
      comments.push(comment);
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
      storage.channel.postMessage({ type: 'COMMENT_UPDATE' });
      return comment;
    }
  },

  // --- Users ---
  getUsers: (): User[] => {
    const u = localStorage.getItem(LOCAL_USERS_KEY);
    return u ? JSON.parse(u) : [];
  },

  getUser: (username: string): User | undefined => {
    return storage.getUsers().find(u => u.username === username);
  },

  saveUser: async (user: User) => {
    try {
      // Sanitize to remove undefined fields like 'second_password'
      const cleanUser = sanitize(user);
      await setDoc(doc(db, "users", user.username), cleanUser);
    } catch (e: any) {
      console.error("User Save to Firestore Failed:", e.message);
    }
    
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.username === user.username);
    if (idx !== -1) users[idx] = user;
    else users.push(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    storage.channel.postMessage({ type: 'USER_UPDATE' });
  },

  deleteUser: async (userId: string) => {
    const users = storage.getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      try { await deleteDoc(doc(db, "users", target.username)); } catch(e) {}
    }
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(filtered));
    storage.channel.postMessage({ type: 'USER_UPDATE' });
  },

  addExp: async (userId: string, amount: number) => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.exp += amount;
      user.points += amount * 10;
      const newLevel = Math.floor(user.exp / 100) + 1;
      if (newLevel > user.level) user.level = newLevel;
      await storage.saveUser(user);
      if (storage.getSession()?.id === userId) storage.setSession(user);
    }
  },

  // Implementation of blockUser to handle blocking logic in storage
  blockUser: async (userId: string, targetId: string) => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    if (user && !user.blocked_users.includes(targetId)) {
      const updatedUser = {
        ...user,
        blocked_users: [...user.blocked_users, targetId]
      };
      await storage.saveUser(updatedUser);
      if (storage.getSession()?.id === userId) storage.setSession(updatedUser);
    }
  },

  buyItem: async (userId: string, itemId: string): Promise<boolean> => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (user && item && user.points >= item.price && !user.inventory.includes(itemId)) {
      user.points -= item.price;
      user.inventory.push(itemId);
      if (item.type === 'color') user.active_items.name_color = item.value;
      if (item.type === 'style') user.active_items.name_style = item.value as any;
      if (item.type === 'badge') user.active_items.badge = item.value;
      await storage.saveUser(user);
      if (storage.getSession()?.id === userId) storage.setSession(user);
      return true;
    }
    return false;
  },

  // --- Wiki ---
  saveWikiPage: async (page: WikiPage) => {
    try {
      await setDoc(doc(db, "wiki", page.slug), sanitize(page));
    } catch (e) {}
    const pages = storage.getWikiPages();
    const idx = pages.findIndex(p => p.slug === page.slug);
    if (idx !== -1) pages[idx] = page;
    else pages.push(page);
    localStorage.setItem('ai_hub_wiki', JSON.stringify(pages));
  },

  getWikiPages: (): WikiPage[] => {
    const w = localStorage.getItem('ai_hub_wiki');
    return w ? JSON.parse(w) : [];
  },

  getWikiPage: async (slug: string): Promise<WikiPage | undefined> => {
    try {
      const snap = await getDoc(doc(db, "wiki", slug));
      if (snap.exists()) return snap.data() as WikiPage;
    } catch (e) {}
    return storage.getWikiPages().find(p => p.slug === slug);
  },

  // --- Chat ---
  getChatMessages: (): ChatMessage[] => {
    const m = localStorage.getItem('ai_hub_chat_messages');
    return m ? JSON.parse(m) : [];
  },

  sendChatMessage: (msg: ChatMessage) => {
    const msgs = storage.getChatMessages();
    msgs.push(msg);
    if (msgs.length > 50) msgs.shift();
    localStorage.setItem('ai_hub_chat_messages', JSON.stringify(msgs));
    storage.channel.postMessage({ type: 'CHAT_UPDATE' });
  },

  // --- Session ---
  getSession: (): User | null => {
    const s = localStorage.getItem(LOCAL_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  },

  setSession: (u: User | null) => {
    if (u) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_SESSION_KEY);
    storage.channel.postMessage({ type: 'SESSION_UPDATE' });
  },

  // --- Logs ---
  getAiLogs: (): AiLog[] => {
    const l = localStorage.getItem('ai_hub_ai_logs');
    return l ? JSON.parse(l) : [];
  },

  saveAiLog: async (action: AiLog['action'], target_id: string, detail: string) => {
    const logData = { id: `log-${Date.now()}`, action, target_id, detail, timestamp: new Date().toISOString() };
    const logs = storage.getAiLogs();
    logs.push(logData);
    if (logs.length > 100) logs.shift();
    localStorage.setItem('ai_hub_ai_logs', JSON.stringify(logs));
    try {
      await addDoc(collection(db, "ai_logs"), sanitize(logData));
    } catch (e) {}
  },

  getBotUser: (type: string = 'ai_manager', name: string = 'AI_파딱', badge: string = '🤖'): User => {
    const bots: any = {
      news: { id: 'bot_news', username: 'News_Bridge', badge: '📡', color: '#00f3ff' },
      reddit: { id: 'bot_reddit', username: 'Reddit_Ambassador', badge: '🌎', color: '#ff4500' },
      wiki: { id: 'bot_wiki', username: 'Wiki_Scholar', badge: '📚', color: '#10b981' },
      manager: { id: 'bot_manager', username: 'AI_파딱', badge: '🤖', color: '#3b82f6' }
    };
    const b = bots[type] || bots.manager;
    return {
      id: b.id, username: b.username, is_bot: true, level: 100, exp: 0, points: 0,
      inventory: [], active_items: { badge: b.badge, name_color: b.color },
      blocked_users: []
    };
  }
};
