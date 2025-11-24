
import { Board, ShopItem, Notification, ChatMessage } from '../types';

// DB Logic moved to api.ts (Firebase).
// This file now only holds static data and local session preferences.

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'color_blue', name: '닉네임: 블루', description: '닉네임을 파란색으로 변경합니다.', price: 100, type: 'color', value: '#3b82f6', icon: '🎨' },
  { id: 'color_green', name: '닉네임: 그린', description: '닉네임을 초록색으로 변경합니다.', price: 100, type: 'color', value: '#22c55e', icon: '🎨' },
  { id: 'style_bold', name: '닉네임: 굵게', description: '닉네임을 굵게 표시합니다.', price: 200, type: 'style', value: 'bold', icon: 'B' },
  { id: 'badge_star', name: '별 배지', description: '닉네임 옆에 별 배지를 답니다.', price: 500, type: 'badge', value: '⭐', icon: '🎖️' },
  { id: 'badge_dia', name: '다이아 배지', description: '닉네임 옆에 다이아 배지를 답니다.', price: 1000, type: 'badge', value: '💎', icon: '🎖️' },
];

// Broadcast Channel is kept for purely local UI sync if needed, but Firestore handles data sync now.
export const channel = new BroadcastChannel('k_community_sync');

export const storage = {
  channel,

  // Static Boards
  getBoards: (): Board[] => [
      { id: '1', slug: 'free', name: '자유게시판', description: '자유롭게 이야기를 나누는 공간입니다.', categories: ['잡담', '질문', '후기'] },
      { id: '2', slug: 'humor', name: '유머게시판', description: '오늘의 유머 모음', categories: ['유머', '감동', '이슈'] },
      { id: '3', slug: 'dev', name: '개발자게시판', description: '코딩과 기술 이야기', categories: ['질문', '팁', '채용', '프로젝트'] },
      { id: '4', slug: 'stock', name: '주식게시판', description: '성투를 기원합니다', categories: ['국장', '미장', '코인', '뉴스'] },
  ],

  // Notifications (Local Only for demo simplicity, or move to Firestore if desired)
  getNotifications: (userId: string): Notification[] => {
    const all = localStorage.getItem('k_community_notifications');
    const parsed: Notification[] = all ? JSON.parse(all) : [];
    return parsed.filter(n => n.user_id === userId);
  },

  markNotificationsRead: (userId: string) => {
    const all = localStorage.getItem('k_community_notifications');
    if(!all) return;
    const parsed: Notification[] = JSON.parse(all);
    const updated = parsed.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    localStorage.setItem('k_community_notifications', JSON.stringify(updated));
  },

  // Chat (Local Only for demo, Firestore Realtime DB recommended for production)
  getChatMessages: (): ChatMessage[] => {
     const all = localStorage.getItem('k_community_chat');
     return all ? JSON.parse(all) : [];
  },
  
  sendChatMessage: (msg: ChatMessage) => {
     const all = localStorage.getItem('k_community_chat');
     const parsed: ChatMessage[] = all ? JSON.parse(all) : [];
     parsed.push(msg);
     if (parsed.length > 50) parsed.shift();
     localStorage.setItem('k_community_chat', JSON.stringify(parsed));
  }
};
