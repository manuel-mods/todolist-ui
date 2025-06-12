import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { DataService } from './data.service';
import { 
  SalesReport, 
  CustomerReport, 
  InventoryReport, 
  ProductSalesData,
  PaymentMethodData,
  DailySalesData,
  TopCustomerData,
  CustomerGrowthData,
  IngredientUsageData
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private dataService = inject(DataService);

  getSalesReport(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<SalesReport> {
    return combineLatest([
      this.dataService.getSales(),
      this.dataService.getProducts()
    ]).pipe(
      map(([sales, products]) => {
        const { startDate, endDate } = this.getPeriodDates(period);
        const filteredSales = sales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= startDate && saleDate <= endDate;
        });

        const totalSales = filteredSales.length;
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Sales by product
        const productSalesMap = new Map<string, { quantity: number; revenue: number; name: string }>();
        filteredSales.forEach(sale => {
          sale.items.forEach(item => {
            const current = productSalesMap.get(item.productId) || { quantity: 0, revenue: 0, name: item.productName };
            productSalesMap.set(item.productId, {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + item.totalPrice,
              name: item.productName
            });
          });
        });

        const salesByProduct: ProductSalesData[] = Array.from(productSalesMap.entries()).map(([id, data]) => ({
          productId: id,
          productName: data.name,
          totalQuantity: data.quantity,
          totalRevenue: data.revenue,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Sales by payment method
        const paymentMethodMap = new Map<string, { count: number; revenue: number }>();
        filteredSales.forEach(sale => {
          const current = paymentMethodMap.get(sale.paymentMethod) || { count: 0, revenue: 0 };
          paymentMethodMap.set(sale.paymentMethod, {
            count: current.count + 1,
            revenue: current.revenue + sale.total
          });
        });

        const salesByPaymentMethod: PaymentMethodData[] = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
          method: method as 'efectivo' | 'tarjeta' | 'transferencia',
          count: data.count,
          totalRevenue: data.revenue,
          percentage: totalSales > 0 ? (data.count / totalSales) * 100 : 0
        }));

        // Daily sales data
        const dailySalesMap = new Map<string, { sales: number; revenue: number }>();
        filteredSales.forEach(sale => {
          const dateKey = new Date(sale.date).toISOString().split('T')[0];
          const current = dailySalesMap.get(dateKey) || { sales: 0, revenue: 0 };
          dailySalesMap.set(dateKey, {
            sales: current.sales + 1,
            revenue: current.revenue + sale.total
          });
        });

        const dailySalesData: DailySalesData[] = Array.from(dailySalesMap.entries()).map(([date, data]) => ({
          date,
          totalSales: data.sales,
          totalRevenue: data.revenue
        })).sort((a, b) => a.date.localeCompare(b.date));

        return {
          period,
          startDate,
          endDate,
          totalSales,
          totalRevenue,
          averageOrderValue,
          salesByProduct,
          salesByPaymentMethod,
          dailySalesData
        };
      })
    );
  }

  getCustomerReport(): Observable<CustomerReport> {
    return combineLatest([
      this.dataService.getCustomers(),
      this.dataService.getSales()
    ]).pipe(
      map(([customers, sales]) => {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const totalCustomers = customers.length;
        const newCustomersThisMonth = customers.filter(customer => 
          customer.createdAt >= firstDayOfMonth
        ).length;
        const activeCustomers = customers.filter(customer => customer.totalPurchases > 0).length;

        // Top customers
        const topCustomers: TopCustomerData[] = customers
          .filter(customer => customer.totalPurchases > 0)
          .map(customer => {
            const customerSales = sales.filter(sale => sale.customerName === customer.name);
            return {
              customerId: customer.id,
              customerName: customer.name,
              totalPurchases: customer.totalPurchases,
              totalOrders: customerSales.length,
              lastPurchaseDate: customer.lastPurchaseDate || new Date()
            };
          })
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 10);

        // Customer growth data (last 6 months)
        const customerGrowthData: CustomerGrowthData[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
          
          const newCustomersInMonth = customers.filter(customer => 
            customer.createdAt >= monthDate && customer.createdAt < nextMonthDate
          ).length;
          
          const totalCustomersUntilMonth = customers.filter(customer => 
            customer.createdAt < nextMonthDate
          ).length;

          customerGrowthData.push({
            month: monthDate.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
            newCustomers: newCustomersInMonth,
            totalCustomers: totalCustomersUntilMonth
          });
        }

        return {
          totalCustomers,
          newCustomersThisMonth,
          activeCustomers,
          topCustomers,
          customerGrowthData
        };
      })
    );
  }

  getInventoryReport(): Observable<InventoryReport> {
    return combineLatest([
      this.dataService.getProducts(),
      this.dataService.getIngredients(),
      this.dataService.getSales()
    ]).pipe(
      map(([products, ingredients, sales]) => {
        const totalProducts = products.length;
        const totalIngredients = ingredients.length;

        // Top selling products
        const productSalesMap = new Map<string, { quantity: number; revenue: number; name: string }>();
        sales.forEach(sale => {
          sale.items.forEach(item => {
            const current = productSalesMap.get(item.productId) || { quantity: 0, revenue: 0, name: item.productName };
            productSalesMap.set(item.productId, {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + item.totalPrice,
              name: item.productName
            });
          });
        });

        const totalRevenue = Array.from(productSalesMap.values()).reduce((sum, data) => sum + data.revenue, 0);
        const topSellingProducts: ProductSalesData[] = Array.from(productSalesMap.entries()).map(([id, data]) => ({
          productId: id,
          productName: data.name,
          totalQuantity: data.quantity,
          totalRevenue: data.revenue,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10);

        // Ingredient usage
        const ingredientUsageMap = new Map<string, { used: number; cost: number; name: string; unit: string }>();
        
        sales.forEach(sale => {
          sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              product.ingredients.forEach(productIngredient => {
                const ingredient = ingredients.find(ing => ing.id === productIngredient.ingredientId);
                if (ingredient) {
                  const current = ingredientUsageMap.get(ingredient.id) || { 
                    used: 0, 
                    cost: 0, 
                    name: ingredient.name, 
                    unit: ingredient.unit 
                  };
                  const usedQuantity = productIngredient.quantity * item.quantity;
                  const cost = usedQuantity * ingredient.pricePerUnit;
                  
                  ingredientUsageMap.set(ingredient.id, {
                    used: current.used + usedQuantity,
                    cost: current.cost + cost,
                    name: ingredient.name,
                    unit: ingredient.unit
                  });
                }
              });
            }
          });
        });

        const ingredientUsage: IngredientUsageData[] = Array.from(ingredientUsageMap.entries()).map(([id, data]) => ({
          ingredientId: id,
          ingredientName: data.name,
          totalUsed: data.used,
          unit: data.unit,
          cost: data.cost
        })).sort((a, b) => b.cost - a.cost);

        return {
          totalProducts,
          totalIngredients,
          topSellingProducts,
          ingredientUsage
        };
      })
    );
  }

  private getPeriodDates(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }
}