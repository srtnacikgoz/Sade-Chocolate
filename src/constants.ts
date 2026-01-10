import { Product } from './types';

// ✅ CEO Notu: Varsayılan kategoriler. Ürünlerden dinamik olarak da çekilir.
export const PRODUCT_CATEGORIES = [
  { id: 'bonbon', label: 'Bonbon' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'kutu', label: 'Kutu' },
];

export const COLLECTIONS = [
  { id: 'c1', title: 'Hediye Kutuları', description: 'Özel anlar için.', price: 450, currency: '₺', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbJ5QNuHRPNzmbTzlM8HiaIfvYQyUmHYZCGkGRzBLAZVBjrmg8muVn_uLTzyJ4IZkQyMGYpHWrMGELgzLI3g4sYocAwwqzrShnfi0RnF3bO2P-9fXxGy62mHftgN9AZPTGRXDzO44LuFUAFeKS2NxHavuan8eyO2FKk_JeejJKjb-Of8Z9TC2QHACMo7JkzHOOdHwPyL2pM_LiuZm8gY9RpqeBaaW98Br-Ga_W5yyq5TLBdG95zs2Tm6AGBNNYvymDyMM3x-NacKI' },
  { id: 'c2', title: 'Truffle Serisi', description: 'Yoğun lezzet.', price: 320, currency: '₺', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMLXTKh59g43vlTuyqgoPc4Fgnq-rl4s1r9tIBYoxCKuRqU2Bhd0TN9QRe0TpwD-KVpgQHcXo72voQm_k9l_slpZng3U1JmQayBKEAqK72PXEYyaRkF7a3PTVhVt3N8GosDykSHSeFYSQRRPo9ae3PSX9a_8Pd7mJw2ugm_qmy-Jq22CU37OWQP_7wcVayb0q_TT1Ae5yIBoDcgW7-9QIfVBMbQFiRNlqJAR61SABI7vuTvKppPVPzDEqah-Ar7h9wtBL3gEqtvCc' },
  { id: 'c3', title: 'Tablet Çikolata', description: '%70 Kakao.', price: 180, currency: '₺', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJnyCfUriN68tho5hC9VWjKb1kfNt1Kj8FOxRvN3SCkQiPBp0jvU7K3bGdKme7SAAmnGXhTt_pWaI2qOjjoyx0mQBxfMtT3rRjgss7YzIRyIEj6E0sJHGApBsoWHU11-xUZMaKcMOHgT1PPBL-64eQPkjQhJIE3-oDa-m4QYyK-gZZPCquLTIsu5OaFS9DWXAiQezNGwGRzLIywDN8eJ6w3c9X6m2i5n7SZOJDt1zMcF7nyZcDv5wMNSsok42LQ2zSKsHIrjq6vDs' }
];

export const PRODUCTS: Product[] = [];