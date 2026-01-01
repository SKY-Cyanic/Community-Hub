
import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, orderBy, limit, addDoc, deleteDoc,
  onSnapshot, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";
import { Post, Comment, Board, User, WikiPage, ChatMessage, AiLog, ShopItem, Notification, Conversation, PrivateMessage, Achievement, AuctionItem, BalanceGame, FactCheckReport } from '../types';

export const NODE_GAS_FEE = 10;

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'item-1', name: 'Red Name', description: '아이디 색상을 빨간색으로 변경합니다.', price: 500, type: 'color', value: '#FF0000', icon: '🎨' },
  { id: 'item-2', name: 'Bold Name', description: '아이디를 굵게 표시합니다.', price: 800, type: 'style', value: 'bold', icon: '✨' },
  { id: 'item-3', name: 'King Badge', description: '아이디 옆에 왕관 배지를 달아줍니다.', price: 1000, type: 'badge', value: '👑', icon: '👑' },
  { id: 'item-5', name: 'Cyberpunk Theme', description: 'UI를 사이버펑크 핑크 테마로 변경합니다.', price: 3000, type: 'theme', value: 'cyberpunk', icon: '🌌' },
  { id: 'item-6', name: 'Retro Theme', description: 'UI를 고전 터미널 스타일로 변경합니다.', price: 2500, type: 'theme', value: 'retro', icon: '📠' },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'early_bird', name: '얼리 어답터', description: '첫 게시글을 작성했습니다.', icon: '🐣', condition: 'post_count >= 1', reward_points: 100 },
  { id: 'intel_agent', name: '정보 요원', description: '댓글 50개를 작성하여 Deep Web 접근 권한을 획득했습니다.', icon: '🕵️', condition: 'comment_count >= 50', reward_points: 1000 },
  { id: 'night_owl', name: '새벽의 전령', description: '새벽 2시~5시 사이에 글을 썼습니다.', icon: '🦉', condition: 'time_window', reward_points: 200 },
  { id: 'streak_5', name: '신뢰의 링크', description: '5일 연속 접속을 달성했습니다.', icon: '🔥', condition: 'attendance_streak >= 5', reward_points: 500 },
];

const LOCAL_SESSION_KEY = 'ai_hub_session_v4';
const LOCAL_USERS_KEY = 'ai_hub_users_v4';
const LOCAL_POSTS_KEY = 'ai_hub_posts_v4';
const LOCAL_COMMENTS_KEY = 'ai_hub_comments_v4';

const sanitize = (data: any) => JSON.parse(JSON.stringify(data));

export const storage = {
  channel: new BroadcastChannel('ai_hub_sync'),

  getSession: (): User | null => {
    const s = localStorage.getItem(LOCAL_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  },

  setSession: (u: User | null) => {
    if (u) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_SESSION_KEY);
    storage.channel.postMessage({ type: 'SESSION_UPDATE' });
  },

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

  // --- Fact Check Report ---
  reportAiError: async (report: FactCheckReport) => {
      try {
          await addDoc(collection(db, "fact_reports"), sanitize(report));
          await storage.sendNotification({
              user_id: report.reporter_id,
              type: 'system',
              message: 'AI 오류 제보가 접수되었습니다. 검토 후 보상이 지급됩니다.',
              link: '/mypage'
          });
          return true;
      } catch (e) { return false; }
  },

  // --- Achievements ---
  checkAchievements: async (userId: string) => {
    const user = storage.getUserByRawId(userId);
    if (!user) return;
    
    const newAchievements: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (user.achievements.includes(ach.id)) continue;
      
      let isEligible = false;
      if (ach.id === 'early_bird' && user.quests.post_count >= 1) isEligible = true;
      if (ach.id === 'intel_agent' && user.quests.comment_count >= 50) isEligible = true;
      if (ach.id === 'streak_5' && user.attendance_streak >= 5) isEligible = true;
      if (ach.id === 'night_owl') {
          const hour = new Date().getHours();
          if (hour >= 2 && hour <= 5) isEligible = true;
      }

      if (isEligible) {
        user.achievements.push(ach.id);
        user.points += ach.reward_points;
        newAchievements.push(ach.name);
        await storage.sendNotification({
          user_id: user.id,
          type: 'achievement',
          message: `히든 업적 해제: [${ach.name}] - ${ach.reward_points}P 획득!`,
          link: '/mypage'
        });
      }
    }

    if (newAchievements.length > 0) {
      await storage.saveUser(user);
      if (storage.getSession()?.id === userId) storage.setSession(user);
    }
  },

  getBoards: (): Board[] => [
    { id: 'free', slug: 'free', name: '자유 광장', description: '자유로운 소통 공간', categories: ['잡담', '질문', '인간성'] },
    { id: 'stock', slug: 'stock', name: '지식 허브', description: '실시간 글로벌 정보', categories: ['뉴스', '분석', '글로벌'] },
    { id: 'dev', slug: 'dev', name: '코드 넥서스', description: '기술과 미래 논의', categories: ['AI', 'WEB3', 'DEV'] },
    { id: 'deepweb', slug: 'deepweb', name: 'DEEP WEB', description: '검증된 요원들만 접근 가능한 비밀 노드', categories: ['기밀', '익명', '누설'], required_achievement: 'intel_agent' },
  ],

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
    const user = storage.getUserByRawId(post.author_id);
    if (!user) return null;

    // 가스비 소모 체크
    if (user.points < NODE_GAS_FEE) {
        throw new Error('포인트(가스비)가 부족합니다. 최소 10P가 필요합니다.');
    }

    user.points -= NODE_GAS_FEE;
    user.quests.post_count += 1;
    
    const data = { ...post, created_at: post.created_at || new Date().toISOString() };
    try {
      const docRef = await addDoc(collection(db, "posts"), sanitize(data));
      await storage.saveUser(user);
      if (storage.getSession()?.id === user.id) storage.setSession(user);
      await storage.checkAchievements(user.id);
      return { id: docRef.id, ...data };
    } catch (e) { return null; }
  },

  updatePost: async (post: Post) => { try { await updateDoc(doc(db, "posts", post.id), sanitize(post)); } catch (e) {} },
  deletePost: async (postId: string) => { try { await deleteDoc(doc(db, "posts", postId)); } catch (e) {} },
  
  getComments: (): Comment[] => {
    const c = localStorage.getItem(LOCAL_COMMENTS_KEY);
    return c ? JSON.parse(c) : [];
  },

  subscribeComments: (postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(collection(db, "comments"), where("post_id", "==", postId), orderBy("created_at", "asc"));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      const allCached = storage.getComments().filter(c => c.post_id !== postId);
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify([...allCached, ...comments]));
      callback(comments);
    });
  },

  saveComment: async (comment: Comment, postAuthorId: string) => {
    try {
      const docRef = await addDoc(collection(db, "comments"), sanitize(comment));
      const user = storage.getUserByRawId(comment.author_id);
      if (user) {
          user.quests.comment_count += 1;
          await storage.saveUser(user);
          await storage.checkAchievements(user.id);
      }
      if (postAuthorId !== comment.author_id) {
        await storage.sendNotification({
          user_id: postAuthorId, type: 'comment', message: `${comment.author.username}님이 댓글을 남겼습니다.`,
          link: `/board/all/${comment.post_id}`
        });
      }
      return { id: docRef.id, ...comment };
    } catch (e) { return comment; }
  },

  subscribeNotifications: (userId: string, callback: (notifs: Notification[]) => void) => {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      callback(notifs.slice(0, 20));
    });
  },

  sendNotification: async (data: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    try { await addDoc(collection(db, "notifications"), { ...data, is_read: false, created_at: new Date().toISOString() }); } catch(e) {}
  },

  markNotificationAsRead: async (notifId: string) => { try { await updateDoc(doc(db, "notifications", notifId), { is_read: true }); } catch(e) {} },

  markAllNotificationsAsRead: async (userId: string) => {
    try {
        const q = query(collection(db, "notifications"), where("user_id", "==", userId), where("is_read", "==", false));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.update(d.ref, { is_read: true }));
        await batch.commit();
    } catch(e) {}
  },

  processAttendance: async (userId: string) => {
    const user = storage.getUserByRawId(userId);
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    if (user.last_attendance_date === today) return;

    const lastDate = new Date(user.last_attendance_date);
    const diff = (new Date(today).getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

    if (diff === 1) user.attendance_streak += 1;
    else user.attendance_streak = 1;

    user.last_attendance_date = today;
    user.points += 10;
    user.quests.daily_login = true;
    await storage.saveUser(user);
    await storage.checkAchievements(userId);
  },

  getAuctionItems: (): AuctionItem[] => [{ 
    id: 'auc-1', item_name: '골드 네온 칭호', description: '채팅창에서 반짝이는 특수 효과', 
    start_price: 5000, current_price: 7200, end_time: new Date(Date.now() + 3600000).toISOString(),
    is_finished: false, highest_bidder_name: 'AI_Master'
  }],

  getBalanceGame: (): BalanceGame => ({
    id: 'daily-bal', question: '평생 하나만 먹는다면?', option_a: '치킨 (평생 무료)', option_b: '피자 (평생 무료)',
    votes_a: 124, votes_b: 98
  }),

  voteBalance: async (userId: string, option: 'a' | 'b') => {
    const user = storage.getUserByRawId(userId);
    if (user && !user.quests.balance_voted) {
      user.quests.balance_voted = true;
      user.points += 5;
      user.exp += 10;
      await storage.saveUser(user);
      return true;
    }
    return false;
  },

  buyItem: async (userId: string, itemId: string): Promise<boolean> => {
    const user = storage.getUserByRawId(userId);
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (user && item && user.points >= item.price && !user.inventory.includes(itemId)) {
      user.points -= item.price;
      user.inventory.push(itemId);
      if (item.type === 'color') user.active_items.name_color = item.value;
      if (item.type === 'style') user.active_items.name_style = item.value as any;
      if (item.type === 'badge') user.active_items.badge = item.value;
      if (item.type === 'theme') user.active_items.theme = item.value;
      await storage.saveUser(user);
      return true;
    }
    return false;
  },

  toggleScrap: async (userId: string, postId: string) => {
    const user = storage.getUserByRawId(userId);
    if (user) {
        if (!user.scrapped_posts) user.scrapped_posts = [];
        user.scrapped_posts = user.scrapped_posts.includes(postId) ? user.scrapped_posts.filter(id => id !== postId) : [...user.scrapped_posts, postId];
        await storage.saveUser(user);
        return true;
    }
    return false;
  },

  blockUser: async (userId: string, targetId: string) => {
    const user = storage.getUserByRawId(userId);
    if (user) {
      if (!user.blocked_users) user.blocked_users = [];
      if (!user.blocked_users.includes(targetId)) {
        user.blocked_users.push(targetId);
        await storage.saveUser(user);
      }
    }
  },

  getWikiPage: async (slug: string): Promise<WikiPage | undefined> => {
    try { const snap = await getDoc(doc(db, "wiki", slug)); if (snap.exists()) return snap.data() as WikiPage; } catch (e) {}
    return undefined;
  },

  // Added getWikiPages method to fix "Property 'getWikiPages' does not exist" errors
  getWikiPages: (): WikiPage[] => {
    // Returns empty array as a placeholder for synchronous calls
    return [];
  },

  saveWikiPage: async (page: WikiPage) => { try { await setDoc(doc(db, "wiki", page.slug), sanitize(page)); } catch (e) {} },

  getChatMessages: (): ChatMessage[] => { const m = localStorage.getItem('ai_hub_chat_messages'); return m ? JSON.parse(m) : []; },

  sendChatMessage: (msg: ChatMessage) => {
    const msgs = storage.getChatMessages(); msgs.push(msg); if (msgs.length > 50) msgs.shift();
    localStorage.setItem('ai_hub_chat_messages', JSON.stringify(msgs));
    storage.channel.postMessage({ type: 'CHAT_UPDATE' });
  },

  getAiLogs: (): AiLog[] => { const l = localStorage.getItem('ai_hub_ai_logs'); return l ? JSON.parse(l) : []; },

  subscribeConversations: (userId: string, callback: (convs: Conversation[]) => void) => {
    const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      callback(convs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
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
    const existing = snapshot.docs.find(d => (d.data() as Conversation).participants.includes(targetId));
    if (existing) return existing.id;
    const newConv = await addDoc(collection(db, "conversations"), {
        participants: [myId, targetId], last_message: '대화 시작', last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), unread_counts: { [myId]: 0, [targetId]: 0 }
    });
    return newConv.id;
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, targetId: string) => {
    const ts = new Date().toISOString();
    await addDoc(collection(db, `conversations/${conversationId}/messages`), { conversation_id: conversationId, sender_id: senderId, content, created_at: ts, is_read: false });
    await updateDoc(doc(db, "conversations", conversationId), { last_message: content, last_message_at: ts, updated_at: ts, [`unread_counts.${targetId}`]: 1 });
  },

  deleteUser: async (userId: string) => {
    const user = storage.getUserByRawId(userId);
    if (user) {
      try { await deleteDoc(doc(db, "users", user.username)); } catch (e) {}
    }
  },
};