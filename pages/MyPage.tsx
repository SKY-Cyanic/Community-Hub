
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Post, Comment } from '../types';
import { Calendar, Award, Edit3, MessageCircle, User as UserIcon, Sparkles, Loader2, Camera } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const MyPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  if (!user) {
    return <div className="p-8 text-center">로그인이 필요합니다.</div>;
  }

  const posts = storage.getPosts().filter(p => p.author_id === user.id);
  const comments = storage.getComments().filter(c => c.author_id === user.id);
  
  const expNeeded = user.level * 100;
  const currentExp = user.exp % 100; 
  const progress = Math.min(100, (currentExp / 100) * 100);

  const handleAttendance = () => {
    if (checkedIn) return;
    alert(`출석체크 완료! 50 포인트를 획득했습니다.`);
    setCheckedIn(true);
    storage.addExp(user.id, 5); 
  };

  const handleGenerateAvatar = async () => {
    if (user.points < 100) {
      alert('AI 프로필 생성에는 100 포인트가 필요합니다.');
      return;
    }
    
    if (!confirm('100 포인트를 사용하여 AI 프로필 이미지를 생성하시겠습니까?')) return;

    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Create a futuristic, cyberpunk style square profile avatar for a user named '${user.username}'. The character should look tech-savvy and unique. High quality, detailed 3D render.` }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let base64 = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64) {
        const updatedUser = { ...user, avatar_url: base64, points: user.points - 100 };
        storage.saveUser(updatedUser);
        refreshUser();
        alert('AI 프로필이 성공적으로 생성되었습니다!');
      }
    } catch (e) {
      console.error(e);
      alert('AI 프로필 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6">
         <div className="relative group">
            <div className="w-28 h-28 bg-indigo-100 dark:bg-indigo-900 rounded-3xl flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden border-4 border-white dark:border-gray-700 shadow-2xl">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    user.username.substring(0,1).toUpperCase()
                )}
            </div>
            <button 
                onClick={handleGenerateAvatar}
                disabled={isGeneratingAvatar}
                className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
                title="AI 아바타 생성 (100P)"
            >
                {isGeneratingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
         </div>
         
         <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                {user.username}
                {user.is_admin && <Award size={20} className="text-yellow-500" />}
            </h2>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-4 uppercase tracking-widest font-mono">NODE_CONNECTED: 2024.01.01</div>
            
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
                  <div className="text-[10px] text-gray-400 uppercase font-black">NODES</div>
                  <div className="font-black text-gray-800 dark:text-white text-lg">{posts.length}</div>
               </div>
            </div>
         </div>
         
         <div className="w-full md:w-64 space-y-4">
            <div>
                <div className="text-[10px] flex justify-between mb-1 text-gray-400 uppercase font-black">
                   <span>Sync Progress</span>
                   <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <button 
              onClick={handleAttendance}
              disabled={checkedIn}
              className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${checkedIn ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              <Calendar size={18}/> {checkedIn ? '연결 완료' : '데일리 노드 체크인'}
            </button>
         </div>
      </div>

      {/* AI Avatar Section Info */}
      <div className="bg-indigo-600/5 border border-indigo-600/20 p-4 rounded-3xl flex items-center gap-4">
         <div className="p-3 bg-indigo-600 text-white rounded-2xl">
            <Camera size={20} />
         </div>
         <div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-white">AI 아바타 제너레이터</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gemini 2.5를 사용하여 나만의 고유한 아바타를 생성하세요 (100P 소모)</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <Edit3 size={18} className="text-indigo-500"/> 내 기록물
           </h3>
           <ul className="space-y-3">
             {posts.slice(0, 5).map(p => (
               <li key={p.id} className="text-sm flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0">
                 <span className="truncate flex-1 text-gray-700 dark:text-gray-300 font-medium">{p.title}</span>
                 <span className="text-[10px] text-gray-400 font-mono ml-2">{new Date(p.created_at).toLocaleDateString()}</span>
               </li>
             ))}
             {posts.length === 0 && <div className="text-gray-400 text-xs text-center py-8 italic font-mono uppercase">No records found</div>}
           </ul>
        </div>

        {/* Recent Comments */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-5">
           <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
             <MessageCircle size={18} className="text-indigo-500"/> 내 전송 기록
           </h3>
           <ul className="space-y-3">
             {comments.slice(0, 5).map(c => (
               <li key={c.id} className="text-sm flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0">
                 <span className="truncate flex-1 text-gray-700 dark:text-gray-300 font-medium">{c.content}</span>
                 <span className="text-[10px] text-gray-400 font-mono ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
               </li>
             ))}
             {comments.length === 0 && <div className="text-gray-400 text-xs text-center py-8 italic font-mono uppercase">No transmissions found</div>}
           </ul>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
