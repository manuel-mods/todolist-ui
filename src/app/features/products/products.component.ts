import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Product } from '../../core/models';
import { ProductListComponent } from './components/product-list.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent {
  private dataService = inject(DataService);
  
  products$: Observable<Product[]> = this.dataService.getProducts();
}