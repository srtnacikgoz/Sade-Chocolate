import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { ProductForm } from '../components/admin/ProductForm';

export const Admin: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const initialFormState: Product = {
    id: '', title: '', description: '', detailedDescription: '', price: 0, currency: '₺', image: '', category: 'tablet',
    origin: '', tastingNotes: '', ingredients: '', allergens: '',
    sensory: { intensity: 50, sweetness: 50, creaminess: 50, fruitiness: 50, acidity: 50, crunch: 50 }
  };

  const [form, setForm] = useState<Product>(initialFormState);

  const handleEdit = (product: Product) => {
    setForm(product);
    setEditingId(product.id);
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setForm({ ...initialFormState, id: `p${Date.now()}` });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) addProduct(form);
    else if (editingId) updateProduct(editingId, form);
    setEditingId(null);
    setIsAdding(false);
    setForm(initialFormState);
  };

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Yönetim Paneli</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Sade Chocolate Katalog Yönetimi</p>
        </div>
        {!isAdding && !editingId && (
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-brown-900 text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-gold transition-colors">
            <span className="material-icons-outlined text-sm">add</span> Yeni Ürün
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <ProductForm 
          form={form} 
          setForm={setForm} 
          onSave={handleSave} 
          onCancel={() => {setEditingId(null); setIsAdding(false);}} 
          isAdding={isAdding} 
        />
      )}

      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-white dark:bg-dark-900 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
              <img src={product.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-gray-900 dark:text-white truncate">{product.title}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{product.category} • {product.currency}{product.price}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(product)} className="p-2 bg-white dark:bg-dark-900 text-gray-400 hover:text-blue-500 rounded-full transition-colors"><span className="material-icons-outlined text-xl">edit</span></button>
              <button onClick={() => {if(confirm('Emin misiniz?')) deleteProduct(product.id)}} className="p-2 bg-white dark:bg-dark-900 text-gray-400 hover:text-red-500 rounded-full transition-colors"><span className="material-icons-outlined text-xl">delete</span></button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};