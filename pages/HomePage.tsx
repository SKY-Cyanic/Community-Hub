import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Post } from '../types';
import PostList from '../components/PostList';
import { Flame, ChevronRight, TrendingUp, MessageSquare } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';

const { Link } = ReactRouterDOM as any;

const HomePage: React.FC = () => {
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [newPosts, setNewPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Simulating aggregation
    api.getPosts(undefined, 1).then(posts => {
      setHotPosts(posts.filter(p => p.is_hot).slice(0, 10));
      setNewPosts(posts.slice(0, 10));
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-sm shadow-lg p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black mb-2">지금 대한민국에서 가장 뜨거운 이슈</h1>
            <p className="text-indigo-100 text-sm md:text-base mb-6 max-w-lg">
                매일 쏟아지는 수만 개의 글 중 핵심만 모았습니다. 
                K-Community Hub에서 트렌드를 가장 먼저 확인하세요.
            </p>
            <div className="flex gap-3">
                <Link to="/board/best" className="bg-white text-indigo-600 font-bold px-5 py-2 rounded text-sm hover:bg-indigo-50 transition-colors shadow-sm">
                    베스트 글 보기
                </Link>
                <Link to="/write" className="bg-indigo-700/50 text-white border border-white/20 font-bold px-5 py-2 rounded text-sm hover:bg-indigo-700/70 transition-colors">
                    글쓰기
                </Link>
            </div>
        </div>
      </div>

      {/* Best Posts Section */}
      <section className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-sm shadow-sm overflow-hidden transition-colors">
        <div className="bg-indigo-50 dark:bg-gray-700/50 px-4 py-3 border-b border-indigo-100 dark:border-gray-600 flex justify-between items-center">
          <h2 className="text-indigo-800 dark:text-indigo-300 font-bold flex items-center gap-2 text-base">
            <Flame className="text-red-500" size={18} fill="currentColor" />
            실시간 베스트
          </h2>
          <Link to="/board/best" className="text-xs text-indigo-500 dark:text-indigo-300 flex items-center hover:underline">
            더보기 <ChevronRight size={12} />
          </Link>
        </div>
        <PostList posts={hotPosts} boardSlug="best" />
      </section>

      {/* Recent Posts Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold flex items-center gap-2 text-base">
            <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
            최신 글
          </h2>
        </div>
        <PostList posts={newPosts} boardSlug="all" />
      </section>
    </div>
  );
};

export default HomePage;