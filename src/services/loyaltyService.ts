import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  LoyaltyConfiguration,
  LoyaltyTier,
  TierConfig,
  CustomerLoyaltyProfile,
  LoyaltyTransaction,
  ReferralBonus,
  TierUpgradeResult,
  ReferralStats
} from '../types/loyalty';

// ==========================================
// CONFIGURATION MANAGEMENT
// ==========================================

/**
 * Get default loyalty configuration (hardcoded fallback)
 */
export function getDefaultLoyaltyConfig(): LoyaltyConfiguration {
  return {
    id: 'default',
    tiers: {
      Bronze: {
        tier: 'Bronze',
        minSpent: 0,
        maxSpent: 999,
        pointsMultiplier: 1.0,
        fixedBonusPoints: 0,           // Hibrit: Sabit bonus yok
        annualSpentRequirement: 0,     // Bronze için koruma yok
        birthdayDiscount: 5,
        freeShippingThreshold: null,
        exclusiveAccess: false,
        earlyAccess: false,
        color: 'amber',
        icon: '🥉'
      },
      Silver: {
        tier: 'Silver',
        minSpent: 1000,
        maxSpent: 2499,
        pointsMultiplier: 1.0,         // Hibrit: Çarpan yok
        fixedBonusPoints: 50,          // Her siparişte +50 puan
        annualSpentRequirement: 1000,  // Yıllık 1000₺ gerekli
        birthdayDiscount: 10,
        freeShippingThreshold: 250,
        exclusiveAccess: true,
        earlyAccess: false,
        color: 'slate',
        icon: '🥈'
      },
      Gold: {
        tier: 'Gold',
        minSpent: 2500,
        maxSpent: 4999,
        pointsMultiplier: 1.0,
        fixedBonusPoints: 100,         // Her siparişte +100 puan
        annualSpentRequirement: 2500,  // Yıllık 2500₺ gerekli
        birthdayDiscount: 15,
        freeShippingThreshold: null,
        exclusiveAccess: true,
        earlyAccess: true,
        color: 'yellow',
        icon: '🏆'
      },
      Platinum: {
        tier: 'Platinum',
        minSpent: 5000,
        maxSpent: null,
        pointsMultiplier: 1.0,
        fixedBonusPoints: 200,         // Her siparişte +200 puan
        annualSpentRequirement: 5000,  // Yıllık 5000₺ gerekli
        birthdayDiscount: 20,
        freeShippingThreshold: null,
        exclusiveAccess: true,
        earlyAccess: true,
        color: 'indigo',
        icon: '💎'
      }
    },
    pointsPerLira: 1,
    welcomeBonusPoints: 100,
    referralBonusPoints: 250,
    birthdayBonusPoints: 100,
    reviewBonusPoints: 25,
    pointsToLiraRatio: 10,
    minPointsRedemption: 100,
    maxPointsPerOrder: 5000,
    pointsExpiryMonths: 24,
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  };
}

/**
 * Get loyalty configuration from Firestore
 */
export async function getLoyaltyConfig(): Promise<LoyaltyConfiguration> {
  try {
    const configRef = doc(db, 'loyalty_config', 'default');
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      console.log('⚠️ Loyalty config not found, initializing with defaults...');
      await initializeLoyaltyConfig();
      return getDefaultLoyaltyConfig();
    }

    return configDoc.data() as LoyaltyConfiguration;
  } catch (error) {
    console.error('❌ Error loading loyalty config:', error);
    console.log('Using default config as fallback');
    return getDefaultLoyaltyConfig();
  }
}

/**
 * Initialize loyalty config in Firestore with default values
 */
export async function initializeLoyaltyConfig(): Promise<void> {
  try {
    const configRef = doc(db, 'loyalty_config', 'default');
    const defaultConfig = getDefaultLoyaltyConfig();

    await setDoc(configRef, defaultConfig);
    console.log('✅ Loyalty config initialized with defaults');
  } catch (error) {
    console.error('❌ Error initializing loyalty config:', error);
    throw error;
  }
}

/**
 * Update loyalty configuration
 */
export async function updateLoyaltyConfig(config: LoyaltyConfiguration): Promise<void> {
  try {
    const configRef = doc(db, 'loyalty_config', 'default');

    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };

    await setDoc(configRef, updatedConfig);
    console.log('✅ Loyalty config updated');
  } catch (error) {
    console.error('❌ Error updating loyalty config:', error);
    throw error;
  }
}

// ==========================================
// TIER MANAGEMENT
// ==========================================

/**
 * Calculate tier level based on total spent
 */
export function calculateTierLevel(
  totalSpent: number,
  config: LoyaltyConfiguration
): LoyaltyTier {
  if (totalSpent >= config.tiers.Platinum.minSpent) return 'Platinum';
  if (totalSpent >= config.tiers.Gold.minSpent) return 'Gold';
  if (totalSpent >= config.tiers.Silver.minSpent) return 'Silver';
  return 'Bronze';
}

/**
 * Get tier configuration for a specific tier
 */
export function getTierConfig(
  tier: LoyaltyTier,
  config: LoyaltyConfiguration
): TierConfig {
  return config.tiers[tier];
}

/**
 * Check and perform tier upgrade if needed
 */
export async function checkTierUpgrade(customerId: string): Promise<TierUpgradeResult> {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const config = await getLoyaltyConfig();
    const newTier = calculateTierLevel(customer.totalSpent, config);

    if (newTier !== customer.tierLevel) {
      // Upgrade tier
      await updateCustomerProfile(customerId, {
        tierLevel: newTier,
        tierSince: new Date().toISOString()
      });

      return {
        upgraded: true,
        oldTier: customer.tierLevel,
        newTier
      };
    }

    return { upgraded: false };
  } catch (error) {
    console.error('❌ Error checking tier upgrade:', error);
    throw error;
  }
}

// ==========================================
// CUSTOMER PROFILE MANAGEMENT
// ==========================================

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<CustomerLoyaltyProfile | null> {
  try {
    const q = query(collection(db, 'customers'), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CustomerLoyaltyProfile;
  } catch (error) {
    console.error('❌ Error getting customer by email:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<CustomerLoyaltyProfile | null> {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      return null;
    }

    return { id: customerDoc.id, ...customerDoc.data() } as CustomerLoyaltyProfile;
  } catch (error) {
    console.error('❌ Error getting customer by ID:', error);
    throw error;
  }
}

/**
 * Generate unique referral code
 */
function generateReferralCode(email: string): string {
  const prefix = 'SADE';
  const emailPart = email.substring(0, 2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${emailPart}${random}`;
}

/**
 * Get or create customer profile
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string,
  uid?: string
): Promise<CustomerLoyaltyProfile> {
  try {
    // Check if customer exists
    const existing = await getCustomerByEmail(email);
    if (existing) {
      return existing;
    }

    // Create new customer
    const now = new Date().toISOString();
    const newCustomer: Omit<CustomerLoyaltyProfile, 'id'> = {
      uid: uid || null,
      email,
      name: name || null,
      phone: null,
      totalSpent: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      // Hibrit Sistem: Yıllık harcama takibi
      annualSpent: 0,
      annualPeriodStart: now,
      tierExpiryWarning: false,
      tierLevel: 'Bronze',
      tierSince: now,
      nextTierThreshold: 1000, // Silver threshold (güncellendi)
      loyaltyPoints: 0,
      lifetimePoints: 0,
      pointsExpiringSoon: 0,
      lastOrderDate: '',
      firstOrderDate: '',
      referralCode: generateReferralCode(email),
      referralsCount: 0,
      referralEarnings: 0,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, 'customers'), newCustomer);

    console.log(`✅ New customer created: ${email} (${docRef.id})`);

    return { id: docRef.id, ...newCustomer } as CustomerLoyaltyProfile;
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

/**
 * Update customer profile
 */
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<CustomerLoyaltyProfile>
): Promise<void> {
  try {
    const customerRef = doc(db, 'customers', customerId);

    const cleanedUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(cleanedUpdates).forEach(key => {
      if (cleanedUpdates[key as keyof typeof cleanedUpdates] === undefined) {
        delete cleanedUpdates[key as keyof typeof cleanedUpdates];
      }
    });

    await updateDoc(customerRef, cleanedUpdates);
    console.log(`✅ Customer profile updated: ${customerId}`);
  } catch (error) {
    console.error('❌ Error updating customer profile:', error);
    throw error;
  }
}

// ==========================================
// POINTS MANAGEMENT
// ==========================================

/**
 * Add loyalty points for a purchase
 * Hibrit Sistem: Base puan + Sabit tier bonusu (çarpan yerine)
 */
export async function addPointsForPurchase(
  customerId: string,
  orderId: string,
  orderAmount: number,
  tier: LoyaltyTier
): Promise<number> {
  try {
    const config = await getLoyaltyConfig();
    const tierConfig = getTierConfig(tier, config);

    // Hibrit Sistem: Base puan + sabit tier bonusu
    const basePoints = Math.floor(orderAmount * config.pointsPerLira);
    const tierBonus = tierConfig.fixedBonusPoints || 0;
    const points = basePoints + tierBonus;

    // Create transaction record
    const transaction: Omit<LoyaltyTransaction, 'id'> = {
      customerId,
      type: 'earn',
      points,
      earnReason: 'purchase',
      orderId,
      orderAmount,
      description: `Order #${orderId} - Earned ${points} points`,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + config.pointsExpiryMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false
    };

    await addDoc(collection(db, 'loyalty_transactions'), transaction);

    // Update customer points
    const customer = await getCustomerById(customerId);
    if (customer) {
      await updateCustomerProfile(customerId, {
        loyaltyPoints: customer.loyaltyPoints + points,
        lifetimePoints: customer.lifetimePoints + points
      });
    }

    console.log(`✅ Added ${points} points to customer ${customerId}`);
    return points;
  } catch (error) {
    console.error('❌ Error adding points:', error);
    throw error;
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemPoints(
  customerId: string,
  points: number,
  orderId: string,
  description: string,
  redeemType: 'discount' | 'product' | 'shipping' = 'discount',
  redeemValue?: number
): Promise<void> {
  try {
    const config = await getLoyaltyConfig();
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    if (customer.loyaltyPoints < points) {
      throw new Error(`Insufficient points. Available: ${customer.loyaltyPoints}, Required: ${points}`);
    }

    if (points < config.minPointsRedemption) {
      throw new Error(`Minimum ${config.minPointsRedemption} points required for redemption`);
    }

    if (points > config.maxPointsPerOrder) {
      throw new Error(`Maximum ${config.maxPointsPerOrder} points per order`);
    }

    // Create redemption transaction
    const transaction: Omit<LoyaltyTransaction, 'id'> = {
      customerId,
      type: 'redeem',
      points: -points,
      orderId,
      redeemType,
      redeemValue: redeemValue || Math.floor(points / config.pointsToLiraRatio),
      description,
      timestamp: new Date().toISOString(),
      isExpired: false
    };

    await addDoc(collection(db, 'loyalty_transactions'), transaction);

    // Update customer points
    await updateCustomerProfile(customerId, {
      loyaltyPoints: customer.loyaltyPoints - points
    });

    console.log(`✅ Redeemed ${points} points for customer ${customerId}`);
  } catch (error) {
    console.error('❌ Error redeeming points:', error);
    throw error;
  }
}

/**
 * Get points history for a customer
 */
export async function getPointsHistory(
  customerId: string,
  limitCount: number = 10
): Promise<LoyaltyTransaction[]> {
  try {
    const q = query(
      collection(db, 'loyalty_transactions'),
      where('customerId', '==', customerId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyTransaction));
  } catch (error) {
    console.error('❌ Error getting points history:', error);
    throw error;
  }
}

/**
 * Calculate expiring points in next 30 days
 */
export async function calculateExpiringPoints(customerId: string): Promise<number> {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const q = query(
      collection(db, 'loyalty_transactions'),
      where('customerId', '==', customerId),
      where('type', '==', 'earn'),
      where('isExpired', '==', false),
      where('expiresAt', '<=', thirtyDaysFromNow)
    );

    const snapshot = await getDocs(q);
    let expiringPoints = 0;

    snapshot.docs.forEach(doc => {
      const transaction = doc.data() as LoyaltyTransaction;
      expiringPoints += transaction.points;
    });

    return expiringPoints;
  } catch (error) {
    console.error('❌ Error calculating expiring points:', error);
    return 0;
  }
}

// ==========================================
// REFERRAL SYSTEM
// ==========================================

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<CustomerLoyaltyProfile | null> {
  try {
    const q = query(
      collection(db, 'customers'),
      where('referralCode', '==', code),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CustomerLoyaltyProfile;
  } catch (error) {
    console.error('❌ Error validating referral code:', error);
    return null;
  }
}

/**
 * Apply referral bonus to both referrer and referee
 */
export async function applyReferralBonus(
  referrerCode: string,
  refereeId: string
): Promise<void> {
  try {
    const config = await getLoyaltyConfig();
    const referrer = await validateReferralCode(referrerCode);
    const referee = await getCustomerById(refereeId);

    if (!referrer || !referee) {
      console.log('⚠️ Referrer or referee not found');
      return;
    }

    // Create referral bonus record
    const bonusRecord: Omit<ReferralBonus, 'id'> = {
      referrerId: referrer.id,
      refereeId: referee.id,
      refereeEmail: referee.email,
      bonusPoints: config.referralBonusPoints,
      bonusAwarded: true,
      firstOrderCompleted: true,
      createdAt: new Date().toISOString(),
      awardedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'referral_bonuses'), bonusRecord);

    // Award points to both
    const bonusTransaction = {
      type: 'earn' as const,
      earnReason: 'referral' as const,
      points: config.referralBonusPoints,
      timestamp: new Date().toISOString(),
      isExpired: false,
      expiresAt: new Date(Date.now() + config.pointsExpiryMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Referrer bonus
    await addDoc(collection(db, 'loyalty_transactions'), {
      ...bonusTransaction,
      customerId: referrer.id,
      description: `Referral bonus - ${referee.email} joined`
    });

    // Referee bonus
    await addDoc(collection(db, 'loyalty_transactions'), {
      ...bonusTransaction,
      customerId: referee.id,
      description: `Welcome bonus - Referred by ${referrer.email}`
    });

    // Update customer profiles
    await updateCustomerProfile(referrer.id, {
      loyaltyPoints: referrer.loyaltyPoints + config.referralBonusPoints,
      lifetimePoints: referrer.lifetimePoints + config.referralBonusPoints,
      referralsCount: referrer.referralsCount + 1,
      referralEarnings: referrer.referralEarnings + config.referralBonusPoints
    });

    await updateCustomerProfile(referee.id, {
      loyaltyPoints: referee.loyaltyPoints + config.referralBonusPoints,
      lifetimePoints: referee.lifetimePoints + config.referralBonusPoints
    });

    console.log(`✅ Referral bonus applied: ${referrer.email} → ${referee.email}`);
  } catch (error) {
    console.error('❌ Error applying referral bonus:', error);
    throw error;
  }
}

/**
 * Get referral stats for a customer
 */
export async function getReferralStats(customerId: string): Promise<ReferralStats> {
  try {
    const q = query(
      collection(db, 'referral_bonuses'),
      where('referrerId', '==', customerId)
    );

    const snapshot = await getDocs(q);
    let totalEarnings = 0;

    snapshot.docs.forEach(doc => {
      const bonus = doc.data() as ReferralBonus;
      if (bonus.bonusAwarded) {
        totalEarnings += bonus.bonusPoints;
      }
    });

    return {
      count: snapshot.size,
      totalEarnings
    };
  } catch (error) {
    console.error('❌ Error getting referral stats:', error);
    return { count: 0, totalEarnings: 0 };
  }
}

// ==========================================
// ANALYTICS
// ==========================================

/**
 * Get customer lifetime value
 */
export async function getCustomerLifetimeValue(customerId: string): Promise<number> {
  try {
    const customer = await getCustomerById(customerId);
    return customer?.totalSpent || 0;
  } catch (error) {
    console.error('❌ Error getting customer lifetime value:', error);
    return 0;
  }
}

/**
 * Get tier distribution (how many customers in each tier)
 */
export async function getTierDistribution(): Promise<Record<LoyaltyTier, number>> {
  try {
    const snapshot = await getDocs(collection(db, 'customers'));

    const distribution: Record<LoyaltyTier, number> = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0
    };

    snapshot.docs.forEach(doc => {
      const customer = doc.data() as CustomerLoyaltyProfile;
      distribution[customer.tierLevel]++;
    });

    return distribution;
  } catch (error) {
    console.error('❌ Error getting tier distribution:', error);
    return { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  }
}

/**
 * Get top customers by total spent
 */
export async function getTopCustomers(limitCount: number = 10): Promise<CustomerLoyaltyProfile[]> {
  try {
    const q = query(
      collection(db, 'customers'),
      orderBy('totalSpent', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerLoyaltyProfile));
  } catch (error) {
    console.error('❌ Error getting top customers:', error);
    return [];
  }
}
