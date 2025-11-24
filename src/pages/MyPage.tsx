
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Post, Comment } from '../types';
import { Calendar, Award, Edit3, MessageCircle } from 'lucide-react';

const MyPage: React.FC = () => {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if(user) {
          loadActivity();
      }
  }, [user]);

  const loadActivity = async () => {
      setLoading(true);
      // In a real app, you'd want query(collection(db, 'posts'), where('author_id', '==', user.id))
      // Since getPosts fetches all in this simplified API, we filter client side for now
      // Or optimize api.ts later to support getPostsByUser
      const allPosts = await api.getPosts('all');
      setPosts(allPosts.filter(p => p.author_id === user!.id));
      setLoading(false);
      // Comments logic omitted for brevity or requires getCommentsByUser API
  };

  if (!user) {
    return <div className="p-8 text-center">로그인이 필요합니다.</div>;
  }

  // Calculate level progress
  const currentExp = user.exp % 100; 
  const progress = Math.min(100, (currentExp / 100) * 100);

  const handleAttendance = async () => {
    if (checkedIn) return;
    await api.addExp(user.id, 5);
    alert(`출석체크 완료! 50 포인트를 획득했습니다.`);
    setCheckedIn(true);
    window.location.reload(); // quick refresh to show new points
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm p-6 flex flex-col md:flex-row items-center gap-6">
         <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300">
            {user.username.substring(0,1).toUpperCase()}
         </div>
         <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{user.username}</h2>
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">{user.email}</div>
            
            <div className="flex justify-center md:justify-start gap-4">
               <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">레벨</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{user.level}</div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">포인트</div>
                  <div className="font-bold text-gray-800 dark:text-white text-lg">{user.points.toLocaleString()} P</div>
               </div>
            </div>
         </div>
         
         <div className="w-full md:w-64">
            <div className="text-xs flex justify-between mb-1 text-gray-500 dark:text-gray-400">
               <span>EXP Progress</span>
               <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="mt-4">
              <button 
                onClick={handleAttendance}
                disabled={checkedIn}
                className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${checkedIn ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <Calendar size={16}/> {checkedIn ? '출석완료' : '오늘의 출석체크'}
              </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm p-4">
           <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
             <Edit3 size={18}/> 최근 작성 글
           </h3>
           <ul className="space-y-2">
             {loading ? <div className="text-xs">Loading...</div> : posts.slice(0, 5).map(p => (
               <li key={p.id} className="text-sm flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                 <span className="truncate flex-1 text-gray-700 dark:text-gray-300">{p.title}</span>
                 <span className="text-xs text-gray-400 ml-2">{new Date(p.created_at).toLocaleDateString()}</span>
               </li>
             ))}
             {!loading && posts.length === 0 && <div className="text-gray-400 text-sm text-center py-4">작성한 글이 없습니다.</div>}
           </ul>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
