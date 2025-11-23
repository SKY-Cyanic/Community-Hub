import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post, Board } from '../types';
import { MessageSquare, ThumbsUp, Image as ImageIcon, BarChart2 } from 'lucide-react';
import { storage } from '../services/storage';

interface PostListProps {
  posts: Post[];
  boardSlug: string;
}

const PostList: React.FC<PostListProps> = ({ posts: initialPosts, boardSlug }) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  
  // Get board info for categories
  const boards = storage.getBoards();
  const currentBoard = boards.find(b => b.slug === boardSlug);
  const categories = currentBoard?.categories || [];

  // Filter posts by category
  const filteredPosts = activeCategory === '전체' 
    ? initialPosts 
    : initialPosts.filter(p => p.category === activeCategory);

  return (
    <div className="bg-white dark:bg-gray-800 border-t-2 border-indigo-600 dark:border-indigo-500 transition-colors">
      
      {/* Category Tabs (Malmuri) */}
      {categories.length > 0 && (
        <div className="flex space-x-1 p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button 
            onClick={() => setActiveCategory('전체')}
            className={`px-3 py-1 text-xs rounded-full border ${activeCategory === '전체' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            전체
          </button>
          {categories.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-3 py-1 text-xs rounded-full border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
             >
               {cat}
             </button>
          ))}
        </div>
      )}

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-2 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium text-center">
        <div className="col-span-1">번호</div>
        <div className="col-span-1">말머리</div>
        <div className="col-span-6 text-left pl-2">제목</div>
        <div className="col-span-2">글쓴이</div>
        <div className="col-span-1">날짜</div>
        <div className="col-span-1">조회/추천</div>
      </div>

      {/* List Items */}
      <div className="flex flex-col">
        {filteredPosts.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">게시글이 없습니다.</div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="group relative border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <Link to={`/board/${boardSlug}/${post.id}`} className="block">
                <div className="md:grid md:grid-cols-12 md:gap-2 p-2 md:py-2 md:px-0 items-center">
                  
                  {/* ID / Badge */}
                  <div className="hidden md:block col-span-1 text-center text-xs text-gray-400 font-mono">
                    {post.is_hot ? (
                      <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">인기</span>
                    ) : (
                      post.id.startsWith('post-') ? post.id.split('-')[1].slice(-4) : '공지'
                    )}
                  </div>

                  {/* Category */}
                  <div className="hidden md:block col-span-1 text-center text-xs text-gray-500 dark:text-gray-400 truncate px-1">
                    {post.category && <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px]">{post.category}</span>}
                  </div>

                  {/* Title */}
                  <div className="col-span-12 md:col-span-6 md:pl-2 flex items-center">
                    <span className={`text-sm md:text-[15px] truncate ${post.is_hot ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'} group-hover:text-indigo-700 dark:group-hover:text-indigo-400`}>
                      {post.title}
                    </span>
                    
                    {/* Icons */}
                    <div className="flex items-center ml-1 space-x-1">
                      {post.has_image && <ImageIcon size={14} className="text-gray-400" />}
                      {post.poll && <BarChart2 size={14} className="text-gray-400" />}
                    </div>

                    {/* Comment Count */}
                    {post.comment_count > 0 && (
                      <span className="ml-1 text-[11px] font-bold text-indigo-500 dark:text-indigo-400 flex items-center">
                        [{post.comment_count}]
                      </span>
                    )}
                    {post.is_hot && <span className="md:hidden ml-2 text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded">HOT</span>}
                  </div>

                  {/* Mobile Row for Meta */}
                  <div className="flex md:hidden mt-1 text-[11px] text-gray-400 space-x-2">
                    {post.category && <span>[{post.category}]</span>}
                    <span>{post.author.username}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>조회 {post.view_count}</span>
                  </div>

                  {/* Desktop: Author */}
                  <div className="hidden md:block col-span-2 text-center text-xs text-gray-600 dark:text-gray-400 truncate px-1 cursor-pointer hover:underline">
                    {post.author.username}
                  </div>

                  {/* Desktop: Date */}
                  <div className="hidden md:block col-span-1 text-center text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString().slice(5)}
                  </div>

                  {/* Desktop: Views/Votes */}
                  <div className="hidden md:block col-span-1 text-center text-xs text-gray-400">
                    <div className="flex justify-center space-x-2">
                        <span>{post.view_count > 1000 ? `${(post.view_count/1000).toFixed(1)}k` : post.view_count}</span>
                        <span className="text-red-400 font-medium">{post.upvotes}</span>
                    </div>
                  </div>

                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostList;
