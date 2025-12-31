
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Conversation, PrivateMessage } from '../types';
import { useSearchParams } from 'react-router-dom';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [searchParams] = useSearchParams();
  const targetUsername = searchParams.get('target');

  useEffect(() => {
      if (!user) return;
      const unsub = storage.subscribeConversations(user.id, setConversations);
      return () => unsub();
  }, [user]);

  // Handle direct link from profile (e.g. ?target=username)
  useEffect(() => {
      const initChat = async () => {
          if (targetUsername && user) {
              const targetUser = storage.getUser(targetUsername);
              if (targetUser) {
                  const convId = await storage.getOrCreateConversation(user.id, targetUser.id);
                  setActiveConvId(convId);
              }
          }
      };
      initChat();
  }, [targetUsername, user]);

  useEffect(() => {
      if (!activeConvId) return;
      const unsub = storage.subscribeMessages(activeConvId, setMessages);
      return () => unsub();
  }, [activeConvId]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeConvId || !user) return;

      const currentConv = conversations.find(c => c.id === activeConvId);
      if(!currentConv) return;
      
      const targetId = currentConv.participants.find(id => id !== user.id);
      if(!targetId) return;

      await storage.sendMessage(activeConvId, user.id, newMessage, targetId);
      setNewMessage('');
  };

  if (!user) return <div className="p-10 text-center">로그인이 필요합니다.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm min-h-[600px] flex overflow-hidden">
        {/* Sidebar List */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold dark:text-white flex items-center gap-2">
                <MessageSquare className="text-indigo-500" /> 메시지함
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && <div className="p-6 text-center text-sm text-gray-400">대화 내역이 없습니다.</div>}
                {conversations.map(conv => {
                    const otherId = conv.participants.find(p => p !== user.id) || '';
                    const otherUser = storage.getUsers().find(u => u.id === otherId);
                    return (
                        <button 
                            key={conv.id}
                            onClick={() => setActiveConvId(conv.id)}
                            className={`w-full text-left p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeConvId === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <UserIcon size={14} className="text-gray-400"/>
                                    {otherUser?.username || '알 수 없음'}
                                </span>
                                <span className="text-[10px] text-gray-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{conv.last_message}</div>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 flex flex-col ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
            {!activeConvId ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                    <MessageSquare size={48} className="opacity-20"/>
                    대화를 선택하세요
                </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                        <button onClick={() => setActiveConvId(null)} className="md:hidden text-xs text-indigo-500 font-bold">← 뒤로</button>
                        <span className="font-bold text-sm dark:text-white">
                            {(() => {
                                const conv = conversations.find(c => c.id === activeConvId);
                                const otherId = conv?.participants.find(p => p !== user.id);
                                const otherUser = storage.getUsers().find(u => u.id === otherId);
                                return otherUser?.username || '상대방';
                            })()}
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                                    msg.sender_id === user.id 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                            placeholder="메시지를 입력하세요..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700">
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    </div>
  );
};

export default MessagesPage;
