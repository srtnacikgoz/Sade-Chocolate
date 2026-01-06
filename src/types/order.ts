// --- ORDER TYPES ---

// Order Status Type - Heat Hold ve Pending Payment dahil
export type OrderStatus =
  | 'Pending Payment'    // EFT/Havale ödemesi bekleniyor
  | 'Awaiting Prep'
  | 'In Production'
  | 'Ready for Packing'
  | 'Heat Hold'
  | 'Shipped'
  | 'Cancelled'
  | 'Refunded';

// Payment Method Type
export type PaymentMethod = 'card' | 'eft';

// Heat Hold bilgileri
export interface HeatHoldInfo {
  isActive: boolean;
  reason: string;
  activatedAt: string;
  targetTemp: number;
  releaseTemp: number;
  autoRelease: boolean;
  releasedAt?: string;
}

// Blackout bilgileri
export interface BlackoutDelayInfo {
  isDelayed: boolean;
  originalOrderDate: string;
  scheduledShipDate: string;
  delayDays: number;
  reason: string;
}

// Soğutucu paketi bilgileri
export interface ColdPackInfo {
  required: boolean;
  quantity: number;
  reason: string;
  isSummerProtocol: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  addedAt: string;
  addedBy?: string;
  barcode?: string;
  estimatedDelivery?: string;
  shipmentId?: string;
  createdAt?: Date;
}

export interface OrderTag {
  label: string;
  color: string;
  addedAt: string;
}

export interface RefundRecord {
  id: string;
  reason: string;
  amount: number;
  percentage: number;
  method: 'original' | 'credit' | 'coupon';
  notes?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'completed';
}

export interface CancellationRecord {
  reason: string;
  notifyCustomer: boolean;
  refundPayment: boolean;
  notes?: string;
  cancelledAt: string;
  cancelledBy?: string;
}

export interface EditRecord {
  field: string;
  oldValue: any;
  newValue: any;
  editedAt: string;
  editedBy?: string;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    district?: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  priority: 'High' | 'Normal';
  tempAlert: boolean;
  gift: boolean;
  giftNote: string | null;
  sla: number;
  createdAt: string;
  shipping: {
    method: string;
    address: string;
    city: string;
    estimatedDate: string;
  };
  billing: {
    address: string;
    city: string;
  };
  payment: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  timeline: Array<{
    action: string;
    time: string;
    note?: string;
  }>;
  logistics: {
    lotNumber: string;
    coldPackage: boolean;
    shippingWindow: string;
    weatherAlert?: string;
    scheduledShipDate?: string;
    originalOrderDate?: string;
    blackoutDelay?: BlackoutDelayInfo;
    heatHold?: HeatHoldInfo;
    coldPack?: ColdPackInfo;
  };

  // Extended Fields for State Management
  tracking?: TrackingInfo;
  tags?: OrderTag[];
  refunds?: RefundRecord[];
  cancellation?: CancellationRecord;
  editHistory?: EditRecord[];
  specialNotes?: string;

  // Loyalty System Fields
  customerId?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  customerTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

  // Payment Method Fields (EFT/Havale)
  paymentMethod?: PaymentMethod;
  paymentDeadline?: string;           // ISO date string - ödeme son tarihi
  bankTransferDiscount?: number;      // Havale indirimi tutarı
  paymentConfirmedAt?: string;        // Ödeme onay tarihi
  paymentConfirmedBy?: string;        // Ödemeyi onaylayan admin
}
