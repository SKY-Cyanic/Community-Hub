
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, ACHIEVEMENTS } from '../services/storage';
import { Calendar, Award, Edit3, Bookmark, CheckCircle, Circle, Flame, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <div className="p-8 text-center">로그인이 필요합니다.</div>;

  const posts = storage.getPosts().filter(p => p.author_id === user.id);
  const scrapped = user.scrapped_posts ? storage.getPosts().filter(p => user.scrapped_posts.includes(p.id)) : [];
  
  const currentExp = user.exp % 100; 
  const progress = Math.min(100, (currentExp / 100) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="w-28 h-28 bg-indigo-100 dark:bg-indigo-900 rounded-3xl flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden border-4 border-white shadow-2xl">
            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
         </div>
         <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                {user.username}
                {user.is_admin && <Award size={20} className="text-yellow-500" />}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
               <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                  <div className="text-[10px] text-gray-400 uppercase font-black">Level</div>
                  <div className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{user.level}</div>
               </div>
               <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-2xl text-center border border-gray-100 dark:border-gray-600">
                  <div className="text-[10px] text-gray-400 uppercase font-black">Points</div>
                  <div className="font-black text-gray-800 dark:text-white text-lg">{user.points.toLocaleString()}</div>
               </div>
               <div className="bg-orange-500/10 px-4 py-2 rounded-2xl text-center border border-orange-500/20">
                  <div className="text-[10px] text-orange-500 uppercase font-black flex items-center gap-1 justify-center"><Flame size={10}/> Streak</div>
                  <div className="font-black text-orange-600 text-lg">{user.attendance_streak}</div>
               </div>
            </div>
         </div>
         <div className="w-full md:w-64 space-y-2">
            <div className="text-[10px] flex justify-between text-gray-400 uppercase font-black">
               <span>Next Level Progress</span>
               <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }}></div>
            </div>
         </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-lg">
          <h3 className="font-black text-sm text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles size={18} className="text-yellow-500"/> Neural Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ACHIEVEMENTS.map(ach => {
                  const isUnlocked = user.achievements.includes(ach.id);
                  return (
                      <div key={ach.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${isUnlocked ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 opacity-40'}`}>
                          <div className="text-3xl">{ach.icon}</div>
                          <div>
                              <div className="text-sm font-black text-gray-800 dark:text-white">{ach.name}</div>
                              <div className="text-[10px] text-gray-500 leading-tight">{ach.description}</div>
                              {isUnlocked && <div className="text-[9px] text-indigo-500 font-bold mt-1">UNLOCKED +{ach.reward_points}P</div>}
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scrapped Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <Bookmark size={18} className="text-indigo-500"/> Scrapped Data
           </h3>
           <ul className="space-y-2">
             {scrapped.map(p => (
               <li key={p.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors flex justify-between items-center">
                 <Link to={`/board/${p.board_id}/${p.id}`} className="truncate flex-1 font-medium">{p.title}</Link>
                 <span className="text-[10px] text-gray-400 font-mono ml-2">{new Date(p.created_at).toLocaleDateString()}</span>
               </li>
             ))}
             {scrapped.length === 0 && <div className="text-gray-400 text-xs text-center py-8 font-mono">NO RECORDS FOUND</div>}
           </ul>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <Edit3 size={18} className="text-indigo-500"/> My Nodes
           </h3>
           <ul className="space-y-2">
             {posts.slice(0, 5).map(p => (
               <li key={p.id} className="text-sm border-b border-gray-50 dark:border-gray-700/50 pb-2 flex justify-between items-center">
                 <span className="truncate flex-1 font-medium">{p.title}</span>
                 <span className="text-[10px] text-gray-400 ml-2">{p.view_count} VIEW</span>
               </li>
             ))}
             {posts.length === 0 && <div className="text-gray-400 text-xs text-center py-8 font-mono">NO RECORDS FOUND</div>}
           </ul>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
