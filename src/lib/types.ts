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

export interface Order {
  id: string;
  customerName: string;
  cafeId: string;
  cafeName: string;
  items: string[];
  specialInstructions?: string;
  deliveryMode: "pickup" | "delivery";
  deliveryLocation?: {
    type: string;
    label: string;
  };
  status: string;
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
