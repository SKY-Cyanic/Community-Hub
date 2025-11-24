import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/api';
import { WikiPage as WikiPageType } from '../types';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Edit, Save, Clock, Search } from 'lucide-react';

const { useSearchParams } = ReactRouterDOM as any;

const WikiPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const docSlug = searchParams.get('doc') || 'main';
  
  const [doc, setDoc] = useState<WikiPageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [recentDocs, setRecentDocs] = useState<WikiPageType[]>([]);
  const { user } = useAuth();

  useEffect(() => {
      loadDoc(docSlug);
      loadRecent();
  }, [docSlug]);

  const loadRecent = async () => {
      const pages = await api.getWikiPages();
      setRecentDocs(pages.sort((a,b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()).slice(0, 5));
  };

  const loadDoc = async (slug: string) => {
      const page = await api.getWikiPage(slug);
      if (page) {
          setDoc(page);
          setEditContent(page.content);
      } else {
          setDoc({ slug, title: slug, content: '아직 문서가 없습니다. 문서를 작성해보세요!', last_updated: new Date().toISOString(), last_editor: '' });
          setEditContent('아직 문서가 없습니다. 문서를 작성해보세요!');
      }
      setIsEditing(false);
  };

  const handleSave = async () => {
      if(!user) return alert('로그인이 필요합니다.');
      if(!doc) return;

      const updatedDoc: WikiPageType = {
          ...doc,
          content: editContent,
          last_updated: new Date().toISOString(),
          last_editor: user.username
      };

      await api.saveWikiPage(updatedDoc);
      setDoc(updatedDoc);
      setIsEditing(false);
      loadRecent();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm min-h-[500px]">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <BookOpen className="text-indigo-600" /> 
                    {doc?.title === 'main' ? 'K-Wiki 대문' : doc?.title}
                </h1>
                {user && (
                    <button 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white hover:bg-gray-50'}`}
                    >
                        {isEditing ? <><Save size={14}/> 저장</> : <><Edit size={14}/> 편집</>}
                    </button>
                )}
            </div>
            
            <div className="p-6">
                {isEditing ? (
                    <textarea 
                        className="w-full h-[400px] p-4 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                ) : (
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        {doc?.content}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-end gap-4">
                <span>마지막 수정: {new Date(doc?.last_updated || '').toLocaleString()}</span>
                <span>수정자: {doc?.last_editor || '-'}</span>
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                 <div className="relative mb-4">
                     <input 
                       type="text" 
                       placeholder="위키 문서 검색..." 
                       className="w-full border border-gray-300 dark:border-gray-600 rounded pl-8 p-2 text-sm dark:bg-gray-700 dark:text-white"
                       onKeyDown={(e) => {
                           if(e.key === 'Enter') {
                               setSearchParams({ doc: e.currentTarget.value });
                           }
                       }}
                     />
                     <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                 </div>
                 
                 <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                     <Clock size={14}/> 최근 변경 문서
                 </h3>
                 <ul className="space-y-1">
                     {recentDocs.map(p => (
                         <li key={p.slug}>
                             <button 
                                onClick={() => setSearchParams({ doc: p.slug })}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate w-full text-left"
                             >
                                 {p.title}
                             </button>
                         </li>
                     ))}
                     <li className="pt-2 border-t border-gray-100 dark:border-gray-700">
                         <button onClick={() => setSearchParams({ doc: 'main' })} className="text-xs font-bold text-gray-500 hover:text-gray-800">대문으로 가기</button>
                     </li>
                 </ul>
            </div>
        </div>
    </div>
  );
};

export default WikiPage;