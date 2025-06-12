import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../../core/services/data.service';
import { Product, Ingredient } from '../../../core/models';
import { ProductModalComponent } from './product-modal.component';

interface ProductWithDetails extends Product {
  cost: number;
  ingredientDetails: { name: string; unit: string; quantity: number; cost: number }[];
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private dataService = inject(DataService);
  private modalService = inject(NgbModal);
  
  productsWithDetails$: Observable<ProductWithDetails[]> = combineLatest([
    this.dataService.getProducts(),
    this.dataService.getIngredients()
  ]).pipe(
    map(([products, ingredients]) => 
      products.map(product => this.enrichProductWithDetails(product, ingredients))
    )
  );

  ngOnInit(): void {}

  openCreateModal(): void {
    const modalRef = this.modalService.open(ProductModalComponent, { size: 'lg' });
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Producto guardado exitosamente
        }
      },
      () => {
        // Modal cerrado sin guardar
      }
    );
  }

  editProduct(product: Product): void {
    const modalRef = this.modalService.open(ProductModalComponent, { size: 'lg' });
    modalRef.componentInstance.product = product;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Producto actualizado exitosamente
        }
      },
      () => {
        // Modal cerrado sin guardar
      }
    );
  }

  deleteProduct(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.dataService.deleteProduct(id);
    }
  }

  private enrichProductWithDetails(product: Product, ingredients: Ingredient[]): ProductWithDetails {
    const ingredientDetails = product.ingredients.map(productIngredient => {
      const ingredient = ingredients.find(ing => ing.id === productIngredient.ingredientId);
      const cost = ingredient ? productIngredient.quantity * ingredient.pricePerUnit : 0;
      
      return {
        name: ingredient?.name || 'Ingrediente no encontrado',
        unit: ingredient?.unit || '',
        quantity: productIngredient.quantity,
        cost
      };
    });

    const totalCost = ingredientDetails.reduce((sum, detail) => sum + detail.cost, 0);

    return {
      ...product,
      cost: totalCost,
      ingredientDetails
    };
  }

  // TrackBy function for performance
  trackProduct(_index: number, product: ProductWithDetails): string {
    return product.id;
  }
}