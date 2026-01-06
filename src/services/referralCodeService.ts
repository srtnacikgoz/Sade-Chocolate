import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ==========================================
// TYPES
// ==========================================

export interface ReferralCampaign {
  id: string;
  code: string;
  type: 'campaign' | 'user'; // Kampanya kodu veya kullanıcı referansı
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  maxUses: number; // -1 = sınırsız
  currentUses: number;
  bonusPoints: number;
  discountPercent?: number;
  minOrderAmount?: number;
  allowedEmails?: string[]; // Sadece belirli emailler için
  blockedEmails?: string[]; // Kara liste
  perUserLimit: number; // Her kullanıcı max kaç kez kullanabilir
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralUsage {
  id?: string;
  code: string;
  campaignId: string;
  userId: string | null;
  userEmail: string;
  userIP?: string;
  usedAt: string;
  orderId?: string;
  bonusAwarded: number;
  discountApplied?: number;
}

export interface ReferralValidationResult {
  isValid: boolean;
  campaign?: ReferralCampaign;
  error?: string;
  bonusPoints?: number;
  discountPercent?: number;
}

// ==========================================
// CAMPAIGN MANAGEMENT
// ==========================================

/**
 * Create a new referral campaign
 */
export async function createReferralCampaign(campaign: Omit<ReferralCampaign, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // Check if code already exists
    const existing = await getReferralCampaignByCode(campaign.code);
    if (existing) {
      throw new Error(`Kod zaten mevcut: ${campaign.code}`);
    }

    const now = new Date().toISOString();
    const newCampaign: Omit<ReferralCampaign, 'id'> = {
      ...campaign,
      currentUses: 0,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, 'referral_campaigns'), newCampaign);
    console.log(`✅ Referans kampanyası oluşturuldu: ${campaign.code}`);

    return docRef.id;
  } catch (error) {
    console.error('❌ Kampanya oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Get referral campaign by code
 */
export async function getReferralCampaignByCode(code: string): Promise<ReferralCampaign | null> {
  try {
    const q = query(
      collection(db, 'referral_campaigns'),
      where('code', '==', code.toUpperCase()),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ReferralCampaign;
  } catch (error) {
    console.error('❌ Kampanya getirme hatası:', error);
    return null;
  }
}

/**
 * Update referral campaign
 */
export async function updateReferralCampaign(
  campaignId: string,
  updates: Partial<ReferralCampaign>
): Promise<void> {
  try {
    const campaignRef = doc(db, 'referral_campaigns', campaignId);
    await updateDoc(campaignRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Kampanya güncellendi: ${campaignId}`);
  } catch (error) {
    console.error('❌ Kampanya güncelleme hatası:', error);
    throw error;
  }
}

/**
 * Deactivate referral campaign
 */
export async function deactivateReferralCampaign(campaignId: string): Promise<void> {
  try {
    await updateReferralCampaign(campaignId, { isActive: false });
    console.log(`✅ Kampanya devre dışı bırakıldı: ${campaignId}`);
  } catch (error) {
    console.error('❌ Kampanya deaktivasyonu hatası:', error);
    throw error;
  }
}

// ==========================================
// VALIDATION & USAGE TRACKING
// ==========================================

/**
 * Validate referral code with comprehensive checks
 */
export async function validateReferralCodeAdvanced(
  code: string,
  userEmail: string,
  userId?: string
): Promise<ReferralValidationResult> {
  try {
    // 1. Kod mevcut mu?
    const campaign = await getReferralCampaignByCode(code);
    if (!campaign) {
      return { isValid: false, error: 'Geçersiz referans kodu.' };
    }

    // 2. Kampanya aktif mi?
    if (!campaign.isActive) {
      return { isValid: false, error: 'Bu kampanya artık aktif değil.' };
    }

    // 3. Tarih kontrolü
    const now = new Date();
    const validFrom = new Date(campaign.validFrom);
    const validUntil = new Date(campaign.validUntil);

    if (now < validFrom) {
      return { isValid: false, error: 'Bu kampanya henüz başlamadı.' };
    }

    if (now > validUntil) {
      return { isValid: false, error: 'Bu kampanyanın süresi doldu.' };
    }

    // 4. Maksimum kullanım kontrolü
    if (campaign.maxUses !== -1 && campaign.currentUses >= campaign.maxUses) {
      return { isValid: false, error: 'Bu kampanyanın kullanım limiti doldu.' };
    }

    // 5. Email whitelist kontrolü (varsa)
    if (campaign.allowedEmails && campaign.allowedEmails.length > 0) {
      if (!campaign.allowedEmails.includes(userEmail.toLowerCase())) {
        return { isValid: false, error: 'Bu kampanyayı kullanma yetkiniz yok.' };
      }
    }

    // 6. Email blacklist kontrolü
    if (campaign.blockedEmails && campaign.blockedEmails.includes(userEmail.toLowerCase())) {
      return { isValid: false, error: 'Bu kampanyayı kullanamazsınız.' };
    }

    // 7. Kullanıcı başına limit kontrolü
    const userUsageCount = await getUserUsageCount(campaign.code, userEmail, userId);
    if (userUsageCount >= campaign.perUserLimit) {
      return {
        isValid: false,
        error: `Bu kampanyayı maksimum ${campaign.perUserLimit} kez kullanabilirsiniz.`
      };
    }

    // 8. Kendi referans kodunu kullanma kontrolü (user type için)
    if (campaign.type === 'user' && userId) {
      // Kullanıcının kendi referans kodu mu kontrol et
      const q = query(
        collection(db, 'customers'),
        where('uid', '==', userId),
        where('referralCode', '==', campaign.code),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { isValid: false, error: 'Kendi referans kodunuzu kullanamazsınız.' };
      }
    }

    // ✅ Tüm kontroller geçildi
    return {
      isValid: true,
      campaign,
      bonusPoints: campaign.bonusPoints,
      discountPercent: campaign.discountPercent
    };
  } catch (error) {
    console.error('❌ Referans kodu validasyon hatası:', error);
    return { isValid: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' };
  }
}

/**
 * Get user usage count for a specific code
 */
async function getUserUsageCount(code: string, userEmail: string, userId?: string): Promise<number> {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'referral_usage'),
        where('code', '==', code.toUpperCase()),
        where('userId', '==', userId)
      );
    } else {
      q = query(
        collection(db, 'referral_usage'),
        where('code', '==', code.toUpperCase()),
        where('userEmail', '==', userEmail.toLowerCase())
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Kullanım sayısı getirme hatası:', error);
    return 0;
  }
}

/**
 * Track referral code usage
 */
export async function trackReferralUsage(
  code: string,
  campaignId: string,
  userEmail: string,
  bonusAwarded: number,
  userId?: string,
  orderId?: string,
  discountApplied?: number,
  userIP?: string
): Promise<void> {
  try {
    // 1. Kullanımı kaydet
    const usage: Omit<ReferralUsage, 'id'> = {
      code: code.toUpperCase(),
      campaignId,
      userId: userId || null,
      userEmail: userEmail.toLowerCase(),
      userIP,
      usedAt: new Date().toISOString(),
      orderId,
      bonusAwarded,
      discountApplied
    };

    await addDoc(collection(db, 'referral_usage'), usage);

    // 2. Kampanya currentUses sayısını artır
    const campaign = await getReferralCampaignByCode(code);
    if (campaign) {
      await updateReferralCampaign(campaign.id, {
        currentUses: campaign.currentUses + 1
      });
    }

    console.log(`✅ Referans kullanımı kaydedildi: ${code} - ${userEmail}`);
  } catch (error) {
    console.error('❌ Referans kullanım kaydı hatası:', error);
    throw error;
  }
}

/**
 * Check if user has already used a referral code
 */
export async function hasUserUsedReferralCode(userEmail: string, userId?: string): Promise<boolean> {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'referral_usage'),
        where('userId', '==', userId),
        limit(1)
      );
    } else {
      q = query(
        collection(db, 'referral_usage'),
        where('userEmail', '==', userEmail.toLowerCase()),
        limit(1)
      );
    }

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Referans kullanım kontrolü hatası:', error);
    return false;
  }
}

// ==========================================
// ANALYTICS & REPORTING
// ==========================================

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: string): Promise<{
  totalUses: number;
  totalBonusAwarded: number;
  totalDiscountGiven: number;
  uniqueUsers: number;
  lastUsedAt: string | null;
}> {
  try {
    const q = query(
      collection(db, 'referral_usage'),
      where('campaignId', '==', campaignId),
      orderBy('usedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let totalBonusAwarded = 0;
    let totalDiscountGiven = 0;
    const uniqueEmails = new Set<string>();
    let lastUsedAt: string | null = null;

    snapshot.docs.forEach((doc, index) => {
      const usage = doc.data() as ReferralUsage;
      totalBonusAwarded += usage.bonusAwarded || 0;
      totalDiscountGiven += usage.discountApplied || 0;
      uniqueEmails.add(usage.userEmail);

      if (index === 0) {
        lastUsedAt = usage.usedAt;
      }
    });

    return {
      totalUses: snapshot.size,
      totalBonusAwarded,
      totalDiscountGiven,
      uniqueUsers: uniqueEmails.size,
      lastUsedAt
    };
  } catch (error) {
    console.error('❌ Kampanya istatistikleri hatası:', error);
    return {
      totalUses: 0,
      totalBonusAwarded: 0,
      totalDiscountGiven: 0,
      uniqueUsers: 0,
      lastUsedAt: null
    };
  }
}

/**
 * Get all active campaigns
 */
export async function getActiveCampaigns(): Promise<ReferralCampaign[]> {
  try {
    const q = query(
      collection(db, 'referral_campaigns'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralCampaign));
  } catch (error) {
    console.error('❌ Aktif kampanyalar getirme hatası:', error);
    return [];
  }
}

/**
 * Get user's referral usage history
 */
export async function getUserReferralHistory(userEmail: string, userId?: string): Promise<ReferralUsage[]> {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'referral_usage'),
        where('userId', '==', userId),
        orderBy('usedAt', 'desc'),
        limit(10)
      );
    } else {
      q = query(
        collection(db, 'referral_usage'),
        where('userEmail', '==', userEmail.toLowerCase()),
        orderBy('usedAt', 'desc'),
        limit(10)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralUsage));
  } catch (error) {
    console.error('❌ Kullanıcı referans geçmişi hatası:', error);
    return [];
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate campaign code
 */
export function generateCampaignCode(prefix: string = 'SADE'): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${random}${timestamp}`;
}

/**
 * Create a quick campaign
 */
export async function createQuickCampaign(
  description: string,
  bonusPoints: number,
  validDays: number = 30,
  maxUses: number = 100,
  createdBy: string = 'admin'
): Promise<string> {
  const code = generateCampaignCode();
  const now = new Date();
  const validUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

  return await createReferralCampaign({
    code,
    type: 'campaign',
    isActive: true,
    validFrom: now.toISOString(),
    validUntil: validUntil.toISOString(),
    maxUses,
    bonusPoints,
    perUserLimit: 1,
    description,
    createdBy
  });
}
