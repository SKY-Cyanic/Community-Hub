
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS, storage } from '../services/storage';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';

const ShopPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const handleBuy = (itemId: string) => {
      if (!user) return alert('로그인이 필요합니다.');
      if (confirm('구매하시겠습니까?')) {
          const success = storage.buyItem(user.id, itemId);
          if (success) {
              alert('구매가 완료되었습니다!');
              refreshUser();
          } else {
              alert('포인트가 부족하거나 이미 보유한 아이템입니다.');
          }
      }
  };

  if (!user) return <div className="p-8 text-center">로그인이 필요한 서비스입니다.</div>;

  return (
    <div className="space-y-6">
       <div className="bg-indigo-600 rounded-sm p-6 text-white flex justify-between items-center shadow-md">
           <div>
               <h1 className="text-2xl font-black flex items-center gap-2"><ShoppingBag /> 포인트 상점</h1>
               <p className="text-indigo-100 text-sm mt-1">모은 포인트로 나만의 개성을 뽐내보세요!</p>
           </div>
           <div className="text-right">
               <div className="text-xs text-indigo-200">보유 포인트</div>
               <div className="text-3xl font-bold">{user.points.toLocaleString()} P</div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {SHOP_ITEMS.map(item => {
               const isOwned = user.inventory.includes(item.id);
               return (
                   <div key={item.id} className={`bg-white dark:bg-gray-800 border rounded-sm p-4 flex flex-col justify-between relative overflow-hidden transition-all ${isOwned ? 'border-indigo-200 dark:border-indigo-900 opacity-80' : 'border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1'}`}>
                       {isOwned && (
                           <div className="absolute top-2 right-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900 rounded-full p-1">
                               <Check size={16} />
                           </div>
                       )}
                       <div>
                           <div className="text-4xl mb-3">{item.icon}</div>
                           <h3 className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                           
                           {/* Preview */}
                           <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
                               <span className="text-xs text-gray-400 block mb-1">미리보기</span>
                               <span style={{
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
                         disabled={isOwned}
                         className={`mt-4 w-full py-2 rounded font-bold text-sm ${isOwned ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                       >
                           {isOwned ? '보유중' : `${item.price} P 구매`}
                       </button>
                   </div>
               )
           })}
       </div>

       <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-100 dark:border-yellow-900/50 flex gap-3 items-start">
           <AlertCircle className="text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" size={18}/>
           <div className="text-sm text-yellow-800 dark:text-yellow-200">
               <p className="font-bold">구매 안내</p>
               <p>아이템은 구매 즉시 자동으로 적용됩니다. 이미 보유한 아이템은 중복 구매할 수 없습니다.</p>
           </div>
       </div>
    </div>
  );
};

export default ShopPage;
