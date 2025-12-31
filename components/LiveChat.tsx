
import React, { useEffect, useState, useRef } from 'react';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

const LiveChat: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        const fetchMessages = () => {
            setMessages(storage.getChatMessages());
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
      if (isOpen) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() || !user) return;

      const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          user_id: user.id,
          username: user.username,
          text: inputText,
          timestamp: new Date().toISOString(),
          user_level: user.level
      };

      storage.sendChatMessage(newMsg);
      setInputText('');
      setMessages(prev => [...prev, newMsg]);
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-40 right-4 md:bottom-28 md:right-8 bg-indigo-600 text-white p-4 rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:bg-indigo-700 transition-all hover:scale-110 active:scale-90 z-[130]"
            title="실시간 채팅"
          >
              <MessageCircle size={24} />
          </button>
      );
  }

  return (
    <div className="fixed bottom-24 right-4 md:bottom-24 md:right-8 w-[90vw] max-w-[340px] h-[450px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl flex flex-col z-[160] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-lg">
            <div className="font-bold text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                LIVE NEXUS
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-xl transition-colors"><Minimize2 size={18} /></button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 && (
                <div className="text-center text-[10px] text-gray-400 mt-20 uppercase tracking-[0.3em] font-mono">Standby for data...</div>
            )}
            {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                         <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">{msg.username}</span>
                         <span className="text-[9px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 font-bold">LV.{msg.user_level}</span>
                    </div>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] shadow-sm leading-snug ${
                        msg.user_id === user?.id 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={user ? "연결된 노드에 메시지 전송..." : "로그인 필요"}
              disabled={!user}
              className="flex-1 text-sm border-none bg-gray-100 dark:bg-gray-700 dark:text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button type="submit" disabled={!user || !inputText.trim()} className="bg-indigo-600 text-white p-2.5 rounded-2xl hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-95 shadow-md">
                <Send size={20} />
            </button>
        </form>
    </div>
  );
};

export default LiveChat;
