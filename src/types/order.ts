// --- ORDER TYPES ---

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
  };
  items: OrderItem[];
  status: 'Awaiting Prep' | 'In Production' | 'Ready for Packing' | 'Shipped' | 'Cancelled' | 'Refunded';
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
  };

  // Extended Fields for State Management
  tracking?: TrackingInfo;
  tags?: OrderTag[];
  refunds?: RefundRecord[];
  cancellation?: CancellationRecord;
  editHistory?: EditRecord[];
  specialNotes?: string;

  // Loyalty System Fields
  customerId?: string;           // Reference to customers collection
  loyaltyPointsEarned?: number;  // Points earned from this order
  loyaltyPointsRedeemed?: number; // Points used in this order
  customerTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'; // Customer tier at order time
}
