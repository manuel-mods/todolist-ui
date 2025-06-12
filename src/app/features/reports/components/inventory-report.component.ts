import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryReport } from '../../../core/models';

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.scss']
})
export class InventoryReportComponent {
  @Input() report!: InventoryReport;

  getTotalIngredientCost(): number {
    return this.report.ingredientUsage.reduce((total, ingredient) => total + ingredient.cost, 0);
  }

  getUsagePercentage(cost: number): number {
    const maxCost = Math.max(...this.report.ingredientUsage.map(ing => ing.cost));
    return maxCost > 0 ? (cost / maxCost) * 100 : 0;
  }

  getBarHeight(cost: number): number {
    const maxCost = Math.max(...this.report.ingredientUsage.slice(0, 8).map(ing => ing.cost));
    return maxCost > 0 ? (cost / maxCost) * 100 : 0;
  }

  getShortName(name: string): string {
    return name.length > 8 ? name.substring(0, 8) + '...' : name;
  }
}