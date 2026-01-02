/**
 * Subscription Store - Abonelik State Yönetimi
 *
 * Zustand store pattern kullanarak abonelik durumunu yönetir.
 */

import { create } from 'zustand';
import {
  SubscriptionPlan,
  CustomerSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  DeliveryPreferences,
} from '../types/subscription';
import {
  getSubscriptionPlans,
  getCustomerSubscriptions,
  getSubscriptionById,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  updateSubscription,
  getPaymentHistory,
  recordManualPayment,
  getSubscriptionStats,
  subscribeToSubscriptions,
  initializeDefaultPlans,
} from '../services/subscriptionService';

interface SubscriptionStore {
  // State
  plans: SubscriptionPlan[];
  userSubscription: CustomerSubscription | null;
  allSubscriptions: CustomerSubscription[]; // Admin için
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Stats
  stats: {
    totalActive: number;
    totalPaused: number;
    totalCancelled: number;
    monthlyRevenue: number;
    upcomingDeliveries: number;
  } | null;

  // Actions - Initialization
  initialize: () => Promise<void>;
  initializeAdmin: () => Promise<void>;

  // Actions - Plans
  fetchPlans: () => Promise<void>;

  // Actions - User Subscription
  fetchUserSubscription: (customerId: string) => Promise<void>;
  subscribe: (request: CreateSubscriptionRequest) => Promise<string>;
  pause: (until?: Date, reason?: string) => Promise<void>;
  resume: () => Promise<void>;
  cancel: (reason: string) => Promise<void>;
  updateDeliveryPreferences: (prefs: DeliveryPreferences) => Promise<void>;

  // Actions - Admin
  fetchAllSubscriptions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  recordPayment: (subscriptionId: string, amount: number) => Promise<void>;

  // Helpers
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  // Initial state
  plans: [],
  userSubscription: null,
  allSubscriptions: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  stats: null,

  // Initialize store (user-facing)
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });

    try {
      // Varsayılan planları oluştur (yoksa)
      await initializeDefaultPlans();

      // Planları getir
      const plans = await getSubscriptionPlans();
      set({ plans, isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Subscription store init error:', error);
      set({
        error: 'Abonelik planları yüklenemedi',
        isLoading: false,
      });
    }
  },

  // Initialize for admin panel
  initializeAdmin: async () => {
    set({ isLoading: true, error: null });

    try {
      // Planları getir
      const plans = await getSubscriptionPlans();

      // Tüm abonelikleri dinle
      subscribeToSubscriptions(
        (subscriptions) => set({ allSubscriptions: subscriptions }),
        (error) => set({ error: error.message })
      );

      // İstatistikleri getir
      const stats = await getSubscriptionStats();

      set({
        plans,
        stats,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Admin subscription store init error:', error);
      set({
        error: 'Admin veriler yüklenemedi',
        isLoading: false,
      });
    }
  },

  // Fetch plans
  fetchPlans: async () => {
    set({ isLoading: true, error: null });

    try {
      const plans = await getSubscriptionPlans();
      set({ plans, isLoading: false });
    } catch (error) {
      console.error('Fetch plans error:', error);
      set({
        error: 'Planlar yüklenemedi',
        isLoading: false,
      });
    }
  },

  // Fetch user's active subscription
  fetchUserSubscription: async (customerId: string) => {
    set({ isLoading: true, error: null });

    try {
      const subscriptions = await getCustomerSubscriptions(customerId);
      // En güncel aktif veya duraklatılmış aboneliği al
      const activeSubscription = subscriptions.find(
        (s) => s.status === 'active' || s.status === 'paused'
      );
      set({ userSubscription: activeSubscription || null, isLoading: false });
    } catch (error) {
      console.error('Fetch user subscription error:', error);
      set({
        error: 'Abonelik bilgisi alınamadı',
        isLoading: false,
      });
    }
  },

  // Create new subscription
  subscribe: async (request: CreateSubscriptionRequest) => {
    set({ isLoading: true, error: null });

    try {
      const subscriptionId = await createSubscription(request);

      // Yeni aboneliği getir
      const subscription = await getSubscriptionById(subscriptionId);
      set({ userSubscription: subscription, isLoading: false });

      return subscriptionId;
    } catch (error) {
      console.error('Subscribe error:', error);
      set({
        error: 'Abonelik oluşturulamadı',
        isLoading: false,
      });
      throw error;
    }
  },

  // Pause subscription
  pause: async (until?: Date, reason?: string) => {
    const { userSubscription } = get();
    if (!userSubscription) return;

    set({ isLoading: true, error: null });

    try {
      await pauseSubscription(userSubscription.id, until, reason);

      // Güncellenmiş aboneliği getir
      const updated = await getSubscriptionById(userSubscription.id);
      set({ userSubscription: updated, isLoading: false });
    } catch (error) {
      console.error('Pause error:', error);
      set({
        error: 'Abonelik duraklatılamadı',
        isLoading: false,
      });
    }
  },

  // Resume subscription
  resume: async () => {
    const { userSubscription } = get();
    if (!userSubscription) return;

    set({ isLoading: true, error: null });

    try {
      await resumeSubscription(userSubscription.id);

      // Güncellenmiş aboneliği getir
      const updated = await getSubscriptionById(userSubscription.id);
      set({ userSubscription: updated, isLoading: false });
    } catch (error) {
      console.error('Resume error:', error);
      set({
        error: 'Abonelik devam ettirilemedi',
        isLoading: false,
      });
    }
  },

  // Cancel subscription
  cancel: async (reason: string) => {
    const { userSubscription } = get();
    if (!userSubscription) return;

    set({ isLoading: true, error: null });

    try {
      await cancelSubscription(userSubscription.id, reason);

      // Güncellenmiş aboneliği getir
      const updated = await getSubscriptionById(userSubscription.id);
      set({ userSubscription: updated, isLoading: false });
    } catch (error) {
      console.error('Cancel error:', error);
      set({
        error: 'Abonelik iptal edilemedi',
        isLoading: false,
      });
    }
  },

  // Update delivery preferences
  updateDeliveryPreferences: async (prefs: DeliveryPreferences) => {
    const { userSubscription } = get();
    if (!userSubscription) return;

    set({ isLoading: true, error: null });

    try {
      await updateSubscription(userSubscription.id, { deliveryPreferences: prefs });

      // Güncellenmiş aboneliği getir
      const updated = await getSubscriptionById(userSubscription.id);
      set({ userSubscription: updated, isLoading: false });
    } catch (error) {
      console.error('Update preferences error:', error);
      set({
        error: 'Tercihler güncellenemedi',
        isLoading: false,
      });
    }
  },

  // Admin: Fetch all subscriptions
  fetchAllSubscriptions: async () => {
    set({ isLoading: true, error: null });

    try {
      // Real-time listener zaten initializeAdmin'de kuruldu
      // Sadece manual refresh için
      const stats = await getSubscriptionStats();
      set({ stats, isLoading: false });
    } catch (error) {
      console.error('Fetch all subscriptions error:', error);
      set({
        error: 'Abonelikler yüklenemedi',
        isLoading: false,
      });
    }
  },

  // Admin: Fetch stats
  fetchStats: async () => {
    try {
      const stats = await getSubscriptionStats();
      set({ stats });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  // Admin: Record manual payment
  recordPayment: async (subscriptionId: string, amount: number) => {
    set({ isLoading: true, error: null });

    try {
      await recordManualPayment(subscriptionId, amount);

      // Stats'ı güncelle
      const stats = await getSubscriptionStats();
      set({ stats, isLoading: false });
    } catch (error) {
      console.error('Record payment error:', error);
      set({
        error: 'Ödeme kaydedilemedi',
        isLoading: false,
      });
    }
  },

  // Helpers
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  reset: () =>
    set({
      plans: [],
      userSubscription: null,
      allSubscriptions: [],
      isLoading: false,
      error: null,
      isInitialized: false,
      stats: null,
    }),
}));
