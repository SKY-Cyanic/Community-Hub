import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Post } from '../types';
import { MessageSquare, ThumbsUp, Image as ImageIcon, BarChart2, Grid, List } from 'lucide-react';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

const { Link } = ReactRouterDOM as any;

interface PostListProps {
  posts: Post[];
  boardSlug: string;
}

const PostList: React.FC<PostListProps> = ({ posts: initialPosts, boardSlug }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  
  // Get board info for categories
  const boards = storage.getBoards();
  const currentBoard = boards.find(b => b.slug === boardSlug);
  const categories = currentBoard?.categories || [];

  // Filter logic: Category & Blocked Users
  const blockedUsers = user?.blocked_users || [];
  
  const filteredPosts = initialPosts
    .filter(p => !blockedUsers.includes(p.author_id))
    .filter(p => activeCategory === '전체' ? true : p.category === activeCategory);

  return (
    <div className="bg-white dark:bg-gray-800 border-t-2 border-indigo-600 dark:border-indigo-500 transition-colors">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        {/* Category Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveCategory('전체')}
            className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${activeCategory === '전체' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            전체
          </button>
          {categories.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
             >
               {cat}
             </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 ml-2 flex-shrink-0">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <List size={16} />
            </button>
            <button onClick={() => setViewMode('gallery')} className={`p-1.5 rounded ${viewMode === 'gallery' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <Grid size={16} />
            </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <>
          <div className="hidden md:grid grid-cols-12 gap-2 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium text-center">
            <div className="col-span-1">번호</div>
            <div className="col-span-1">말머리</div>
            <div className="col-span-6 text-left pl-2">제목</div>
            <div className="col-span-2">글쓴이</div>
            <div className="col-span-1">날짜</div>
            <div className="col-span-1">조회/추천</div>
          </div>

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
                        
                        <div className="flex items-center ml-1 space-x-1">
                          {post.has_image && <ImageIcon size={14} className="text-gray-400" />}
                          {post.poll && <BarChart2 size={14} className="text-gray-400" />}
                        </div>

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
                        <span style={{ 
                            color: post.author.active_items?.name_color,
                            fontWeight: post.author.active_items?.name_style === 'bold' ? 'bold' : 'normal'
                        }}>
                           {post.author.active_items?.badge} {post.author.username}
                        </span>
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
        </>
      )}

      {/* GALLERY VIEW */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
             {filteredPosts.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 text-sm">게시글이 없습니다.</div>
            ) : (
              filteredPosts.map((post) => (
                <Link key={post.id} to={`/board/${boardSlug}/${post.id}`} className="group block bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded overflow-hidden hover:shadow-md transition-shadow">
                   {/* Image Thumbnail or Placeholder */}
                   <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden h-32">
                       {post.images && post.images.length > 0 ? (
                           <img src={post.images[0]} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                       ) : (
                           <div className="text-gray-300 dark:text-gray-600 flex flex-col items-center">
                               <ImageIcon size={24} />
                               <span className="text-[10px] mt-1">No Image</span>
                           </div>
                       )}
                   </div>
                   <div className="p-3">
                       <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-1 font-bold truncate">{post.category || '일반'}</div>
                       <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 h-10 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                           {post.title}
                       </h3>
                       <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                           <span className="truncate max-w-[80px]">{post.author.username}</span>
                           <div className="flex gap-2">
                               <span className="flex items-center gap-0.5"><ThumbsUp size={10}/> {post.upvotes}</span>
                               <span className="flex items-center gap-0.5"><MessageSquare size={10}/> {post.comment_count}</span>
                           </div>
                       </div>
                   </div>
                </Link>
              ))
            )}
        </div>
      )}
    </div>
  );
};

export default PostList;