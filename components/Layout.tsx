import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Board, Notification } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Search, Bell, User as UserIcon, LogOut, PenTool, Moon, Sun, CheckCircle } from 'lucide-react';
import { storage } from '../services/storage';

const Layout: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const location = useLocation();
  const { user, login, logout, isLoading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [usernameInput, setUsernameInput] = useState('');
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNoti, setShowNoti] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    api.getBoards().then(setBoards);
  }, []);

  useEffect(() => {
    if (user) {
      // Poll notifications every 5 seconds (simulating realtime)
      const fetchNoti = () => {
        const notis = storage.getNotifications(user.id);
        setNotifications(notis);
      };
      fetchNoti();
      const interval = setInterval(fetchNoti, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      login(usernameInput);
    }
  };

  const handleNotiClick = () => {
    setShowNoti(!showNoti);
    if (!showNoti && user) {
      storage.markNotificationsRead(user.id);
      // Update local state to show read
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  // EXP Bar Calculation
  const nextLevelExp = (user?.level || 1) * 100;
  const currentLevelExp = (user?.level || 1 - 1) * 100; // rough approx
  const expPercent = user ? Math.min(100, Math.max(0, (user.exp % 100) / 100 * 100)) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Top GNB */}
      <header className="bg-indigo-700 dark:bg-gray-800 text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-black tracking-tighter flex items-center gap-1">
              <span className="bg-white text-indigo-700 px-1 rounded text-lg">K</span>
              HUB
            </Link>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex space-x-4 text-sm font-medium">
              <Link to="/" className={`hover:text-indigo-200 ${location.pathname === '/' ? 'text-white font-bold' : 'text-indigo-100'}`}>
                홈
              </Link>
              {boards.map(board => (
                <Link 
                  key={board.id} 
                  to={`/board/${board.slug}`}
                  className={`hover:text-indigo-200 ${location.pathname.includes(board.slug) ? 'text-white font-bold border-b-2 border-white pb-4 mt-4' : 'text-indigo-100'}`}
                >
                  {board.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-1.5 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="다크 모드 전환"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-1 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full hidden md:block">
              <Search size={20} />
            </button>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={handleNotiClick}
                className="p-1 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNoti && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200">
                    알림
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-gray-500">알림이 없습니다.</div>
                    ) : (
                      notifications.map(noti => (
                        <Link 
                          key={noti.id} 
                          to={noti.link} 
                          onClick={() => setShowNoti(false)}
                          className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${!noti.is_read ? 'bg-indigo-50 dark:bg-gray-700/50' : ''}`}
                        >
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium mb-1">{noti.message}</div>
                          <div className="text-[10px] text-gray-400">{new Date(noti.created_at).toLocaleString()}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user ? (
               <div className="flex items-center gap-2 pl-2 border-l border-indigo-500 ml-2">
                 <Link to="/mypage">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold border border-indigo-400 cursor-pointer">
                    {user.username.substring(0,2).toUpperCase()}
                  </div>
                 </Link>
               </div>
            ) : (
               <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                 G
               </div>
            )}
            <button className="md:hidden p-1">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto max-w-6xl px-2 md:px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Main Column */}
          <div className="md:col-span-3">
             <Outlet />
          </div>

          {/* Sidebar (Right) */}
          <aside className="hidden md:block md:col-span-1 space-y-4">
             {/* Login Box */}
             <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm transition-colors">
                <div className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">로그인 정보</div>
                
                {isLoading ? (
                  <div className="text-xs text-gray-500">로딩중...</div>
                ) : user ? (
                  // Logged In State
                  <div>
                    <div className="flex items-center space-x-3 mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-lg">
                        {user.username.substring(0,1).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold truncate text-gray-800 dark:text-gray-100">{user.username}</div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                           <span>Lv. {user.level}</span>
                           <span>{expPercent.toFixed(0)}%</span>
                        </div>
                        {/* EXP Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-1">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${expPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <Link to="/write" className="flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 transition-colors">
                          <PenTool size={14}/> 글쓰기
                       </Link>
                       <Link to="/mypage" className="flex items-center justify-center gap-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                          <UserIcon size={14}/> 내 정보
                       </Link>
                    </div>
                    <button 
                      onClick={logout} 
                      className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 py-1"
                    >
                      <LogOut size={12}/> 로그아웃
                    </button>
                  </div>
                ) : (
                  // Guest State
                  <form onSubmit={handleLogin}>
                    <div className="space-y-2 mb-3">
                       <input 
                         type="text" 
                         placeholder="아이디" 
                         className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm rounded focus:outline-none focus:border-indigo-500 dark:text-white"
                         value={usernameInput}
                         onChange={(e) => setUsernameInput(e.target.value)}
                         required
                       />
                       <input 
                         type="password" 
                         placeholder="비밀번호" 
                         className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm rounded focus:outline-none focus:border-indigo-500 dark:text-white"
                         defaultValue="1234" // Mock
                       />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded hover:bg-indigo-700 transition-colors">
                      로그인
                    </button>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <a href="#" className="hover:underline">회원가입</a>
                      <a href="#" className="hover:underline">아이디/비번 찾기</a>
                    </div>
                  </form>
                )}
             </div>

             {/* Popular Boards Mock */}
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm transition-colors">
               <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-600 font-bold text-sm text-gray-800 dark:text-gray-200">
                 실시간 인기 갤러리
               </div>
               <ul className="text-sm">
                 {[1,2,3,4,5].map(i => (
                   <li key={i} className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between text-gray-700 dark:text-gray-300">
                     <span className="truncate">🔥 핫이슈 갤러리</span>
                     <span className="text-red-500 text-xs font-bold">{i*152}</span>
                   </li>
                 ))}
               </ul>
             </div>

             {/* Banner Mock */}
             <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium rounded-sm">
               광고 배너 영역
             </div>
          </aside>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-400 py-8 mt-8 border-t border-gray-700">
        <div className="container mx-auto px-4 max-w-6xl text-sm">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h5 className="text-white font-bold mb-2">K-Community Hub</h5>
              <p>대한민국 No.1 커뮤니티</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white">개인정보처리방침</a>
              <a href="#" className="hover:text-white">청소년보호정책</a>
              <a href="#" className="hover:text-white">문의하기</a>
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-500">
            &copy; 2024 K-Community Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
