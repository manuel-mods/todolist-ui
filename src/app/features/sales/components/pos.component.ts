import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest, map } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { Product, SaleItem, Sale } from '../../../core/models';

interface ProductWithPrices extends Product {
  cost: number;
  sellingPrice: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
  private dataService = inject(DataService);

  productsWithPrices$: Observable<ProductWithPrices[]> = combineLatest([
    this.dataService.getProducts(),
    this.dataService.getIngredients()
  ]).pipe(
    map(([products]) => 
      products.map(product => ({
        ...product,
        cost: this.dataService.calculateProductCost(product),
        sellingPrice: this.dataService.calculateProductSellingPrice(product)
      }))
    )
  );

  cartItems: SaleItem[] = [];
  customerName: string = '';
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' = 'efectivo';

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get tax(): number {
    return this.subtotal * 0.18; // 18% IVA
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  ngOnInit(): void {}

  addToCart(product: ProductWithPrices): void {
    const existingItem = this.cartItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      this.updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice
      };
      this.cartItems.push(newItem);
    }
  }

  updateQuantity(productId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.cartItems.find(item => item.productId === productId);
    if (item) {
      item.quantity = newQuantity;
      item.totalPrice = item.unitPrice * newQuantity;
    }
  }

  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);
  }

  clearCart(): void {
    this.cartItems = [];
    this.customerName = '';
  }

  processSale(): void {
    if (this.cartItems.length === 0) return;

    const sale: Omit<Sale, 'id'> = {
      date: new Date(),
      items: [...this.cartItems],
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.total,
      paymentMethod: this.paymentMethod,
      customerName: this.customerName || undefined
    };

    this.dataService.addSale(sale);

    // Mostrar mensaje de éxito
    alert(`¡Venta procesada exitosamente!\nTotal: $${this.total.toFixed(2)}\nMétodo: ${this.paymentMethod}`);

    // Limpiar carrito
    this.clearCart();
  }

  // TrackBy functions for performance
  trackProduct(index: number, product: ProductWithPrices): string {
    return product.id;
  }

  trackCartItem(index: number, item: SaleItem): string {
    return item.productId;
  }
}