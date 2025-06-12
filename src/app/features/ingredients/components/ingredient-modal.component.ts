import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../../core/services/data.service';
import { Ingredient } from '../../../core/models';

@Component({
  selector: 'app-ingredient-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ isEditing ? 'Editar' : 'Crear' }} Ingrediente</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('Cross click')"></button>
    </div>
    <div class="modal-body">
      <form [formGroup]="ingredientForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="name" class="form-label">Nombre:</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="form-control"
            [class.is-invalid]="ingredientForm.get('name')?.invalid && ingredientForm.get('name')?.touched"
          />
          <div class="invalid-feedback" *ngIf="ingredientForm.get('name')?.invalid && ingredientForm.get('name')?.touched">
            El nombre es requerido
          </div>
        </div>

        <div class="mb-3">
          <label for="unit" class="form-label">Unidad de medida:</label>
          <select
            id="unit"
            formControlName="unit"
            class="form-select"
            [class.is-invalid]="ingredientForm.get('unit')?.invalid && ingredientForm.get('unit')?.touched"
          >
            <option value="">Seleccionar unidad</option>
            <option value="unidad">Unidad</option>
            <option value="gramo">Gramo</option>
            <option value="kilo">Kilo</option>
          </select>
          <div class="invalid-feedback" *ngIf="ingredientForm.get('unit')?.invalid && ingredientForm.get('unit')?.touched">
            La unidad es requerida
          </div>
        </div>

        <div class="mb-3">
          <label for="pricePerUnit" class="form-label">Precio por unidad:</label>
          <input
            id="pricePerUnit"
            type="number"
            step="0.01"
            min="0"
            formControlName="pricePerUnit"
            class="form-control"
            [class.is-invalid]="ingredientForm.get('pricePerUnit')?.invalid && ingredientForm.get('pricePerUnit')?.touched"
          />
          <div class="invalid-feedback" *ngIf="ingredientForm.get('pricePerUnit')?.invalid && ingredientForm.get('pricePerUnit')?.touched">
            <span *ngIf="ingredientForm.get('pricePerUnit')?.errors?.['required']">El precio es requerido</span>
            <span *ngIf="ingredientForm.get('pricePerUnit')?.errors?.['min']">El precio debe ser mayor a 0</span>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss('cancel')">
        Cancelar
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        [disabled]="ingredientForm.invalid"
        (click)="onSubmit()"
      >
        {{ isEditing ? 'Actualizar' : 'Crear' }}
      </button>
    </div>
  `
})
export class IngredientModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  activeModal = inject(NgbActiveModal);

  ingredient?: Ingredient;
  isEditing = false;

  ingredientForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    pricePerUnit: ['', [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    if (this.ingredient) {
      this.isEditing = true;
      this.ingredientForm.patchValue(this.ingredient);
    }
  }

  onSubmit(): void {
    if (this.ingredientForm.valid) {
      const formValue = this.ingredientForm.value;
      
      if (this.isEditing && this.ingredient) {
        this.dataService.updateIngredient({
          ...this.ingredient,
          ...formValue
        });
      } else {
        this.dataService.addIngredient(formValue);
      }
      
      this.activeModal.close('saved');
    }
  }
}