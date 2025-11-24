import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/api';
import { Post, Board } from '../types';
import PostList from '../components/PostList';
import { PenTool, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const { useParams, Link, useNavigate } = ReactRouterDOM as any;

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [boardInfo, setBoardInfo] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const boards = await api.getBoards();
      const currentBoard = boards.find(b => b.slug === boardId);
      setBoardInfo(currentBoard || null);

      const boardPosts = await api.getPosts(boardId);
      setPosts(boardPosts);
      setLoading(false);
    };
    fetchData();
  }, [boardId]);

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인 후 이용 가능합니다.');
      return;
    }
    navigate('/write');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">로딩중...</div>;
  if (!boardInfo) return <div className="p-8 text-center text-red-500">게시판을 찾을 수 없습니다.</div>;

  return (
    <div>
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
        <h1 className="text-xl font-black text-gray-800 mb-1">{boardInfo.name}</h1>
        <p className="text-sm text-gray-500">{boardInfo.description}</p>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-gray-500">
           총 <span className="text-indigo-600 font-bold">{posts.length}</span>개의 글
        </div>
        <button 
          onClick={handleWriteClick}
          className="flex items-center gap-1 bg-indigo-600 text-white text-sm font-bold px-3 py-1.5 rounded hover:bg-indigo-700"
        >
          <PenTool size={14} /> 글쓰기
        </button>
      </div>

      <div className="shadow-sm">
        <PostList posts={posts} boardSlug={boardId!} />
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-1">
        <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded-l hover:bg-gray-50 text-sm">Previous</button>
        <button className="px-3 py-1 border border-indigo-500 bg-indigo-50 text-indigo-700 font-bold text-sm">1</button>
        <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 text-sm">2</button>
        <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 text-sm">3</button>
        <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded-r hover:bg-gray-50 text-sm">Next</button>
      </div>

      {/* Search Bar */}
      <div className="mt-8 bg-gray-100 p-4 rounded flex justify-center">
         <div className="flex space-x-2 w-full max-w-md">
            <select className="border border-gray-300 text-sm p-2 rounded focus:outline-none">
              <option>제목+내용</option>
              <option>제목</option>
              <option>글쓴이</option>
            </select>
            <input 
              type="text" 
              placeholder="검색어를 입력하세요" 
              className="flex-grow border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-indigo-500"
            />
            <button className="bg-gray-700 text-white px-4 rounded text-sm font-bold hover:bg-gray-600">
               검색
            </button>
         </div>
      </div>
    </div>
  );
};

export default BoardPage;