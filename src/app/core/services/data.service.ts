import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ingredient, Product, Sale, Customer } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private salesSubject = new BehaviorSubject<Sale[]>([]);
  private customersSubject = new BehaviorSubject<Customer[]>([]);

  ingredients$ = this.ingredientsSubject.asObservable();
  products$ = this.productsSubject.asObservable();
  sales$ = this.salesSubject.asObservable();
  customers$ = this.customersSubject.asObservable();

  constructor() {
    if (environment.useMockData) {
      this.loadMockData();
    }
  }

  private loadMockData(): void {
    const mockIngredients: Ingredient[] = [
      { id: '1', name: 'Harina', unit: 'kilo', pricePerUnit: 2.5 },
      { id: '2', name: 'Azúcar', unit: 'kilo', pricePerUnit: 1.8 },
      { id: '3', name: 'Huevos', unit: 'unidad', pricePerUnit: 0.3 },
      { id: '4', name: 'Mantequilla', unit: 'gramo', pricePerUnit: 0.01 }
    ];
    
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Torta de Chocolate',
        ingredients: [
          { ingredientId: '1', quantity: 0.5 },
          { ingredientId: '2', quantity: 0.3 },
          { ingredientId: '3', quantity: 3 },
          { ingredientId: '4', quantity: 200 }
        ]
      },
      {
        id: '2',
        name: 'Cupcakes Vainilla',
        ingredients: [
          { ingredientId: '1', quantity: 0.3 },
          { ingredientId: '2', quantity: 0.2 },
          { ingredientId: '3', quantity: 2 }
        ]
      }
    ];

    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'María García',
        email: 'maria.garcia@email.com',
        phone: '+1 234-567-8901',
        address: 'Calle Principal 123, Centro',
        birthDate: '1985-03-15',
        notes: 'Cliente frecuente, prefiere tortas de chocolate',
        totalPurchases: 450.75,
        lastPurchaseDate: new Date('2024-01-10'),
        createdAt: new Date('2023-06-15'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: '2',
        name: 'Carlos Rodríguez',
        email: 'carlos.r@email.com',
        phone: '+1 234-567-8902',
        totalPurchases: 125.30,
        lastPurchaseDate: new Date('2024-01-08'),
        createdAt: new Date('2023-09-20'),
        updatedAt: new Date('2024-01-08')
      },
      {
        id: '3',
        name: 'Ana López',
        email: 'ana.lopez@email.com',
        phone: '+1 234-567-8903',
        address: 'Avenida Norte 456, Zona 2',
        totalPurchases: 275.90,
        lastPurchaseDate: new Date('2024-01-12'),
        createdAt: new Date('2023-11-10'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    const mockSales: Sale[] = [
      {
        id: '1',
        date: new Date('2024-01-10'),
        items: [
          { productId: '1', productName: 'Torta de Chocolate', quantity: 1, unitPrice: 25.00, totalPrice: 25.00 }
        ],
        subtotal: 25.00,
        tax: 4.50,
        total: 29.50,
        paymentMethod: 'efectivo',
        customerName: 'María García'
      },
      {
        id: '2',
        date: new Date('2024-01-11'),
        items: [
          { productId: '2', productName: 'Cupcakes Vainilla', quantity: 6, unitPrice: 3.50, totalPrice: 21.00 }
        ],
        subtotal: 21.00,
        tax: 3.78,
        total: 24.78,
        paymentMethod: 'tarjeta',
        customerName: 'Carlos Rodríguez'
      },
      {
        id: '3',
        date: new Date('2024-01-12'),
        items: [
          { productId: '1', productName: 'Torta de Chocolate', quantity: 2, unitPrice: 25.00, totalPrice: 50.00 },
          { productId: '2', productName: 'Cupcakes Vainilla', quantity: 4, unitPrice: 3.50, totalPrice: 14.00 }
        ],
        subtotal: 64.00,
        tax: 11.52,
        total: 75.52,
        paymentMethod: 'transferencia',
        customerName: 'Ana López'
      }
    ];
    
    this.ingredientsSubject.next(mockIngredients);
    this.productsSubject.next(mockProducts);
    this.salesSubject.next(mockSales);
    this.customersSubject.next(mockCustomers);
  }

  // Ingredients CRUD
  getIngredients(): Observable<Ingredient[]> {
    return this.ingredients$;
  }

  addIngredient(ingredient: Omit<Ingredient, 'id'>): void {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: Date.now().toString()
    };
    
    const currentIngredients = this.ingredientsSubject.value;
    this.ingredientsSubject.next([...currentIngredients, newIngredient]);
  }

  updateIngredient(ingredient: Ingredient): void {
    const currentIngredients = this.ingredientsSubject.value;
    const updatedIngredients = currentIngredients.map(ing => 
      ing.id === ingredient.id ? ingredient : ing
    );
    this.ingredientsSubject.next(updatedIngredients);
  }

  deleteIngredient(id: string): void {
    const currentIngredients = this.ingredientsSubject.value;
    const filteredIngredients = currentIngredients.filter(ing => ing.id !== id);
    this.ingredientsSubject.next(filteredIngredients);
  }

  // Products CRUD
  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    
    const currentProducts = this.productsSubject.value;
    this.productsSubject.next([...currentProducts, newProduct]);
  }

  updateProduct(product: Product): void {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.map(prod => 
      prod.id === product.id ? product : prod
    );
    this.productsSubject.next(updatedProducts);
  }

  deleteProduct(id: string): void {
    const currentProducts = this.productsSubject.value;
    const filteredProducts = currentProducts.filter(prod => prod.id !== id);
    this.productsSubject.next(filteredProducts);
  }

  // Cost calculation
  calculateProductCost(product: Product): number {
    const ingredients = this.ingredientsSubject.value;
    
    return product.ingredients.reduce((total, productIngredient) => {
      const ingredient = ingredients.find(ing => ing.id === productIngredient.ingredientId);
      if (ingredient) {
        return total + (productIngredient.quantity * ingredient.pricePerUnit);
      }
      return total;
    }, 0);
  }

  // Sales CRUD
  getSales(): Observable<Sale[]> {
    return this.sales$;
  }

  addSale(sale: Omit<Sale, 'id'>): void {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString()
    };
    
    const currentSales = this.salesSubject.value;
    this.salesSubject.next([...currentSales, newSale]);
  }

  // Calculate product selling price (cost + margin)
  calculateProductSellingPrice(product: Product, marginPercentage: number = 150): number {
    const cost = this.calculateProductCost(product);
    return cost * (marginPercentage / 100);
  }

  // Customers CRUD
  getCustomers(): Observable<Customer[]> {
    return this.customers$;
  }

  addCustomer(customer: Omit<Customer, 'id' | 'totalPurchases' | 'createdAt' | 'updatedAt'>): void {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      totalPurchases: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentCustomers = this.customersSubject.value;
    this.customersSubject.next([...currentCustomers, newCustomer]);
  }

  updateCustomer(customer: Customer): void {
    const currentCustomers = this.customersSubject.value;
    const updatedCustomers = currentCustomers.map(cust => 
      cust.id === customer.id ? { ...customer, updatedAt: new Date() } : cust
    );
    this.customersSubject.next(updatedCustomers);
  }

  deleteCustomer(id: string): void {
    const currentCustomers = this.customersSubject.value;
    const filteredCustomers = currentCustomers.filter(cust => cust.id !== id);
    this.customersSubject.next(filteredCustomers);
  }

  // Customer analytics
  getCustomerStats(): { totalCustomers: number; newCustomersThisMonth: number; averagePurchaseValue: number } {
    const customers = this.customersSubject.value;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const newCustomersThisMonth = customers.filter(customer => 
      customer.createdAt >= firstDayOfMonth
    ).length;
    
    const totalPurchases = customers.reduce((sum, customer) => sum + customer.totalPurchases, 0);
    const customersWithPurchases = customers.filter(customer => customer.totalPurchases > 0).length;
    const averagePurchaseValue = customersWithPurchases > 0 ? totalPurchases / customersWithPurchases : 0;
    
    return {
      totalCustomers: customers.length,
      newCustomersThisMonth,
      averagePurchaseValue
    };
  }

  getTopCustomers(limit: number = 5): Customer[] {
    return this.customersSubject.value
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, limit);
  }
}