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
}
