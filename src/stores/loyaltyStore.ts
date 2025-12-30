import { create } from 'zustand';
import type {
  CustomerLoyaltyProfile,
  LoyaltyTransaction,
  LoyaltyConfiguration,
  LoyaltyTier
} from '../types/loyalty';
import {
  getOrCreateCustomer,
  getCustomerById,
  getCustomerByEmail,
  updateCustomerProfile,
  getPointsHistory,
  redeemPoints,
  validateReferralCode,
  getReferralStats,
  getLoyaltyConfig,
  initializeLoyaltyConfig,
  checkTierUpgrade
} from '../services/loyaltyService';

interface LoyaltyStore {
  // State
  currentCustomer: CustomerLoyaltyProfile | null;
  config: LoyaltyConfiguration | null;
  pointsHistory: LoyaltyTransaction[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Initialize
  initialize: () => Promise<void>;

  // Customer Management
  loadCustomer: (email: string, name?: string, uid?: string) => Promise<void>;
  loadCustomerById: (customerId: string) => Promise<void>;
  refreshCustomer: () => Promise<void>;
  updateCustomer: (updates: Partial<CustomerLoyaltyProfile>) => Promise<void>;

  // Points
  loadPointsHistory: (customerId?: string) => Promise<void>;
  redeemCustomerPoints: (points: number, orderId: string, description: string) => Promise<void>;
  getPointsBreakdown: () => { available: number; expiring: number; lifetime: number };

  // Referral
  getReferralCode: () => string;
  validateReferral: (code: string) => Promise<boolean>;
  getReferralStatistics: () => Promise<{ count: number; totalEarnings: number }>;

  // Tier
  checkForTierUpgrade: () => Promise<void>;

  // Config
  refreshConfig: () => Promise<void>;

  // Helpers
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLoyaltyStore = create<LoyaltyStore>()((set, get) => ({
  // Initial State
  currentCustomer: null,
  config: null,
  pointsHistory: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize store and config
  initialize: async () => {
    if (get().isInitialized) {
      console.log('⚠️ Loyalty store already initialized');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Load or create config
      let config = await getLoyaltyConfig();

      // If config doesn't exist, initialize it
      if (!config) {
        await initializeLoyaltyConfig();
        config = await getLoyaltyConfig();
      }

      set({
        config,
        isInitialized: true,
        isLoading: false
      });

      console.log('✅ Loyalty store initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize loyalty store:', error);
      set({
        error: error.message,
        isLoading: false,
        isInitialized: true // Still mark as initialized to prevent loops
      });
    }
  },

  // Load customer by email
  loadCustomer: async (email: string, name?: string, uid?: string) => {
    try {
      set({ isLoading: true, error: null });

      const customer = await getOrCreateCustomer(email, name, uid);

      set({
        currentCustomer: customer,
        isLoading: false
      });

      // Also load points history
      await get().loadPointsHistory(customer.id);

      console.log(`✅ Customer loaded: ${email}`);
    } catch (error: any) {
      console.error('❌ Error loading customer:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load customer by ID
  loadCustomerById: async (customerId: string) => {
    try {
      set({ isLoading: true, error: null });

      const customer = await getCustomerById(customerId);

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      set({
        currentCustomer: customer,
        isLoading: false
      });

      // Also load points history
      await get().loadPointsHistory(customer.id);

      console.log(`✅ Customer loaded by ID: ${customerId}`);
    } catch (error: any) {
      console.error('❌ Error loading customer by ID:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Refresh current customer data
  refreshCustomer: async () => {
    const currentCustomer = get().currentCustomer;
    if (!currentCustomer) {
      console.warn('⚠️ No customer to refresh');
      return;
    }

    try {
      set({ isLoading: true });

      const freshCustomer = await getCustomerById(currentCustomer.id);

      if (freshCustomer) {
        set({ currentCustomer: freshCustomer });
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Error refreshing customer:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Update customer profile
  updateCustomer: async (updates: Partial<CustomerLoyaltyProfile>) => {
    const currentCustomer = get().currentCustomer;
    if (!currentCustomer) {
      throw new Error('No customer loaded');
    }

    try {
      set({ isLoading: true, error: null });

      await updateCustomerProfile(currentCustomer.id, updates);

      // Refresh customer data
      await get().refreshCustomer();

      set({ isLoading: false });
      console.log('✅ Customer profile updated');
    } catch (error: any) {
      console.error('❌ Error updating customer:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load points history
  loadPointsHistory: async (customerId?: string) => {
    const id = customerId || get().currentCustomer?.id;

    if (!id) {
      console.warn('⚠️ No customer ID for points history');
      return;
    }

    try {
      const history = await getPointsHistory(id, 20);
      set({ pointsHistory: history });
    } catch (error: any) {
      console.error('❌ Error loading points history:', error);
      set({ error: error.message });
    }
  },

  // Redeem points
  redeemCustomerPoints: async (points: number, orderId: string, description: string) => {
    const currentCustomer = get().currentCustomer;
    if (!currentCustomer) {
      throw new Error('No customer loaded');
    }

    try {
      set({ isLoading: true, error: null });

      await redeemPoints(currentCustomer.id, points, orderId, description);

      // Refresh customer and history
      await get().refreshCustomer();
      await get().loadPointsHistory();

      set({ isLoading: false });
      console.log(`✅ Redeemed ${points} points`);
    } catch (error: any) {
      console.error('❌ Error redeeming points:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Get points breakdown
  getPointsBreakdown: () => {
    const customer = get().currentCustomer;

    return {
      available: customer?.loyaltyPoints || 0,
      expiring: customer?.pointsExpiringSoon || 0,
      lifetime: customer?.lifetimePoints || 0
    };
  },

  // Get referral code
  getReferralCode: () => {
    return get().currentCustomer?.referralCode || '';
  },

  // Validate referral code
  validateReferral: async (code: string) => {
    try {
      const referrer = await validateReferralCode(code);
      return referrer !== null;
    } catch (error) {
      console.error('❌ Error validating referral code:', error);
      return false;
    }
  },

  // Get referral statistics
  getReferralStatistics: async () => {
    const currentCustomer = get().currentCustomer;
    if (!currentCustomer) {
      return { count: 0, totalEarnings: 0 };
    }

    try {
      return await getReferralStats(currentCustomer.id);
    } catch (error) {
      console.error('❌ Error getting referral stats:', error);
      return { count: 0, totalEarnings: 0 };
    }
  },

  // Check for tier upgrade
  checkForTierUpgrade: async () => {
    const currentCustomer = get().currentCustomer;
    if (!currentCustomer) {
      console.warn('⚠️ No customer for tier upgrade check');
      return;
    }

    try {
      const result = await checkTierUpgrade(currentCustomer.id);

      if (result.upgraded) {
        console.log(`🎉 Customer upgraded: ${result.oldTier} → ${result.newTier}`);

        // Refresh customer to get new tier
        await get().refreshCustomer();
      }
    } catch (error) {
      console.error('❌ Error checking tier upgrade:', error);
    }
  },

  // Refresh config
  refreshConfig: async () => {
    try {
      const config = await getLoyaltyConfig();
      set({ config });
      console.log('✅ Config refreshed');
    } catch (error: any) {
      console.error('❌ Error refreshing config:', error);
      set({ error: error.message });
    }
  },

  // Setters
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // Reset store
  reset: () => set({
    currentCustomer: null,
    pointsHistory: [],
    error: null,
    isLoading: false
  })
}));
