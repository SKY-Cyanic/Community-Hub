
import { 
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, increment, arrayUnion, limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post, Board, Comment, User, WikiPage, ShopItem } from '../types';
import { SHOP_ITEMS } from './storage'; // 아이템 목록은 정적이므로 가져옴

export const api = {
  // --- Boards ---
  getBoards: async (): Promise<Board[]> => {
    // Boards are static for now, but could be in DB
    return [
      { id: '1', slug: 'free', name: '자유게시판', description: '자유롭게 이야기를 나누는 공간입니다.', categories: ['잡담', '질문', '후기'] },
      { id: '2', slug: 'humor', name: '유머게시판', description: '오늘의 유머 모음', categories: ['유머', '감동', '이슈'] },
      { id: '3', slug: 'dev', name: '개발자게시판', description: '코딩과 기술 이야기', categories: ['질문', '팁', '채용', '프로젝트'] },
      { id: '4', slug: 'stock', name: '주식게시판', description: '성투를 기원합니다', categories: ['국장', '미장', '코인', '뉴스'] },
    ];
  },

  // --- Posts ---
  getPosts: async (boardSlug?: string, page: number = 1): Promise<Post[]> => {
    try {
      let q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
      
      if (boardSlug && boardSlug !== 'all' && boardSlug !== 'best') {
        q = query(collection(db, 'posts'), where('board_id', '==', boardSlug), orderBy('created_at', 'desc'));
      } else if (boardSlug === 'best') {
        q = query(collection(db, 'posts'), where('is_hot', '==', true), orderBy('created_at', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    } catch (e) {
      console.error("Error getting posts:", e);
      return [];
    }
  },

  getPost: async (postId: string): Promise<Post | null> => {
    try {
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // View Count Increment (Client side simplistic approach)
        updateDoc(docRef, { view_count: increment(1) });
        return { id: docSnap.id, ...docSnap.data() } as Post;
      }
      return null;
    } catch (e) {
      console.error("Error getting post:", e);
      return null;
    }
  },

  createPost: async (postData: Partial<Post>, user: User): Promise<Post> => {
    const newPostData = {
      board_id: postData.board_id || 'free',
      author_id: user.id,
      title: postData.title || '무제',
      content: postData.content || '',
      view_count: 0,
      upvotes: 0,
      downvotes: 0,
      liked_users: [],
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        created_at: new Date().toISOString(),
        level: user.level,
        active_items: user.active_items,
        is_admin: user.is_admin || false
      },
      comment_count: 0,
      is_hot: false,
      has_image: (postData.images && postData.images.length > 0) || false,
      images: postData.images || [],
      poll: postData.poll || null,
      ip_addr: '127.0.0.1' // In real app, server adds this
    };

    const docRef = await addDoc(collection(db, 'posts'), newPostData);
    
    // Give EXP
    await api.addExp(user.id, 10);

    return { id: docRef.id, ...newPostData } as Post;
  },
  
  deletePost: async (postId: string): Promise<void> => {
    await deleteDoc(doc(db, 'posts', postId));
  },

  votePost: async (postId: string, type: 'up' | 'down', userId: string): Promise<boolean> => {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const data = postSnap.data() as Post;
      if (data.liked_users && data.liked_users.includes(userId)) {
        return false;
      }

      await updateDoc(postRef, {
        upvotes: type === 'up' ? increment(1) : increment(0),
        downvotes: type === 'down' ? increment(1) : increment(0),
        liked_users: arrayUnion(userId)
      });
      return true;
    }
    return false;
  },

  // --- Comments ---
  getComments: async (postId: string): Promise<Comment[]> => {
    const q = query(collection(db, 'comments'), where('post_id', '==', postId), orderBy('created_at', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  },

  createComment: async (postId: string, content: string, user: User, parentId: string | null = null): Promise<Comment> => {
    const newComment = {
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      content: content,
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        created_at: new Date().toISOString(),
        level: user.level,
        active_items: user.active_items,
        is_admin: user.is_admin || false
      },
      depth: 0 // Calculated on render usually
    };

    const docRef = await addDoc(collection(db, 'comments'), newComment);
    
    // Update Post Comment Count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { comment_count: increment(1) });

    // Give EXP
    await api.addExp(user.id, 2);

    return { id: docRef.id, ...newComment } as Comment;
  },

  // --- Users ---
  getUser: async (userId: string): Promise<User | null> => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as User) : null;
  },
  
  getUsers: async (): Promise<User[]> => {
     const snapshot = await getDocs(collection(db, 'users'));
     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  createUser: async (user: User): Promise<void> => {
    await setDoc(doc(db, 'users', user.id), user);
  },
  
  deleteUser: async (userId: string): Promise<void> => {
      await deleteDoc(doc(db, 'users', userId));
  },

  blockUser: async (myId: string, targetId: string): Promise<void> => {
      const userRef = doc(db, 'users', myId);
      await updateDoc(userRef, {
          blocked_users: arrayUnion(targetId)
      });
  },

  addExp: async (userId: string, amount: number): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()) {
        const currentExp = (userSnap.data().exp || 0) + amount;
        const currentLevel = Math.floor(currentExp / 100) + 1;
        await updateDoc(userRef, {
            exp: currentExp,
            points: increment(amount),
            level: currentLevel
        });
    }
  },

  // --- Shop ---
  buyItem: async (userId: string, itemId: string): Promise<boolean> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    const userData = userSnap.data() as User;
    
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    if (userData.inventory && userData.inventory.includes(itemId)) return false;
    if (userData.points < item.price) return false;

    const updates: any = {
        points: increment(-item.price),
        inventory: arrayUnion(itemId),
        active_items: { ...userData.active_items }
    };

    // Auto Equip
    if (item.type === 'color') updates.active_items.name_color = item.value;
    if (item.type === 'style' && item.value === 'bold') updates.active_items.name_style = 'bold';
    if (item.type === 'badge') updates.active_items.badge = item.value;

    await updateDoc(userRef, updates);
    return true;
  },

  // --- Wiki ---
  getWikiPage: async (slug: string): Promise<WikiPage | undefined> => {
      const docRef = doc(db, 'wiki', slug);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as WikiPage) : undefined;
  },
  
  getWikiPages: async (): Promise<WikiPage[]> => {
      const snapshot = await getDocs(collection(db, 'wiki'));
      return snapshot.docs.map(d => d.data() as WikiPage);
  },
  
  saveWikiPage: async (page: WikiPage): Promise<void> => {
      await setDoc(doc(db, 'wiki', page.slug), page);
  }
};
