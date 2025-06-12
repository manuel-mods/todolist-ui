export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  date: Date;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  customerName?: string;
}