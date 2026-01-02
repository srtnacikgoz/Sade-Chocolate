import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CompanyInfo, Branch, BankAccount, BankTransferSettings } from '../../../types';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Clock,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Landmark,
  CreditCard,
  Copy,
  Check,
  Percent,
  Timer,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  id: 'default',
  companyName: 'Sade Patisserie',
  brandName: 'Sade Chocolate',
  slogan: 'Hile Yok, Kalite Var.',
  foundedYear: 2016,
  founderName: 'Sertan Açıkgöz',
  generalEmail: 'bilgi@sadepatisserie.com',
  supportEmail: 'destek@sadepatisserie.com',
  generalPhone: '0552 896 30 26',
  whatsappBusiness: '905528963026',
  socialMedia: {
    instagram: 'sadepatisserie',
    facebook: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    linkedin: ''
  },
  branches: [
    {
      id: 'yesilbahce',
      name: 'Yeşilbahçe Şubesi',
      address: 'Yeşilbahçe Mah. Çınarlı Cad. No:47/A',
      district: 'Muratpaşa',
      city: 'Antalya',
      phone: '0552 896 30 26',
      whatsapp: '905528963026',
      email: 'yesilbahce@sadepatisserie.com',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Yeşilbahçe',
      workingHours: {
        weekdays: '09:00 - 21:00',
        saturday: '09:00 - 21:00',
        sunday: '10:00 - 20:00'
      },
      isActive: true,
      isPrimary: true
    },
    {
      id: 'caglayan',
      name: 'Çağlayan Şubesi',
      address: 'Çağlayan Mah. 2050 Sokak No:19',
      district: 'Muratpaşa',
      city: 'Antalya',
      phone: '0552 896 30 26',
      whatsapp: '905528963026',
      email: 'caglayan@sadepatisserie.com',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Sade+Patisserie+Çağlayan',
      workingHours: {
        weekdays: '09:00 - 21:00',
        saturday: '09:00 - 21:00',
        sunday: '10:00 - 20:00'
      },
      isActive: true,
      isPrimary: false
    }
  ],
  bankAccounts: [
    {
      id: 'bank_1',
      bankName: '',
      accountHolder: 'Sade Patisserie',
      iban: '',
      currency: 'TRY',
      isActive: true
    }
  ],
  bankTransferSettings: {
    isEnabled: true,
    discountPercent: 2,
    paymentDeadlineHours: 12,
    autoCancel: true,
    minOrderAmount: 0
  },
  taxOffice: '',
  taxNumber: '',
  tradeRegisterNo: '',
  mersisNo: ''
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-brown-900 text-white rounded-xl flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  prefix?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', icon, prefix }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-12' : prefix ? 'pl-16' : 'px-4'} pr-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white transition-all`}
      />
    </div>
  </div>
);

interface BranchCardProps {
  branch: Branch;
  index: number;
  onUpdate: (index: number, updates: Partial<Branch>) => void;
  onDelete: (index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const BranchCard: React.FC<BranchCardProps> = ({ branch, index, onUpdate, onDelete, isExpanded, onToggle }) => (
  <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Header */}
    <div
      className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${branch.isPrimary ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-dark-900 text-gray-500'}`}>
          <MapPin size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 dark:text-white">{branch.name || 'Yeni Şube'}</h4>
            {branch.isPrimary && <span className="text-[9px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-bold">ANA ŞUBE</span>}
            {!branch.isActive && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">PASİF</span>}
          </div>
          <p className="text-xs text-gray-400">{branch.address || 'Adres girilmedi'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>
    </div>

    {/* Expanded Content */}
    {isExpanded && (
      <div className="p-5 pt-0 border-t border-gray-100 dark:border-gray-700 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
          <InputField
            label="Şube Adı"
            value={branch.name}
            onChange={(v) => onUpdate(index, { name: v })}
            placeholder="Yeşilbahçe Şubesi"
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Durum</label>
              <select
                value={branch.isActive ? 'active' : 'inactive'}
                onChange={(e) => onUpdate(index, { isActive: e.target.value === 'active' })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={branch.isPrimary || false}
                  onChange={(e) => onUpdate(index, { isPrimary: e.target.checked })}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">Ana Şube</span>
              </label>
            </div>
          </div>
        </div>

        <InputField
          label="Adres"
          value={branch.address}
          onChange={(v) => onUpdate(index, { address: v })}
          placeholder="Yeşilbahçe Mah. Çınarlı Cad. No:47/A"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="İlçe"
            value={branch.district}
            onChange={(v) => onUpdate(index, { district: v })}
            placeholder="Muratpaşa"
          />
          <InputField
            label="Şehir"
            value={branch.city}
            onChange={(v) => onUpdate(index, { city: v })}
            placeholder="Antalya"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Telefon"
            value={branch.phone}
            onChange={(v) => onUpdate(index, { phone: v })}
            placeholder="0552 896 30 26"
            icon={<Phone size={16} />}
          />
          <InputField
            label="WhatsApp"
            value={branch.whatsapp || ''}
            onChange={(v) => onUpdate(index, { whatsapp: v })}
            placeholder="905528963026"
          />
        </div>

        <InputField
          label="E-posta"
          value={branch.email || ''}
          onChange={(v) => onUpdate(index, { email: v })}
          placeholder="yesilbahce@sadepatisserie.com"
          icon={<Mail size={16} />}
        />

        <InputField
          label="Harita Linki"
          value={branch.mapLink}
          onChange={(v) => onUpdate(index, { mapLink: v })}
          placeholder="https://www.google.com/maps/..."
          icon={<ExternalLink size={16} />}
        />

        {/* Working Hours */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            <Clock size={14} className="inline mr-2" />
            Çalışma Saatleri
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-gray-400 mb-1 block">Hafta İçi</span>
              <input
                type="text"
                value={branch.workingHours?.weekdays || ''}
                onChange={(e) => onUpdate(index, { workingHours: { ...branch.workingHours, weekdays: e.target.value } })}
                placeholder="09:00 - 21:00"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
              />
            </div>
            <div>
              <span className="text-xs text-gray-400 mb-1 block">Cumartesi</span>
              <input
                type="text"
                value={branch.workingHours?.saturday || ''}
                onChange={(e) => onUpdate(index, { workingHours: { ...branch.workingHours, saturday: e.target.value } })}
                placeholder="09:00 - 21:00"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
              />
            </div>
            <div>
              <span className="text-xs text-gray-400 mb-1 block">Pazar</span>
              <input
                type="text"
                value={branch.workingHours?.sunday || ''}
                onChange={(e) => onUpdate(index, { workingHours: { ...branch.workingHours, sunday: e.target.value } })}
                placeholder="10:00 - 20:00"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Bank Account Card Component
interface BankAccountCardProps {
  account: BankAccount;
  index: number;
  onUpdate: (index: number, updates: Partial<BankAccount>) => void;
  onDelete: (index: number) => void;
}

const BankAccountCard: React.FC<BankAccountCardProps> = ({ account, index, onUpdate, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const copyIban = () => {
    if (account.iban) {
      navigator.clipboard.writeText(account.iban);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('IBAN kopyalandı');
    }
  };

  const currencyLabels = {
    TRY: '₺ Türk Lirası',
    USD: '$ Dolar',
    EUR: '€ Euro'
  };

  return (
    <div className={`bg-white dark:bg-dark-800 rounded-2xl border ${account.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-800'} p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${account.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
            <Landmark size={18} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">{account.bankName || 'Banka Adı'}</h4>
            <span className={`text-xs ${account.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
              {account.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Banka Adı"
            value={account.bankName}
            onChange={(v) => onUpdate(index, { bankName: v })}
            placeholder="Ziraat Bankası"
            icon={<Landmark size={16} />}
          />
          <InputField
            label="Hesap Sahibi"
            value={account.accountHolder}
            onChange={(v) => onUpdate(index, { accountHolder: v })}
            placeholder="Sade Patisserie"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">IBAN</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={account.iban}
                onChange={(e) => onUpdate(index, { iban: e.target.value.toUpperCase() })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white font-mono tracking-wider"
              />
            </div>
            <button
              onClick={copyIban}
              className={`px-4 py-3 rounded-xl transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-dark-900 text-gray-500 hover:bg-gray-200'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Para Birimi</label>
            <select
              value={account.currency}
              onChange={(e) => onUpdate(index, { currency: e.target.value as 'TRY' | 'USD' | 'EUR' })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
            >
              <option value="TRY">{currencyLabels.TRY}</option>
              <option value="USD">{currencyLabels.USD}</option>
              <option value="EUR">{currencyLabels.EUR}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Durum</label>
            <select
              value={account.isActive ? 'active' : 'inactive'}
              onChange={(e) => onUpdate(index, { isActive: e.target.value === 'active' })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brown-900/20 dark:text-white"
            >
              <option value="active">Aktif - Görünür</option>
              <option value="inactive">Pasif - Gizli</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompanyInfoTab: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<number | null>(0);

  // Load from Firebase
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'company_info');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCompanyInfo({ ...DEFAULT_COMPANY_INFO, ...docSnap.data() } as CompanyInfo);
        } else {
          // Initialize with defaults
          await setDoc(docRef, DEFAULT_COMPANY_INFO);
        }
      } catch (error) {
        console.error('Error loading company info:', error);
        toast.error('Şirket bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyInfo();
  }, []);

  // Save to Firebase
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_settings', 'company_info');
      await setDoc(docRef, {
        ...companyInfo,
        updatedAt: new Date().toISOString()
      });
      toast.success('Şirket bilgileri kaydedildi!');
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const updateBranch = (index: number, updates: Partial<Branch>) => {
    const newBranches = [...companyInfo.branches];
    newBranches[index] = { ...newBranches[index], ...updates };

    // If setting as primary, remove primary from others
    if (updates.isPrimary) {
      newBranches.forEach((b, i) => {
        if (i !== index) b.isPrimary = false;
      });
    }

    setCompanyInfo({ ...companyInfo, branches: newBranches });
  };

  const addBranch = () => {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name: '',
      address: '',
      district: '',
      city: 'Antalya',
      phone: '',
      mapLink: '',
      workingHours: {
        weekdays: '09:00 - 21:00',
        saturday: '09:00 - 21:00',
        sunday: '10:00 - 20:00'
      },
      isActive: true,
      isPrimary: false
    };
    setCompanyInfo({ ...companyInfo, branches: [...companyInfo.branches, newBranch] });
    setExpandedBranch(companyInfo.branches.length);
  };

  const deleteBranch = (index: number) => {
    if (companyInfo.branches.length <= 1) {
      toast.error('En az bir şube olmalı');
      return;
    }
    const newBranches = companyInfo.branches.filter((_, i) => i !== index);
    setCompanyInfo({ ...companyInfo, branches: newBranches });
    setExpandedBranch(null);
  };

  // Bank Account Management
  const updateBankAccount = (index: number, updates: Partial<BankAccount>) => {
    const newAccounts = [...(companyInfo.bankAccounts || [])];
    newAccounts[index] = { ...newAccounts[index], ...updates };
    setCompanyInfo({ ...companyInfo, bankAccounts: newAccounts });
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: `bank_${Date.now()}`,
      bankName: '',
      accountHolder: companyInfo.companyName || 'Sade Patisserie',
      iban: '',
      currency: 'TRY',
      isActive: true
    };
    setCompanyInfo({ ...companyInfo, bankAccounts: [...(companyInfo.bankAccounts || []), newAccount] });
  };

  const deleteBankAccount = (index: number) => {
    const newAccounts = (companyInfo.bankAccounts || []).filter((_, i) => i !== index);
    setCompanyInfo({ ...companyInfo, bankAccounts: newAccounts });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white italic">Şirket Künyesi</h2>
          <p className="text-sm text-gray-400 mt-1">Tüm şube ve iletişim bilgilerini buradan yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brown-900 text-white rounded-xl hover:bg-gold transition-colors disabled:opacity-50 font-bold text-sm"
        >
          <Save size={18} />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {/* General Info */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <SectionHeader
          icon={<Building2 size={20} />}
          title="Genel Bilgiler"
          subtitle="Şirket ve marka bilgileri"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <InputField
            label="Şirket Adı"
            value={companyInfo.companyName}
            onChange={(v) => setCompanyInfo({ ...companyInfo, companyName: v })}
            placeholder="Sade Patisserie"
          />
          <InputField
            label="Marka Adı"
            value={companyInfo.brandName}
            onChange={(v) => setCompanyInfo({ ...companyInfo, brandName: v })}
            placeholder="Sade Chocolate"
          />
          <InputField
            label="Kuruluş Yılı"
            value={companyInfo.foundedYear?.toString() || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, foundedYear: parseInt(v) || 2016 })}
            type="number"
          />
          <InputField
            label="Kurucu"
            value={companyInfo.founderName}
            onChange={(v) => setCompanyInfo({ ...companyInfo, founderName: v })}
            placeholder="Sertan Açıkgöz"
          />
          <div className="md:col-span-2">
            <InputField
              label="Slogan"
              value={companyInfo.slogan || ''}
              onChange={(v) => setCompanyInfo({ ...companyInfo, slogan: v })}
              placeholder="Hile Yok, Kalite Var."
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <SectionHeader
          icon={<Phone size={20} />}
          title="İletişim Bilgileri"
          subtitle="Genel iletişim kanalları"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Genel E-posta"
            value={companyInfo.generalEmail}
            onChange={(v) => setCompanyInfo({ ...companyInfo, generalEmail: v })}
            placeholder="bilgi@sadepatisserie.com"
            icon={<Mail size={16} />}
          />
          <InputField
            label="Destek E-posta"
            value={companyInfo.supportEmail || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, supportEmail: v })}
            placeholder="destek@sadepatisserie.com"
            icon={<Mail size={16} />}
          />
          <InputField
            label="Genel Telefon"
            value={companyInfo.generalPhone}
            onChange={(v) => setCompanyInfo({ ...companyInfo, generalPhone: v })}
            placeholder="0552 896 30 26"
            icon={<Phone size={16} />}
          />
          <InputField
            label="WhatsApp Business"
            value={companyInfo.whatsappBusiness || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, whatsappBusiness: v })}
            placeholder="905528963026"
          />
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <SectionHeader
          icon={<Globe size={20} />}
          title="Sosyal Medya"
          subtitle="Kullanıcı adlarını girin (@ olmadan)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <InputField
            label="Instagram"
            value={companyInfo.socialMedia?.instagram || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, instagram: v } })}
            placeholder="sadepatisserie"
            icon={<Instagram size={16} />}
          />
          <InputField
            label="Facebook"
            value={companyInfo.socialMedia?.facebook || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, facebook: v } })}
            placeholder="sadepatisserie"
            icon={<Facebook size={16} />}
          />
          <InputField
            label="YouTube"
            value={companyInfo.socialMedia?.youtube || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, youtube: v } })}
            placeholder="@sadepatisserie"
            icon={<Youtube size={16} />}
          />
          <InputField
            label="TikTok"
            value={companyInfo.socialMedia?.tiktok || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, tiktok: v } })}
            placeholder="@sadepatisserie"
          />
          <InputField
            label="Twitter / X"
            value={companyInfo.socialMedia?.twitter || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, twitter: v } })}
            placeholder="sadepatisserie"
          />
          <InputField
            label="LinkedIn"
            value={companyInfo.socialMedia?.linkedin || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, socialMedia: { ...companyInfo.socialMedia, linkedin: v } })}
            placeholder="sade-patisserie"
          />
        </div>
      </div>

      {/* Branches */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={<MapPin size={20} />}
            title="Şubeler"
            subtitle={`${companyInfo.branches.length} şube kayıtlı`}
          />
          <button
            onClick={addBranch}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors text-sm font-bold"
          >
            <Plus size={16} />
            Yeni Şube
          </button>
        </div>
        <div className="space-y-4">
          {companyInfo.branches.map((branch, index) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              index={index}
              onUpdate={updateBranch}
              onDelete={deleteBranch}
              isExpanded={expandedBranch === index}
              onToggle={() => setExpandedBranch(expandedBranch === index ? null : index)}
            />
          ))}
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={<Landmark size={20} />}
            title="Banka Hesapları"
            subtitle="Havale/EFT için hesap bilgileri"
          />
          <button
            onClick={addBankAccount}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors text-sm font-bold"
          >
            <Plus size={16} />
            Yeni Hesap
          </button>
        </div>

        {(!companyInfo.bankAccounts || companyInfo.bankAccounts.length === 0) ? (
          <div className="text-center py-12 text-gray-400">
            <Landmark size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Henüz banka hesabı eklenmemiş</p>
            <button
              onClick={addBankAccount}
              className="mt-4 text-sm text-brown-900 dark:text-gold font-bold hover:underline"
            >
              + İlk hesabı ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {companyInfo.bankAccounts.map((account, index) => (
              <BankAccountCard
                key={account.id}
                account={account}
                index={index}
                onUpdate={updateBankAccount}
                onDelete={deleteBankAccount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bank Transfer Settings */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={<Percent size={20} />}
            title="Havale/EFT Ödeme Ayarları"
            subtitle="Banka transferi ile ödeme seçenekleri"
          />
          <button
            onClick={() => setCompanyInfo({
              ...companyInfo,
              bankTransferSettings: {
                ...companyInfo.bankTransferSettings!,
                isEnabled: !companyInfo.bankTransferSettings?.isEnabled
              }
            })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              companyInfo.bankTransferSettings?.isEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {companyInfo.bankTransferSettings?.isEnabled ? (
              <><ToggleRight size={20} /> Aktif</>
            ) : (
              <><ToggleLeft size={20} /> Pasif</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Discount Percent */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              İndirim Oranı
            </label>
            <div className="relative">
              <input
                type="number"
                value={companyInfo.bankTransferSettings?.discountPercent || 2}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  bankTransferSettings: {
                    ...companyInfo.bankTransferSettings!,
                    discountPercent: parseFloat(e.target.value) || 0
                  }
                })}
                min={0}
                max={20}
                step={0.5}
                className="w-full px-4 py-3 pr-10 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white font-bold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Müşteriye uygulanan indirim</p>
          </div>

          {/* Payment Deadline */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Ödeme Süresi
            </label>
            <div className="relative">
              <Timer size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={companyInfo.bankTransferSettings?.paymentDeadlineHours || 12}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  bankTransferSettings: {
                    ...companyInfo.bankTransferSettings!,
                    paymentDeadlineHours: parseInt(e.target.value) || 12
                  }
                })}
                min={1}
                max={72}
                className="w-full pl-12 pr-16 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white font-bold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">saat</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Bu süre sonunda sipariş iptal edilir</p>
          </div>

          {/* Min Order Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Min. Sipariş Tutarı
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
              <input
                type="number"
                value={companyInfo.bankTransferSettings?.minOrderAmount || 0}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  bankTransferSettings: {
                    ...companyInfo.bankTransferSettings!,
                    minOrderAmount: parseFloat(e.target.value) || 0
                  }
                })}
                min={0}
                step={50}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white font-bold text-lg"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">0 = Limit yok</p>
          </div>

          {/* Auto Cancel */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Otomatik İptal
            </label>
            <button
              onClick={() => setCompanyInfo({
                ...companyInfo,
                bankTransferSettings: {
                  ...companyInfo.bankTransferSettings!,
                  autoCancel: !companyInfo.bankTransferSettings?.autoCancel
                }
              })}
              className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                companyInfo.bankTransferSettings?.autoCancel
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
              }`}
            >
              {companyInfo.bankTransferSettings?.autoCancel ? (
                <><Check size={18} /> Açık</>
              ) : (
                <>Kapalı</>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-1">Süre dolunca siparişi iptal et</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-dark-800/50 rounded-xl border border-emerald-200/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-emerald-600">Örnek:</strong> ₺1.000 sipariş için müşteri{' '}
            <strong className="text-emerald-600">
              ₺{(1000 * (1 - (companyInfo.bankTransferSettings?.discountPercent || 2) / 100)).toFixed(0)}
            </strong>{' '}
            öder ({companyInfo.bankTransferSettings?.discountPercent || 2}% = ₺{((companyInfo.bankTransferSettings?.discountPercent || 2) * 10).toFixed(0)} tasarruf).
            Ödeme {companyInfo.bankTransferSettings?.paymentDeadlineHours || 12} saat içinde yapılmazsa sipariş{' '}
            {companyInfo.bankTransferSettings?.autoCancel ? 'otomatik iptal edilir' : 'beklemede kalır'}.
          </p>
        </div>
      </div>

      {/* Legal Info */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
        <SectionHeader
          icon={<FileText size={20} />}
          title="Yasal Bilgiler"
          subtitle="Vergi ve ticaret sicil bilgileri (opsiyonel)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Vergi Dairesi"
            value={companyInfo.taxOffice || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, taxOffice: v })}
            placeholder="Antalya Vergi Dairesi"
          />
          <InputField
            label="Vergi Numarası"
            value={companyInfo.taxNumber || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, taxNumber: v })}
            placeholder="1234567890"
          />
          <InputField
            label="Ticaret Sicil No"
            value={companyInfo.tradeRegisterNo || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, tradeRegisterNo: v })}
            placeholder="123456"
          />
          <InputField
            label="MERSİS No"
            value={companyInfo.mersisNo || ''}
            onChange={(v) => setCompanyInfo({ ...companyInfo, mersisNo: v })}
            placeholder="0123456789012345"
          />
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-brown-900 text-white rounded-2xl hover:bg-gold transition-all shadow-2xl disabled:opacity-50 font-bold"
        >
          <Save size={20} />
          {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  );
};
