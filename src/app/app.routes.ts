import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/sales', pathMatch: 'full' },
  { 
    path: 'ingredients', 
    loadComponent: () => import('./features/ingredients/ingredients.component').then(m => m.IngredientsComponent)
  },
  { 
    path: 'products', 
    loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
  },
  { 
    path: 'sales', 
    loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent)
  },
  { 
    path: 'sales-history', 
    loadComponent: () => import('./features/sales-history/sales-history.component').then(m => m.SalesHistoryComponent)
  },
  { 
    path: 'customers', 
    loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
  },
  { 
    path: 'reports', 
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  }
];
