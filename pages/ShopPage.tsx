
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS, storage } from '../services/storage';
import { ShoppingBag, Check, AlertCircle, Loader2 } from 'lucide-react';

const ShopPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isBuying, setIsBuying] = useState<string | null>(null);

  const handleBuy = async (itemId: string) => {
      if (!user) return alert('로그인이 필요합니다.');
      if (confirm('구매하시겠습니까?')) {
          setIsBuying(itemId);
          const success = await storage.buyItem(user.id, itemId);
          if (success) {
              alert('구매가 완료되었습니다!');
              refreshUser();
          } else {
              alert('포인트가 부족하거나 이미 보유한 아이템입니다.');
          }
          setIsBuying(null);
      }
  };

  if (!user) return <div className="p-8 text-center animate-pulse">커넥션 로딩 중...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-indigo-600 rounded-3xl p-6 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="relative z-10">
               <h1 className="text-2xl font-black flex items-center gap-2"><ShoppingBag /> 포인트 넥서스</h1>
               <p className="text-indigo-100 text-sm mt-1">에너지를 소비하여 고유 식별자를 강화하세요.</p>
           </div>
           <div className="text-right relative z-10">
               <div className="text-[10px] text-indigo-200 uppercase font-bold">Available Energy</div>
               <div className="text-3xl font-black">{user.points.toLocaleString()} P</div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {SHOP_ITEMS.map(item => {
               const isOwned = user.inventory.includes(item.id);
               return (
                   <div key={item.id} className={`bg-white dark:bg-gray-800 border rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden transition-all ${isOwned ? 'border-indigo-200 dark:border-indigo-900 opacity-80' : 'border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1'}`}>
                       {isOwned && <div className="absolute top-3 right-3 text-indigo-500"><Check size={20} /></div>}
                       <div>
                           <div className="text-4xl mb-4 bg-gray-50 dark:bg-gray-700 w-16 h-16 flex items-center justify-center rounded-2xl shadow-inner">{item.icon}</div>
                           <h3 className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</h3>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{item.description}</p>
                           <div className="mt-5 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
                               <span className="text-[10px] text-gray-400 block mb-1 uppercase font-bold tracking-tighter">Preview Fragment</span>
                               <span className="text-sm" style={{
                                   color: item.type === 'color' ? item.value : user.active_items?.name_color,
                                   fontWeight: (item.type === 'style' && item.value === 'bold') ? 'bold' : 'normal'
                               }}>
                                   {(item.type === 'badge' ? item.value + ' ' : (user.active_items?.badge || '') + ' ')} 
                                   {user.username}
                               </span>
                           </div>
                       </div>
                       <button 
                         onClick={() => handleBuy(item.id)}
                         disabled={isOwned || isBuying === item.id}
                         className={`mt-6 w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg ${isOwned ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                       >
                           {isOwned ? '보유 중' : isBuying === item.id ? <Loader2 size={18} className="animate-spin mx-auto"/> : `${item.price} P 구매`}
                       </button>
                   </div>
               )
           })}
       </div>
    </div>
  );
};

export default ShopPage;
