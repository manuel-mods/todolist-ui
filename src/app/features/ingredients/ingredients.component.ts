import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Ingredient } from '../../core/models';
import { IngredientListComponent } from './components/ingredient-list.component';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule, IngredientListComponent],
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.scss']
})
export class IngredientsComponent {
  private dataService = inject(DataService);
  
  ingredients$: Observable<Ingredient[]> = this.dataService.getIngredients();
}