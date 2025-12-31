import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, orderBy, limit, addDoc, deleteDoc,
  onSnapshot, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";
import { Post, Comment, Board, User, WikiPage, ChatMessage, AiLog, ShopItem, Notification, Conversation, PrivateMessage } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'item-1', name: 'Red Name', description: '아이디 색상을 빨간색으로 변경합니다.', price: 500, type: 'color', value: '#FF0000', icon: '🎨' },
  { id: 'item-2', name: 'Bold Name', description: '아이디를 굵게 표시합니다.', price: 800, type: 'style', value: 'bold', icon: '✨' },
  { id: 'item-3', name: 'King Badge', description: '아이디 옆에 왕관 배지를 달아줍니다.', price: 1000, type: 'badge', value: '👑', icon: '👑' },
  { id: 'item-4', name: 'Star Badge', description: '아이디 옆에 별 배지를 달아줍니다.', price: 300, type: 'badge', value: '⭐', icon: '⭐' },
  { id: 'item-5', name: 'Neon Blue', description: '아이디를 네온 블루 색상으로 변경합니다.', price: 1200, type: 'color', value: '#00f3ff', icon: '💎' },
];

const LOCAL_POSTS_KEY = 'ai_hub_posts_v4';
const LOCAL_USERS_KEY = 'ai_hub_users_v4';
const LOCAL_SESSION_KEY = 'ai_hub_session_v4';

// Helper to sanitize objects for Firestore
const sanitize = (data: any) => JSON.parse(JSON.stringify(data));

// Quest Logic
const getTodayString = () => new Date().toISOString().split('T')[0];

const checkDailyReset = (user: User): User => {
    const today = getTodayString();
    if (!user.quests || user.quests.last_updated !== today) {
        user.quests = {
            last_updated: today,
            daily_login: true, // If checked here, they logged in
            post_count: 0,
            comment_count: 0
        };
        // Give login reward if not already given today (handled in AuthContext ideally, but here for safety)
    }
    return user;
};

export const storage = {
  channel: new BroadcastChannel('ai_hub_sync'),

  getBoards: (): Board[] => [
    { id: 'free', slug: 'free', name: '자유 광장', description: '자유로운 소통 공간', categories: ['잡담', '질문', '인간성'] },
    { id: 'stock', slug: 'stock', name: '지식 허브', description: '실시간 글로벌 정보', categories: ['뉴스', '분석', '글로벌'] },
    { id: 'dev', slug: 'dev', name: '코드 넥서스', description: '기술과 미래 논의', categories: ['AI', 'WEB3', 'DEV'] },
  ],

  // --- Posts ---
  subscribePosts: (callback: (posts: Post[]) => void) => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
      callback(posts);
    });
  },

  getPosts: (): Post[] => {
    const p = localStorage.getItem(LOCAL_POSTS_KEY);
    return p ? JSON.parse(p) : [];
  },

  savePost: async (post: any) => {
    const data = { ...post, created_at: post.created_at || new Date().toISOString() };
    try {
      const docRef = await addDoc(collection(db, "posts"), sanitize(data));
      
      // Quest: Post Count
      const user = storage.getUserByRawId(post.author_id);
      if (user) {
          checkDailyReset(user);
          user.quests.post_count += 1;
          if (user.quests.post_count === 1) { // Reward for first post
              user.points += 30;
              await storage.sendNotification({
                  user_id: user.id, type: 'system', message: '일일 퀘스트 달성: 게시글 작성 (30P)', link: '/mypage'
              });
          }
          await storage.saveUser(user);
      }

      return { id: docRef.id, ...data };
    } catch (e) { console.error(e); return post; }
  },

  updatePost: async (post: Post) => {
    try {
      await updateDoc(doc(db, "posts", post.id), sanitize(post));
    } catch (e) {}
  },

  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (e) {}
  },

  // --- Comments & Notifications ---
  subscribeComments: (postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(collection(db, "comments"), where("post_id", "==", postId), orderBy("created_at", "asc"));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      callback(comments);
    });
  },

  getComments: (): Comment[] => {
    return []; 
  },

  saveComment: async (comment: Comment, postAuthorId: string) => {
    try {
      const docRef = await addDoc(collection(db, "comments"), sanitize(comment));
      
      if (postAuthorId !== comment.author_id) {
        await storage.sendNotification({
          user_id: postAuthorId,
          type: 'comment',
          message: `${comment.author.username}님이 게시글에 댓글을 남겼습니다.`,
          link: `/board/all/${comment.post_id}`,
          from_user: { username: comment.author.username, avatar_url: comment.author.avatar_url }
        });
      }

      // Quest: Comment Count
      const user = storage.getUserByRawId(comment.author_id);
      if (user) {
          checkDailyReset(user);
          user.quests.comment_count += 1;
          if (user.quests.comment_count === 3) { // Reward for 3rd comment
              user.points += 20;
               await storage.sendNotification({
                  user_id: user.id, type: 'system', message: '일일 퀘스트 달성: 댓글 작성 3회 (20P)', link: '/mypage'
              });
          }
          await storage.saveUser(user);
      }

      return { id: docRef.id, ...comment };
    } catch (e) { return comment; }
  },

  // --- Notifications (New) ---
  subscribeNotifications: (userId: string, callback: (notifs: Notification[]) => void) => {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const limitedNotifs = notifs.slice(0, 20);
      callback(limitedNotifs);
    });
  },

  sendNotification: async (data: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...data,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch(e) { console.error("Notif Error", e); }
  },

  markNotificationAsRead: async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { is_read: true });
    } catch(e) {}
  },

  markAllNotificationsAsRead: async (userId: string) => {
    try {
        const q = query(collection(db, "notifications"), where("user_id", "==", userId), where("is_read", "==", false));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
            batch.update(d.ref, { is_read: true });
        });
        await batch.commit();
    } catch(e) {}
  },

  // --- Private Messages (New) ---
  subscribeConversations: (userId: string, callback: (convs: Conversation[]) => void) => {
    const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      convs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      callback(convs);
    });
  },

  subscribeMessages: (conversationId: string, callback: (msgs: PrivateMessage[]) => void) => {
    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy("created_at", "asc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrivateMessage));
      callback(msgs);
    });
  },

  getOrCreateConversation: async (myId: string, targetId: string): Promise<string> => {
    const q = query(collection(db, "conversations"), where("participants", "array-contains", myId));
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => {
        const data = d.data() as Conversation;
        return data.participants.includes(targetId);
    });

    if (existing) return existing.id;

    const newConv = await addDoc(collection(db, "conversations"), {
        participants: [myId, targetId],
        last_message: '대화가 시작되었습니다.',
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_counts: { [myId]: 0, [targetId]: 0 }
    });
    return newConv.id;
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, targetId: string) => {
    const timestamp = new Date().toISOString();
    
    await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        created_at: timestamp,
        is_read: false
    });

    await updateDoc(doc(db, "conversations", conversationId), {
        last_message: content,
        last_message_at: timestamp,
        updated_at: timestamp,
        [`unread_counts.${targetId}`]: 1 
    });

    await storage.sendNotification({
        user_id: targetId,
        type: 'message',
        message: '새로운 메시지가 도착했습니다.',
        link: '/messages',
        from_user: { username: '알림', avatar_url: '' }
    });
  },

  // --- Users & Shop ---
  getUsers: (): User[] => {
    const u = localStorage.getItem(LOCAL_USERS_KEY);
    return u ? JSON.parse(u) : [];
  },
  
  getUser: (username: string): User | undefined => {
      return storage.getUsers().find(u => u.username === username);
  },

  getUserByRawId: (id: string): User | undefined => {
      return storage.getUsers().find(u => u.id === id);
  },

  saveUser: async (user: User) => {
    try {
      await setDoc(doc(db, "users", user.username), sanitize(user));
    } catch (e) {}
    
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.username === user.username);
    if (idx !== -1) users[idx] = user;
    else users.push(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    storage.channel.postMessage({ type: 'USER_UPDATE' });
  },

  deleteUser: async (userId: string) => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(newUsers));
    
    if (user) {
        try {
            await deleteDoc(doc(db, "users", user.username));
        } catch(e) {}
    }
    
    storage.channel.postMessage({ type: 'USER_UPDATE' });
  },

  blockUser: async (userId: string, targetId: string) => {
      const users = storage.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          if (!user.blocked_users) user.blocked_users = [];
          if (!user.blocked_users.includes(targetId)) {
              user.blocked_users.push(targetId);
              await storage.saveUser(user);
          }
      }
  },

  addExp: async (userId: string, amount: number) => {
      const users = storage.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          user.exp += amount;
          if (user.exp >= user.level * 100) {
              user.exp -= user.level * 100;
              user.level += 1;
               await storage.sendNotification({
                  user_id: user.id,
                  type: 'level_up',
                  message: `축하합니다! 레벨 ${user.level}로 상승했습니다!`,
                  link: '/mypage',
                  from_user: { username: 'System', avatar_url: '' }
              });
          }
          await storage.saveUser(user);
          const session = storage.getSession();
          if (session && session.id === userId) {
             storage.setSession(user);
          }
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

  toggleScrap: async (userId: string, postId: string) => {
      const user = storage.getUserByRawId(userId);
      if (user) {
          if (!user.scrapped_posts) user.scrapped_posts = [];
          
          if (user.scrapped_posts.includes(postId)) {
              user.scrapped_posts = user.scrapped_posts.filter(id => id !== postId);
          } else {
              user.scrapped_posts.push(postId);
          }
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
    return undefined;
  },

  // --- Session & Chat ---
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
  
  saveAiLog: async (action: any, target_id: string, detail: string) => {
      const logData = { id: `log-${Date.now()}`, action, target_id, detail, timestamp: new Date().toISOString() };
      const logs = storage.getAiLogs();
      logs.push(logData);
      localStorage.setItem('ai_hub_ai_logs', JSON.stringify(logs.slice(-100)));
      try {
        await addDoc(collection(db, "ai_logs"), sanitize(logData));
      } catch (e) {}
  },

  getBotUser: (type: string = 'ai_manager'): User => {
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
      blocked_users: [],
      scrapped_posts: [],
      quests: { last_updated: getTodayString(), daily_login: true, post_count: 0, comment_count: 0 }
    };
  }
};