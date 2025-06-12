export interface SalesReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  salesByProduct: ProductSalesData[];
  salesByPaymentMethod: PaymentMethodData[];
  dailySalesData: DailySalesData[];
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  percentage: number;
}

export interface PaymentMethodData {
  method: 'efectivo' | 'tarjeta' | 'transferencia';
  count: number;
  totalRevenue: number;
  percentage: number;
}

export interface DailySalesData {
  date: string;
  totalSales: number;
  totalRevenue: number;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;
  topCustomers: TopCustomerData[];
  customerGrowthData: CustomerGrowthData[];
}

export interface TopCustomerData {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalOrders: number;
  lastPurchaseDate: Date;
}

export interface CustomerGrowthData {
  month: string;
  newCustomers: number;
  totalCustomers: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalIngredients: number;
  topSellingProducts: ProductSalesData[];
  ingredientUsage: IngredientUsageData[];
}

export interface IngredientUsageData {
  ingredientId: string;
  ingredientName: string;
  totalUsed: number;
  unit: string;
  cost: number;
}