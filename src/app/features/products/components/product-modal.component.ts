import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { Ingredient, Product } from '../../../core/models';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss']
})
export class ProductModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  activeModal = inject(NgbActiveModal);

  product?: Product;
  isEditing = false;
  ingredients$: Observable<Ingredient[]> = this.dataService.getIngredients();
  estimatedCost: number = 0;

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    ingredients: this.fb.array([])
  });

  get ingredientsArray(): FormArray {
    return this.productForm.get('ingredients') as FormArray;
  }

  ngOnInit(): void {
    if (this.product) {
      this.isEditing = true;
      this.productForm.patchValue({
        name: this.product.name
      });
      
      // Llenar ingredientes existentes
      this.product.ingredients.forEach(ing => {
        this.addIngredient(ing.ingredientId, ing.quantity);
      });
    } else {
      this.addIngredient();
    }
    
    this.productForm.valueChanges.subscribe(() => {
      this.calculateCost();
    });
  }

  addIngredient(ingredientId: string = '', quantity: number = 0): void {
    const ingredientGroup = this.fb.group({
      ingredientId: [ingredientId, Validators.required],
      quantity: [quantity || '', [Validators.required, Validators.min(0.01)]]
    });
    
    this.ingredientsArray.push(ingredientGroup);
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  calculateCost(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const tempProduct = {
        id: 'temp',
        name: formValue.name,
        ingredients: formValue.ingredients.filter((ing: any) => ing.ingredientId && ing.quantity)
      };
      
      this.estimatedCost = this.dataService.calculateProductCost(tempProduct);
    } else {
      this.estimatedCost = 0;
    }
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const productData = {
        name: formValue.name,
        ingredients: formValue.ingredients.filter((ing: any) => ing.ingredientId && ing.quantity)
      };
      
      if (this.isEditing && this.product) {
        this.dataService.updateProduct({
          ...this.product,
          ...productData
        });
      } else {
        this.dataService.addProduct(productData);
      }
      
      this.activeModal.close('saved');
    }
  }
}