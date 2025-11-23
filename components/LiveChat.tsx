
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

  // Poll messages
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
      // Optimistic update
      setMessages(prev => [...prev, newMsg]);
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 z-50"
          >
              <MessageCircle size={24} />
          </button>
      );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
            <div className="font-bold text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                실시간 채팅
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)}><Minimize2 size={16} /></button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
            {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                         <span className="text-[10px] text-gray-500 dark:text-gray-400">{msg.username}</span>
                         <span className="text-[9px] px-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500">Lv.{msg.user_level}</span>
                    </div>
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
                        msg.user_id === user?.id 
                        ? 'bg-indigo-500 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={user ? "메시지 입력..." : "로그인 필요"}
              disabled={!user}
              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <button type="submit" disabled={!user} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 disabled:opacity-50">
                <Send size={16} />
            </button>
        </form>
    </div>
  );
};

export default LiveChat;
