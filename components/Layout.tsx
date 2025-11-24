
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Board, Notification, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Search, Bell, User as UserIcon, LogOut, PenTool, Moon, Sun, ShoppingBag, BookOpen, X, Home, ChevronRight } from 'lucide-react';
import { storage } from '../services/storage';
import LiveChat from './LiveChat';

// Extracted UserSection to prevent re-mount on parent render
interface UserSectionProps {
  user: User | null;
  isLoading: boolean;
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  logout: () => void;
}

const UserSection: React.FC<UserSectionProps> = ({ user, isLoading, usernameInput, setUsernameInput, handleLogin, logout }) => {
  const expPercent = user ? Math.min(100, Math.max(0, (user.exp % 100) / 100 * 100)) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm transition-colors">
      <div className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">로그인 정보</div>
      
      {isLoading ? (
        <div className="text-xs text-gray-500">로딩중...</div>
      ) : user ? (
        <div>
          <div className="flex items-center space-x-3 mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
              {user.username.substring(0,1).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div 
                className="text-sm font-bold truncate text-gray-800 dark:text-gray-100"
                style={{ 
                    color: user.active_items?.name_color,
                    fontWeight: user.active_items?.name_style === 'bold' ? 'bold' : 'normal'
                }}
              >
                  {user.active_items?.badge} {user.username}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                 <span>Lv. {user.level}</span>
                 <span className="text-indigo-500 font-bold">{user.points} P</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-1">
                <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${expPercent}%` }}></div>
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
               defaultValue="1234" 
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
  );
};

const Layout: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const location = useLocation();
  const { user, login, logout, isLoading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [usernameInput, setUsernameInput] = useState('');
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNoti, setShowNoti] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    api.getBoards().then(setBoards);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (user) {
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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 font-sans">
      {/* Top GNB */}
      <header className="bg-indigo-700 dark:bg-gray-800 text-white sticky top-0 z-40 shadow-md transition-colors">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
              <div className="w-px h-4 bg-indigo-500 my-auto mx-2"></div>
              <Link to="/wiki" className={`flex items-center gap-1 hover:text-indigo-200 ${location.pathname === '/wiki' ? 'text-white font-bold' : 'text-indigo-100'}`}>
                  <BookOpen size={14} /> 위키
              </Link>
              <Link to="/shop" className={`flex items-center gap-1 hover:text-indigo-200 ${location.pathname === '/shop' ? 'text-white font-bold' : 'text-indigo-100'}`}>
                  <ShoppingBag size={14} /> 상점
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full hidden md:block">
              <Search size={20} />
            </button>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={handleNotiClick}
                className="p-2 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-indigo-700 bg-red-500"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNoti && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 flex justify-between items-center">
                    <span>알림</span>
                    {unreadCount > 0 && <span className="text-xs text-indigo-500 cursor-pointer" onClick={() => storage.markNotificationsRead(user!.id)}>모두 읽음</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-gray-500">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map(noti => (
                        <Link 
                          key={noti.id} 
                          to={noti.link} 
                          onClick={() => setShowNoti(false)}
                          className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 ${!noti.is_read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                        >
                          <div className="text-sm text-gray-800 dark:text-gray-200 mb-1">{noti.message}</div>
                          <div className="text-[10px] text-gray-400">{new Date(noti.created_at).toLocaleString()}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar (Desktop) */}
            {user && (
               <div className="hidden md:flex items-center gap-2 pl-2 border-l border-indigo-500 ml-2">
                 <Link to="/mypage">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold border border-indigo-400 cursor-pointer hover:bg-indigo-400 transition-colors">
                    {user.username.substring(0,2).toUpperCase()}
                  </div>
                 </Link>
               </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 hover:bg-indigo-600 dark:hover:bg-gray-700 rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Content */}
          <div className="relative w-[80%] max-w-xs bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col transition-transform">
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                <span className="font-bold text-lg text-gray-800 dark:text-white">메뉴</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 dark:text-gray-300 hover:text-red-500">
                   <X size={24}/>
                </button>
             </div>

             <div className="overflow-y-auto flex-1 p-4 space-y-6">
                {/* User Section in Mobile */}
                <UserSection 
                   user={user} 
                   isLoading={isLoading} 
                   usernameInput={usernameInput} 
                   setUsernameInput={setUsernameInput} 
                   handleLogin={handleLogin} 
                   logout={logout} 
                />

                {/* Navigation Links */}
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">게시판</div>
                  <nav className="space-y-1">
                    <Link to="/" className="flex items-center justify-between px-3 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                       <div className="flex items-center gap-2"><Home size={16}/> 홈</div>
                       <ChevronRight size={14} className="text-gray-400"/>
                    </Link>
                    {boards.map(board => (
                      <Link 
                        key={board.id} 
                        to={`/board/${board.slug}`}
                        className="flex items-center justify-between px-3 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span>{board.name}</span>
                        <ChevronRight size={14} className="text-gray-400"/>
                      </Link>
                    ))}
                  </nav>
                </div>
                
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">부가기능</div>
                  <nav className="space-y-1">
                     <Link to="/wiki" className="flex items-center justify-between px-3 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-2"><BookOpen size={16}/> 위키</div>
                     </Link>
                     <Link to="/shop" className="flex items-center justify-between px-3 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-2"><ShoppingBag size={16}/> 포인트 상점</div>
                     </Link>
                  </nav>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto max-w-6xl px-2 md:px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Main Column */}
          <div className="md:col-span-3 min-w-0">
             <Outlet />
          </div>

          {/* Sidebar (Right) - Hidden on Mobile */}
          <aside className="hidden md:block md:col-span-1 space-y-4">
             <UserSection 
                user={user} 
                isLoading={isLoading} 
                usernameInput={usernameInput} 
                setUsernameInput={setUsernameInput} 
                handleLogin={handleLogin} 
                logout={logout} 
             />

             {/* Popular Boards Mock */}
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm transition-colors">
               <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-600 font-bold text-sm text-gray-800 dark:text-gray-200 flex justify-between items-center">
                 <span>실시간 이슈 갤러리</span>
                 <span className="text-[10px] text-red-500 animate-pulse">● LIVE</span>
               </div>
               <ul className="text-sm">
                 {[1,2,3,4,5].map(i => (
                   <li key={i} className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between text-gray-700 dark:text-gray-300 group">
                     <span className="truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <span className="font-bold mr-2 text-gray-400 italic">{i}</span>
                        핫이슈 갤러리
                     </span>
                     <span className="text-gray-400 text-xs">{i*152}</span>
                   </li>
                 ))}
               </ul>
             </div>

             {/* Banner Mock */}
             <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium rounded-sm">
               <span>광고 배너 영역</span>
               <span className="text-xs mt-1 opacity-50">문의: ad@khub.com</span>
             </div>
          </aside>
        </div>
      </main>

      <LiveChat />

      <footer className="bg-gray-800 text-gray-400 py-8 mt-8 border-t border-gray-700">
        <div className="container mx-auto px-4 max-w-6xl text-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h5 className="text-white font-bold text-lg mb-1 flex items-center gap-2">K-Community Hub</h5>
              <p className="text-gray-500 text-xs">대한민국 트렌드가 시작되는 곳</p>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 text-xs">
              <Link to="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
              <Link to="/youth-policy" className="hover:text-white transition-colors">청소년보호정책</Link>
              <a href="#" className="hover:text-white transition-colors">광고/제휴 문의</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-xs text-gray-500 flex flex-col md:flex-row justify-between gap-2">
            <span>&copy; 2024 K-Community Hub. All rights reserved.</span>
            <span>Designed for Clean & Fast Community Experience.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
