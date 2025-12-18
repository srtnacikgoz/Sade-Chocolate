import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserAddress {
  id: number;
  title: string;
  address: string;
  city: string;
  isDefault: boolean;
}

export interface InvoiceProfile {
    id: number;
    title: string;
    type: 'individual' | 'corporate';
    firstName?: string;
    lastName?: string;
    tckn?: string;
    companyName?: string;
    taxOffice?: string;
    taxNo?: string;
    city: string;
    address: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: any[];
}

interface UserContextType {
  user: UserProfile | null;
  addresses: UserAddress[];
  invoiceProfiles: InvoiceProfile[];
  orders: Order[];
  isLoggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  register: (profile: UserProfile, pass: string) => void;
  logout: () => void;
  addAddress: (addr: Omit<UserAddress, 'id'>) => void;
  updateAddress: (id: number, addr: Partial<UserAddress>) => void;
  deleteAddress: (id: number) => void;
  setDefaultAddress: (id: number) => void;
  addInvoiceProfile: (profile: Omit<InvoiceProfile, 'id'>) => void;
  updateInvoiceProfile: (id: number, profile: Partial<InvoiceProfile>) => void;
  deleteInvoiceProfile: (id: number) => void;
  addOrder: (order: Order) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const INITIAL_ADDRESSES: UserAddress[] = [
    { id: 1, title: 'Ev', address: 'Yeşilbahçe Mah. Çınarlı Cad. No:47', city: 'Antalya/Muratpaşa', isDefault: true },
    { id: 2, title: 'İş', address: 'Teknokent B Blok No:12', city: 'Antalya/Konyaaltı', isDefault: false },
];

const INITIAL_INVOICE_PROFILES: InvoiceProfile[] = [
    { 
        id: 1, 
        title: 'Şahsi', 
        type: 'individual', 
        firstName: 'Misafir', 
        lastName: 'Kullanıcı', 
        tckn: '12345678901', 
        city: 'Antalya', 
        address: 'Yeşilbahçe Mah. No:47' 
    }
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>(INITIAL_ADDRESSES);
  const [invoiceProfiles, setInvoiceProfiles] = useState<InvoiceProfile[]>(INITIAL_INVOICE_PROFILES);
  const [orders, setOrders] = useState<Order[]>([]);

  const login = (email: string, pass: string) => {
    if (email && pass) {
        setUser({
            firstName: 'Misafir',
            lastName: 'Kullanıcı',
            email: email,
            phone: '555-000-0000',
            birthDate: '1990-01-01'
        });
        return true;
    }
    return false;
  };

  const register = (profile: UserProfile, pass: string) => {
      setUser(profile);
  };

  const logout = () => {
      setUser(null);
  };

  const addAddress = (addr: Omit<UserAddress, 'id'>) => {
      const newAddress = { ...addr, id: Date.now(), isDefault: addresses.length === 0 };
      setAddresses([...addresses, newAddress]);
  };

  const updateAddress = (id: number, updatedData: Partial<UserAddress>) => {
      setAddresses(addresses.map(addr => addr.id === id ? { ...addr, ...updatedData } : addr));
  };

  const deleteAddress = (id: number) => {
      setAddresses(addresses.filter(a => a.id !== id));
  };

  const setDefaultAddress = (id: number) => {
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const addInvoiceProfile = (profile: Omit<InvoiceProfile, 'id'>) => {
      const newProfile = { ...profile, id: Date.now() };
      setInvoiceProfiles([...invoiceProfiles, newProfile]);
  };

  const updateInvoiceProfile = (id: number, updatedData: Partial<InvoiceProfile>) => {
      setInvoiceProfiles(invoiceProfiles.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteInvoiceProfile = (id: number) => {
      setInvoiceProfiles(invoiceProfiles.filter(p => p.id !== id));
  };

  const addOrder = (order: Order) => {
      setOrders(prev => [order, ...prev]);
  };

  return (
    <UserContext.Provider value={{
      user, addresses, invoiceProfiles, orders, isLoggedIn: !!user,
      login, register, logout, addAddress, updateAddress, deleteAddress, setDefaultAddress,
      addInvoiceProfile, updateInvoiceProfile, deleteInvoiceProfile, addOrder
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};