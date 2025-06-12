import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../../core/services/data.service';
import { Ingredient } from '../../../core/models';
import { IngredientModalComponent } from './ingredient-modal.component';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-list.component.html',
  styleUrls: ['./ingredient-list.component.scss']
})
export class IngredientListComponent implements OnInit {
  private dataService = inject(DataService);
  private modalService = inject(NgbModal);
  
  ingredients$: Observable<Ingredient[]> = this.dataService.getIngredients();

  ngOnInit(): void {}

  openCreateModal(): void {
    const modalRef = this.modalService.open(IngredientModalComponent);
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Ingrediente guardado exitosamente
        }
      },
      (dismissed) => {
        // Modal cerrado sin guardar
      }
    );
  }

  editIngredient(ingredient: Ingredient): void {
    const modalRef = this.modalService.open(IngredientModalComponent);
    modalRef.componentInstance.ingredient = ingredient;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Ingrediente actualizado exitosamente
        }
      },
      (dismissed) => {
        // Modal cerrado sin guardar
      }
    );
  }

  deleteIngredient(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
      this.dataService.deleteIngredient(id);
    }
  }

  // TrackBy function for performance
  trackIngredient(_index: number, ingredient: Ingredient): string {
    return ingredient.id;
  }
}