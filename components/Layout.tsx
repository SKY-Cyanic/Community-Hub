
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Board, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, User as UserIcon, LogOut, PenTool, Moon, Sun, 
  BookOpen, X, Cpu, Sparkles, LogIn, Home, ShoppingBag, 
  ChevronRight, Settings, Bell
} from 'lucide-react';
import { storage } from '../services/storage';
import LiveChat from './LiveChat';
import VoiceNeuralLink from './VoiceNeuralLink';

const UserSection: React.FC<any> = ({ 
    user, isLoading, logout, login, register,
    isAiHubMode
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });

  const cardClass = isAiHubMode 
    ? 'ai-hub-card text-cyan-50 backdrop-blur-md border-cyan-500/30' 
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      const res = await register(formData.username, formData.password);
      if (!res.success) alert(res.message);
    } else {
      const res = login(formData.username, formData.password);
      if (!res.success) alert(res.message);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse text-xs font-ai">SYNCING NEURAL DATA...</div>;

  return (
    <div className={`${cardClass} p-5 rounded-2xl shadow-xl transition-all`}>
      {user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${isAiHubMode ? 'bg-cyan-500 text-black' : 'bg-indigo-600 text-white'}`}>
              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-2xl object-cover" /> : user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-black text-lg truncate dark:text-white flex items-center gap-1" style={{ color: user.active_items?.name_color }}>
                {user.active_items?.badge} {user.username}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">LV. {user.level}</span>
                <span className={`${isAiHubMode ? 'text-cyan-400' : 'text-indigo-500'}`}>{user.points.toLocaleString()} P</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/write" className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95 ${isAiHubMode ? 'bg-cyan-500 text-black' : 'bg-indigo-600 text-white'}`}>
              <PenTool size={14} /> 글쓰기
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 dark:text-gray-300 active:scale-95">
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
            <button 
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRegisterMode ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500'}`}
            >
              로그인
            </button>
            <button 
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRegisterMode ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500'}`}
            >
              회원가입
            </button>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-2">
            <input 
              type="text" 
              placeholder="사용자 아이디" 
              className={`w-full p-3 rounded-xl text-sm outline-none border transition-all ${isAiHubMode ? 'bg-black/50 border-cyan-900 text-cyan-400 focus:border-cyan-400' : 'bg-gray-50 dark:bg-gray-700 dark:text-white focus:border-indigo-500'}`}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="비밀번호" 
              className={`w-full p-3 rounded-xl text-sm outline-none border transition-all ${isAiHubMode ? 'bg-black/50 border-cyan-900 text-cyan-400 focus:border-cyan-400' : 'bg-gray-50 dark:bg-gray-700 dark:text-white focus:border-indigo-500'}`}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button type="submit" className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${isAiHubMode ? 'bg-cyan-500 text-black' : 'bg-indigo-600 text-white'}`}>
              {isRegisterMode ? '가입 시작하기' : '보안 접속'}
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 leading-relaxed uppercase tracking-tighter">
            {isRegisterMode ? '가입 시 커뮤니티 가이드라인에 동의하게 됩니다.' : '분실 시 관리자에게 문의하세요.'}
          </p>
        </div>
      )}
    </div>
  );
};

const Layout: React.FC = () => {
  const { user, login, register, logout, isLoading } = useAuth();
  const { isDarkMode, isAiHubMode, toggleTheme, toggleAiHubMode } = useTheme();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isMobileUserOpen, setIsMobileUserOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setBoards(storage.getBoards());
  }, []);

  useEffect(() => {
    setIsMobileUserOpen(false);
  }, [location]);

  const navItems = [
    { label: '홈', icon: <Home size={22}/>, path: '/' },
    { label: '게시판', icon: <Menu size={22}/>, path: '/board/free' },
    { label: '위키', icon: <BookOpen size={22}/>, path: '/wiki' },
    { label: '상점', icon: <ShoppingBag size={22}/>, path: '/shop' },
    { label: '내 정보', icon: <UserIcon size={22}/>, path: isMobileUserOpen ? '#' : null, onClick: () => setIsMobileUserOpen(true) },
  ];

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {isAiHubMode && <div className="fixed inset-0 pointer-events-none scan-line z-[100] opacity-5"></div>}
      
      {/* Header */}
      <header className="sticky top-0 z-[110] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isAiHubMode ? 'bg-cyan-500' : 'bg-indigo-600'}`}>
              <Cpu className="text-white" size={20} />
            </div>
            <span className={`text-lg font-black tracking-tighter ${isAiHubMode ? 'font-ai text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
              AI-HUB <span className="text-xs font-normal opacity-50 ml-1">v2.1</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
             <button onClick={toggleAiHubMode} title="AI Hub Mode" className={`p-2 rounded-full transition-all ${isAiHubMode ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-400 hover:bg-gray-100'}`}>
               <Sparkles size={18} />
             </button>
             <button onClick={toggleTheme} title="Toggle Theme" className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <button className="p-2 text-gray-400 md:hidden">
               <Bell size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="hidden md:block space-y-4">
          <UserSection 
            user={user} isLoading={isLoading} logout={logout} login={login} register={register}
            isAiHubMode={isAiHubMode}
          />
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
             <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Quick Access</h3>
             <nav className="space-y-1">
                {boards.map(b => (
                   <Link key={b.id} to={`/board/${b.slug}`} className="flex items-center justify-between p-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group">
                      {b.name}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"/>
                   </Link>
                ))}
             </nav>
          </div>
        </aside>

        <div className="md:col-span-3">
          <Outlet />
        </div>
      </main>

      {/* Mobile Drawer */}
      {isMobileUserOpen && (
        <div className="fixed inset-0 z-[150] md:hidden flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileUserOpen(false)}></div>
          <div className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
            <UserSection 
              user={user} isLoading={isLoading} logout={logout} login={login} register={register}
              isAiHubMode={isAiHubMode}
            />
            {user && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                 <Link to="/mypage" onClick={() => setIsMobileUserOpen(false)} className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <UserIcon size={18} className="text-indigo-500"/>
                    <span className="text-xs font-bold dark:text-white">마이페이지</span>
                 </Link>
                 <button onClick={() => { setIsMobileUserOpen(false); toggleTheme(); }} className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    {isDarkMode ? <Sun size={18} className="text-yellow-500"/> : <Moon size={18} className="text-indigo-500"/>}
                    <span className="text-xs font-bold dark:text-white">테마 변경</span>
                 </button>
              </div>
            )}
            <button 
              onClick={() => setIsMobileUserOpen(false)}
              className="mt-6 w-full py-3 text-sm font-bold text-gray-400"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 h-16 flex items-center justify-around z-[140] px-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        {navItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
            className={`flex flex-col items-center justify-center w-14 transition-all active:scale-90 ${
              location.pathname === item.path ? (isAiHubMode ? 'text-cyan-400' : 'text-indigo-600') : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Buttons shifted higher to avoid blocking nav */}
      <LiveChat />
      <VoiceNeuralLink />
    </div>
  );
};

export default Layout;
