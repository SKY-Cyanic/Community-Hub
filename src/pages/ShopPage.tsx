
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS } from '../services/storage'; // 아이템 목록은 그대로 유지
import { api } from '../services/api';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';

const ShopPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const handleBuy = async (itemId: string) => {
      if (!user) return alert('로그인이 필요합니다.');
      if (confirm('구매하시겠습니까?')) {
          try {
            const success = await api.buyItem(user.id, itemId);
            if (success) {
                alert('구매가 완료되었습니다!');
                refreshUser();
            } else {
                alert('포인트가 부족하거나 이미 보유한 아이템입니다.');
            }
          } catch (e) {
              alert('구매 중 오류가 발생했습니다.');
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
               const isOwned = user.inventory && user.inventory.includes(item.id);
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
    </div>
  );
};

export default ShopPage;
