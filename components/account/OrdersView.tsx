import React from 'react';
import { Order } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';

interface OrdersViewProps {
  orders: Order[];
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders }) => {
  const { t } = useLanguage();

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-dark-800 rounded-3xl animate-fade-in">
        <span className="material-icons-outlined text-4xl text-gray-300 mb-2">shopping_bag</span>
        <p className="text-sm text-gray-500">Henüz bir siparişiniz bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {orders.map(order => (
        <div key={order.id} className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-display font-bold text-gray-900 dark:text-white block">{order.id}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{order.date}</span>
            </div>
            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
              order.status.includes('Bekleniyor') ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="relative group shrink-0">
                <img src={item.image} alt="" className="w-12 h-12 rounded-md object-cover bg-white border border-gray-100 dark:border-gray-700" />
                <span className="absolute -top-1 -right-1 bg-brown-900 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-3">
            <span className="text-xs font-medium text-gray-500">{t('subtotal')}</span>
            <span className="font-bold text-gray-900 dark:text-white">₺{order.total.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};