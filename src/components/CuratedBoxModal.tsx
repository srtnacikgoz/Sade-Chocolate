import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { X, ShoppingCart } from 'lucide-react';

interface CuratedBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteProducts: Product[];
}

export const CuratedBoxModal: React.FC<CuratedBoxModalProps> = ({ isOpen, onClose, favoriteProducts }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const handleToggleProduct = (product: Product) => {
    setSelectedProducts(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  };

  const handleAddSelectedToCart = () => {
    selectedProducts.forEach(p => addToCart(p));
    onClose();
  };

  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((total, p) => total + p.price, 0);
  }, [selectedProducts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('create_custom_box')}</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto mb-4">
          {favoriteProducts.map(product => (
            <div
              key={product.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${selectedProducts.find(p => p.id === product.id) ? 'bg-green-100' : ''}`}
              onClick={() => handleToggleProduct(product)}
            >
              <div className="flex items-center">
                <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-md mr-4" />
                <div>
                  <h3 className="font-bold">{product.title}</h3>
                  <p className="text-sm text-gray-500">₺{product.price.toFixed(2)}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!selectedProducts.find(p => p.id === product.id)}
                readOnly
                className="form-checkbox h-5 w-5 text-green-600"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-lg font-bold">{t('total') || 'Toplam'}:</span>
            <span className="text-lg ml-2">₺{totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={handleAddSelectedToCart}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg"
            disabled={selectedProducts.length === 0}
          >
            <ShoppingCart size={20} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  );
};
