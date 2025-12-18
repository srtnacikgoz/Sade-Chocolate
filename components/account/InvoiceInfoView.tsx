import React, { useState } from 'react';
import { useUser, InvoiceProfile } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';

export const InvoiceInfoView: React.FC = () => {
  const { invoiceProfiles, addInvoiceProfile, updateInvoiceProfile, deleteInvoiceProfile } = useUser();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [type, setType] = useState<'individual' | 'corporate'>('individual');
  const [form, setForm] = useState({ title: '', firstName: '', lastName: '', tckn: '', companyName: '', taxOffice: '', taxNo: '', city: '', address: '' });

  const handleOpen = (profile?: InvoiceProfile) => {
    if (profile) {
      setEditingId(profile.id);
      setType(profile.type);
      setForm({
        title: profile.title,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        tckn: profile.tckn || '',
        companyName: profile.companyName || '',
        taxOffice: profile.taxOffice || '',
        taxNo: profile.taxNo || '',
        city: profile.city,
        address: profile.address
      });
    } else {
      setEditingId(null);
      setType('individual');
      setForm({ title: '', firstName: '', lastName: '', tckn: '', companyName: '', taxOffice: '', taxNo: '', city: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form, type };
    if (editingId) updateInvoiceProfile(editingId, data);
    else addInvoiceProfile(data);
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {invoiceProfiles.map(profile => (
        <div key={profile.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-dark-800">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm dark:text-white">{profile.title}</span>
            <span className="text-[8px] font-bold px-2 py-0.5 bg-white dark:bg-dark-900 rounded uppercase text-gray-400">{profile.type === 'corporate' ? t('corporate') : t('individual')}</span>
          </div>
          <p className="text-xs text-gray-500">{profile.type === 'corporate' ? profile.companyName : `${profile.firstName} ${profile.lastName}`}</p>
          <div className="mt-3 flex gap-3">
            <button onClick={() => handleOpen(profile)} className="text-[10px] font-bold uppercase text-brown-900 dark:text-white">{t('edit_invoice_profile')}</button>
            <button onClick={() => deleteInvoiceProfile(profile.id)} className="text-[10px] font-bold uppercase text-red-500">{t('delete')}</button>
          </div>
        </div>
      ))}
      <button onClick={() => handleOpen()} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 text-xs font-bold">+ {t('add_invoice_profile')}</button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form onSubmit={handleSave} className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-2xl p-6 relative z-10 animate-fade-in shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-display text-lg font-bold dark:text-white">{t('invoice_info')}</h3>
            <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-lg">
                <button type="button" onClick={() => setType('individual')} className={`flex-1 py-2 text-[10px] font-bold rounded-md ${type === 'individual' ? 'bg-white dark:bg-dark-900 text-brown-900' : 'text-gray-400'}`}>BİREYSEL</button>
                <button type="button" onClick={() => setType('corporate')} className={`flex-1 py-2 text-[10px] font-bold rounded-md ${type === 'corporate' ? 'bg-white dark:bg-dark-900 text-brown-900' : 'text-gray-400'}`}>KURUMSAL</button>
            </div>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder={t('address_title')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" required />
            {type === 'individual' ? (
                <>
                    <div className="flex gap-2">
                        <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder={t('first_name')} className="flex-1 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                        <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder={t('last_name')} className="flex-1 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                    </div>
                    <input value={form.tckn} onChange={e => setForm({...form, tckn: e.target.value})} placeholder={t('tckn')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                </>
            ) : (
                <>
                    <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder={t('company_name')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                    <div className="flex gap-2">
                        <input value={form.taxOffice} onChange={e => setForm({...form, taxOffice: e.target.value})} placeholder={t('tax_office')} className="flex-1 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                        <input value={form.taxNo} onChange={e => setForm({...form, taxNo: e.target.value})} placeholder={t('tax_no')} className="flex-1 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
                    </div>
                </>
            )}
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder={t('city')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm dark:text-white outline-none" />
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={t('full_address')} className="w-full p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm h-20 resize-none dark:text-white outline-none" />
            <button type="submit" className="w-full py-3 bg-brown-900 text-white rounded-xl font-bold uppercase text-xs">{t('save')}</button>
          </form>
        </div>
      )}
    </div>
  );
};