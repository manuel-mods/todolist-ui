export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  notes?: string;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  averagePurchaseValue: number;
  topCustomers: Customer[];
}