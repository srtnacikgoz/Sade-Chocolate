// Müşteri Sadakat ve Tier Sistemi Type Definitions

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

// Configurable tier system - Admin panelden düzenlenebilir
export interface TierConfig {
  tier: LoyaltyTier;
  minSpent: number;              // Minimum total spent to reach this tier
  maxSpent: number | null;       // Max spent (null for highest tier)

  // Hibrit Sistem: Sabit bonus yerine çarpan (opsiyonel - geriye uyumluluk)
  pointsMultiplier?: number;     // Eski sistem: 1.0, 1.25, 1.5, 2.0
  fixedBonusPoints: number;      // Yeni sistem: Her siparişte +50, +100, +200 puan

  // Tier koruma mekanizması
  annualSpentRequirement: number; // Yıllık minimum harcama (tier'ı korumak için)

  birthdayDiscount: number;      // Percentage (5, 10, 15, 20)
  freeShippingThreshold: number | null; // null = always free, number = minimum order
  exclusiveAccess: boolean;
  earlyAccess: boolean;
  color: string;                 // For UI badge (amber, slate, yellow, indigo)
  icon: string;                  // Emoji or icon name (🥉, 🥈, 🏆, 💎)
}

export interface LoyaltyConfiguration {
  id: string;                    // 'default' - single config document
  tiers: Record<LoyaltyTier, TierConfig>;

  // Point earning rules
  pointsPerLira: number;         // Base points per 1₺ (default: 1)
  welcomeBonusPoints: number;    // First order bonus
  referralBonusPoints: number;   // Both referrer and referee
  birthdayBonusPoints: number;
  reviewBonusPoints: number;

  // Point redemption rules
  pointsToLiraRatio: number;     // How many points = 1₺ discount (default: 10 points = 1₺)
  minPointsRedemption: number;   // Minimum points to redeem
  maxPointsPerOrder: number;     // Maximum points usable in single order

  // Point expiration
  pointsExpiryMonths: number;    // Default: 24 months

  // Other settings
  isActive: boolean;             // Global on/off switch
  updatedAt: string;
  updatedBy: string;
}

export interface CustomerLoyaltyProfile {
  id: string;                    // Firestore doc ID
  uid?: string;                  // Firebase Auth UID (opsiyonel)
  email: string;                 // Primary identifier
  name?: string;
  phone?: string;

  // Finansal metrikler
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;

  // Hibrit Sistem: Yıllık harcama takibi
  annualSpent: number;           // Bu yıl içindeki toplam harcama
  annualPeriodStart: string;     // Yıllık dönem başlangıcı (ISO date)
  tierExpiryWarning?: boolean;   // Tier düşme riski var mı?

  // Tier bilgileri
  tierLevel: LoyaltyTier;
  tierSince: string;             // ISO date
  nextTierThreshold: number | null;

  // Puan sistemi
  loyaltyPoints: number;         // Aktif kullanılabilir puanlar
  lifetimePoints: number;        // Toplam kazanılan puanlar
  pointsExpiringSoon: number;    // 30 gün içinde sona erecek

  // Aktivite
  lastOrderDate: string;
  firstOrderDate: string;

  // Referral
  referralCode: string;          // Benzersiz kod (örn: SADE-AY12)
  referredBy?: string;           // Referral code of referrer
  referralsCount: number;
  referralEarnings: number;

  // Kişisel bilgiler
  birthDate?: string;
  birthdayRewardClaimed?: boolean;
  birthdayRewardYear?: number;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;

  // Transaction details
  type: 'earn' | 'redeem';
  points: number;

  // Earn specific
  earnReason?: 'purchase' | 'review' | 'referral' | 'birthday' | 'welcome' | 'manual';
  orderId?: string;
  orderAmount?: number;

  // Redeem specific
  redeemType?: 'discount' | 'product' | 'shipping';
  redeemValue?: number;

  // Metadata
  description: string;
  timestamp: string;
  expiresAt?: string;            // Earn transactions expire after 24 months
  isExpired: boolean;
}

export interface ReferralBonus {
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  bonusPoints: number;
  bonusAwarded: boolean;
  firstOrderCompleted: boolean;
  createdAt: string;
  awardedAt?: string;
}

// Helper interfaces
export interface TierBenefits {
  pointsMultiplier: number;
  birthdayDiscount: number;
  freeShippingThreshold: number | null;
  exclusiveAccess: boolean;
  earlyAccess: boolean;
}

export interface TierUpgradeResult {
  upgraded: boolean;
  oldTier?: LoyaltyTier;
  newTier?: LoyaltyTier;
}

export interface ReferralStats {
  count: number;
  totalEarnings: number;
}
