import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Post } from '../types';
import PostList from '../components/PostList';
import { Flame, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      {/* Best Posts Section */}
      <section className="bg-white border border-indigo-100 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
          <h2 className="text-indigo-800 font-bold flex items-center gap-2">
            <Flame className="text-red-500" size={18} fill="currentColor" />
            실시간 베스트
          </h2>
          <Link to="/best" className="text-xs text-indigo-500 flex items-center hover:underline">
            더보기 <ChevronRight size={12} />
          </Link>
        </div>
        <PostList posts={hotPosts} boardSlug="best" />
      </section>

      {/* Recent Posts Section */}
      <section className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-gray-800 font-bold flex items-center gap-2">
            최신 글
          </h2>
        </div>
        <PostList posts={newPosts} boardSlug="all" />
      </section>
    </div>
  );
};

export default HomePage;
