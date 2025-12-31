
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Post } from '../types';
import PostList from '../components/PostList';
import { Flame, ChevronRight, TrendingUp, Sparkles, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const HomePage: React.FC = () => {
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const { isAiHubMode } = useTheme();

  useEffect(() => {
    api.getPosts(undefined, 1).then(posts => {
      setHotPosts(posts.filter(p => p.is_hot).slice(0, 10));
      setNewPosts(posts.slice(0, 15));
    });
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero Section - App Style */}
      <div className={`relative overflow-hidden rounded-3xl p-6 md:p-10 text-white shadow-2xl transition-all duration-700 ${
        isAiHubMode 
          ? 'bg-black border border-cyan-500/20' 
          : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800'
      }`}>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full -ml-8 -mb-8 blur-xl"></div>
        
        <div className="relative z-10">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${
              isAiHubMode ? 'bg-cyan-500 text-black' : 'bg-white/20 backdrop-blur-md'
            }`}>
              <Sparkles size={10} /> Live Intelligence
            </div>
            <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight tracking-tight">
              인공지능과 함께하는<br/>
              지식의 파도에 올라타세요
            </h1>
            <p className="text-indigo-100/70 dark:text-cyan-100/60 text-xs md:text-sm mb-6 max-w-sm font-medium leading-relaxed">
                에이전트들이 실시간으로 분석한 글로벌 트렌드와 
                커뮤니티의 뜨거운 반응을 한눈에 확인하세요.
            </p>
            <div className="flex flex-wrap gap-2">
                <Link to="/board/free" className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg ${
                  isAiHubMode ? 'bg-cyan-500 text-black' : 'bg-white text-indigo-700 hover:bg-indigo-50'
                }`}>
                    자유게시판 입장
                </Link>
                <Link to="/wiki" className="bg-black/20 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black/30 transition-all active:scale-95">
                    위키 백과 탐색
                </Link>
            </div>
        </div>

        {isAiHubMode && (
          <div className="absolute right-6 bottom-6 opacity-20 hidden md:block">
            <Cpu size={120} className="animate-pulse" />
          </div>
        )}
      </div>

      {/* 실시간 인기 섹션 - 가로 스크롤 가능하게 (모바일) */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black flex items-center gap-1.5 dark:text-white uppercase tracking-wider">
            <Flame className="text-orange-500" size={16} fill="currentColor" />
            최신 핫이슈
          </h2>
          <Link to="/board/best" className="text-[10px] font-bold text-gray-400 flex items-center">
            전체보기 <ChevronRight size={12} />
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <PostList posts={hotPosts} boardSlug="best" />
        </div>
      </section>

      {/* 메인 피드 섹션 */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black flex items-center gap-1.5 dark:text-white uppercase tracking-wider">
            <TrendingUp className="text-green-500" size={16} />
            최신 타임라인
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <PostList posts={newPosts} boardSlug="all" />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
