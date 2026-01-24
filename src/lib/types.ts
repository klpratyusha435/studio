import { FieldValue } from "firebase/firestore";

export type Role = 'Customer' | 'Vendor' | 'Admin';

export interface Session {
  name: string;
  role: Role;
  cafeId?: string;
  cafeName?: string;
}

export interface Cafe {
  id: string;
  name: string;
  locationTag: "hostel" | "gate" | "academic_block" | "quarters";
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  avgPrepTimeMins: number;
  approved: boolean;
  isDisabled: boolean;
  createdAt: FieldValue;
}

export interface MenuItem {
  id: string;
  cafeId: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  isPopular: boolean;
  updatedAt: FieldValue;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Cart {
  cafeId: string;
  cafeName: string;
  items: CartItem[];
  specialInstructions: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  isVeg: boolean;
}

export type OrderStatus = "placed" | "accepted" | "preparing" | "ready" | "completed" | "rejected";

export interface Order {
  id:string;
  customerName: string;
  cafeId: string;
  cafeName: string;
  items: OrderItem[];
  specialInstructions?: string;
  deliveryMode: "pickup" | "delivery";
  deliveryLocation?: {
    type: string;
    label: string;
  } | null;
  status: OrderStatus;
  etaMins: number;
  totalAmount: number;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface Announcement {
  id: string;
  message: string;
  active: boolean;
  createdAt: FieldValue;
}
