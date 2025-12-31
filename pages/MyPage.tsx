
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Post, Comment } from '../types';
import { Calendar, Award, Edit3, MessageCircle, Bookmark, CheckCircle, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <div className="p-8 text-center">로그인이 필요합니다.</div>;
  }

  const posts = storage.getPosts().filter(p => p.author_id === user.id);
  const comments = storage.getComments().filter(c => c.author_id === user.id);
  const scrapped = user.scrapped_posts ? storage.getPosts().filter(p => user.scrapped_posts.includes(p.id)) : [];
  
  const expNeeded = user.level * 100;
  const currentExp = user.exp % 100; 
  const progress = Math.min(100, (currentExp / 100) * 100);

  // Quest Data
  const questData = user.quests || { daily_login: false, post_count: 0, comment_count: 0 };
  const quests = [
      { id: 'login', label: 'Daily Login', target: 1, current: questData.daily_login ? 1 : 0, reward: 10 },
      { id: 'post', label: 'Write 1 Post', target: 1, current: questData.post_count, reward: 30 },
      { id: 'comment', label: 'Write 3 Comments', target: 3, current: questData.comment_count, reward: 20 },
  ];
  const completedQuests = quests.filter(q => q.current >= q.target).length;
  const totalCompletion = Math.round((completedQuests / quests.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

         <div className="relative group z-10">
            <div className="w-28 h-28 bg-indigo-100 dark:bg-indigo-900 rounded-3xl flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden border-4 border-white dark:border-gray-700 shadow-2xl">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    user.username.substring(0,1).toUpperCase()
                )}
            </div>
         </div>
         
         <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                {user.username}
                {user.is_admin && <Award size={20} className="text-yellow-500" />}
            </h2>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-4 uppercase tracking-widest font-mono">NODE_CONNECTED: {new Date().getFullYear()}.01.01</div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                  <div className="text-[10px] text-gray-400 uppercase font-black">LVL</div>
                  <div className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{user.level}</div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                  <div className="text-[10px] text-gray-400 uppercase font-black">POINTS</div>
                  <div className="font-black text-gray-800 dark:text-white text-lg">{user.points.toLocaleString()}</div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                  <div className="text-[10px] text-gray-400 uppercase font-black">SCRAPS</div>
                  <div className="font-black text-gray-800 dark:text-white text-lg">{scrapped.length}</div>
               </div>
            </div>
         </div>
         
         <div className="w-full md:w-64 space-y-4 z-10">
            <div>
                <div className="text-[10px] flex justify-between mb-1 text-gray-400 uppercase font-black">
                   <span>XP Progress</span>
                   <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
         </div>
      </div>

      {/* Quest Dashboard */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
         <div className="flex justify-between items-end mb-4 relative z-10">
             <div>
                <h3 className="text-xl font-black italic">DAILY PROTOCOLS</h3>
                <p className="text-indigo-200 text-xs">Complete protocols to maintain node efficiency.</p>
             </div>
             <div className="text-3xl font-black text-indigo-300">{totalCompletion}%</div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
             {quests.map(q => {
                 const isDone = q.current >= q.target;
                 return (
                     <div key={q.id} className={`p-4 rounded-2xl border transition-all ${isDone ? 'bg-indigo-600/50 border-indigo-400' : 'bg-black/20 border-white/10'}`}>
                         <div className="flex justify-between items-start mb-2">
                             <div className="font-bold text-sm">{q.label}</div>
                             {isDone ? <CheckCircle size={18} className="text-green-400"/> : <Circle size={18} className="text-indigo-400"/>}
                         </div>
                         <div className="w-full bg-black/30 h-1.5 rounded-full mb-2 overflow-hidden">
                             <div className="bg-yellow-400 h-full transition-all" style={{ width: `${Math.min(100, (q.current/q.target)*100)}%` }}></div>
                         </div>
                         <div className="text-[10px] text-indigo-200 flex justify-between">
                             <span>{Math.min(q.current, q.target)} / {q.target}</span>
                             <span>+{q.reward} P</span>
                         </div>
                     </div>
                 )
             })}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scrapped Posts */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <Bookmark size={18} className="text-yellow-500"/> Scrapped Data Fragments
           </h3>
           <ul className="space-y-3">
             {scrapped.map(p => (
               <li key={p.id} className="text-sm flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 p-2 rounded transition-colors">
                 <Link to={`/board/${p.board_id}/${p.id}`} className="truncate flex-1 text-gray-700 dark:text-gray-300 font-medium hover:text-indigo-600">
                    {p.title}
                 </Link>
                 <span className="text-[10px] text-gray-400 font-mono ml-2">{new Date(p.created_at).toLocaleDateString()}</span>
               </li>
             ))}
             {scrapped.length === 0 && <div className="text-gray-400 text-xs text-center py-8 italic font-mono uppercase">No fragments found</div>}
           </ul>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <Edit3 size={18} className="text-indigo-500"/> Recent Nodes
           </h3>
           <ul className="space-y-3">
             {posts.slice(0, 5).map(p => (
               <li key={p.id} className="text-sm flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0">
                 <span className="truncate flex-1 text-gray-700 dark:text-gray-300 font-medium">{p.title}</span>
               </li>
             ))}
             {posts.length === 0 && <div className="text-gray-400 text-xs text-center py-8 italic font-mono uppercase">No records found</div>}
           </ul>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
