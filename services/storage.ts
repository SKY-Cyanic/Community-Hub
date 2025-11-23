import { Post, Comment, Board, User, Notification } from '../types';

const STORAGE_KEYS = {
  POSTS: 'k_community_posts',
  COMMENTS: 'k_community_comments',
  USERS: 'k_community_users',
  SESSION: 'k_community_session',
  NOTIFICATIONS: 'k_community_notifications',
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
  email: 'admin@k-hub.com'
};

// Utility to generate fake IP
const generateFakeIP = () => {
  const p1 = Math.floor(Math.random() * 255);
  const p2 = Math.floor(Math.random() * 255);
  return `${p1}.${p2}.***.***`;
};

// EXP Table: Level N requires N * 100 EXP
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
    // Add IP if missing
    if (!post.ip_addr) post.ip_addr = generateFakeIP();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Grant EXP to Author
    storage.addExp(post.author_id, 10); // 10 EXP for posting
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
    
    // Update post comment count
    const posts = storage.getPosts();
    const postIndex = posts.findIndex(p => p.id === comment.post_id);
    let postAuthorId = '';
    
    if (postIndex !== -1) {
      posts[postIndex].comment_count += 1;
      postAuthorId = posts[postIndex].author_id;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    // Grant EXP
    storage.addExp(comment.author_id, 2); // 2 EXP for commenting

    // Create Notification for Post Author (if not self)
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
    // 1. Update Session if it's the current user
    const session = storage.getSession();
    if (session && session.id === userId) {
      session.exp += amount;
      session.level = getLevel(session.exp);
      storage.setSession(session);
    }
    // 2. In a real app, update the users database too. 
    // Since we don't have a full user DB in this mock, we rely on session for current user.
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
  }
};
