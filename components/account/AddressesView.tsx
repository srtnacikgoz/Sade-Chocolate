
import React, { useState } from 'react';
import { useUser, UserAddress } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
// Fixed: Corrected import source for Button component
import { Button } from '../ui/Button';

export const AddressesView: React.FC = () => {
  const { addresses, addAddress, deleteAddress, setDefaultAddress, updateAddress } = useUser();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', city: '', address: '' });

  const handleOpen = (addr?: UserAddress) => {
    if (addr) {
      setEditingId(addr.id);
      setForm({ title: addr.title, city: addr.city, address: addr.address });
    } else {
      setEditingId(null);
      setForm({ title: '', city: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateAddress(editingId, form);
    else addAddress({ ...form, isDefault: false });
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {addresses.map(addr => (
        <div key={addr.id} className={`p-4 border rounded-xl relative ${addr.isDefault ? 'border-gold bg-gold/5' : 'border-gray-100 dark:border-gray-800'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-sm dark:text-white">{addr.title}</span>
            {addr.isDefault && <span className="text-[10px] font-bold text-gold uppercase">{t('default_badge')}</span>}
          </div>
          <p className="text-xs text-gray-500">{addr.address} / {addr.city}</p>
          <div className="mt-3 flex gap-3">
            <button onClick={() => handleOpen(addr)} className="text-[10px] font-bold uppercase text-brown-900 dark:text-white">{t('edit_address')}</button>
            <button onClick={() => deleteAddress(addr.id)} className="text-[10px] font-bold uppercase text-red-500">{t('delete')}</button>
            {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-[10px] font-bold uppercase text-gray-400">{t('set_default')}</button>}
          </div>
        </div>
      ))}
      <button onClick={() => handleOpen()} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 text-xs font-bold">+ {t('add_new_address')}</button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form onSubmit={handleSave} className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-2xl p-6 relative z-10 animate-fade-in shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold dark:text-white">{editingId ? t('edit_address') : t('add_new_address')}</h3>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder={t('address_title')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" required />
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder={t('city')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" required />
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={t('full_address')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm h-24 resize-none dark:text-white outline-none" required />
            {/* Changed from native button to themed Button component */}
            <Button type="submit" className="w-full py-3 bg-brown-900 text-white rounded-xl font-bold uppercase text-xs">{t('save')}</Button>
          </form>
        </div>
      )}
    </div>
  );
};
