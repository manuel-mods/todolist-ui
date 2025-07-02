import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistItem } from '../../../core/models';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checklist-container">
      <div class="checklist-header">
        <h4>Checklist</h4>
        <div class="progress-info" *ngIf="checklistItems().length > 0">
          {{ completedCount() }}/{{ checklistItems().length }} completed
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar" *ngIf="checklistItems().length > 0">
        <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
      </div>

      <!-- Checklist items -->
      <div class="checklist-items">
        <div 
          *ngFor="let item of checklistItems(); trackBy: trackById" 
          class="checklist-item"
          [class.completed]="item.isCompleted">
          <div class="item-content">
            <label class="checkbox-wrapper">
              <input 
                type="checkbox" 
                [checked]="item.isCompleted"
                (change)="toggleItem(item)"
                [disabled]="updating().has(item.id)">
              <span class="checkmark"></span>
            </label>
            
            <div class="item-text" *ngIf="!editingItem() || editingItem() !== item.id">
              <span [class.strikethrough]="item.isCompleted">{{ item.title }}</span>
              <div class="item-actions">
                <button 
                  class="edit-btn" 
                  (click)="startEdit(item)"
                  [disabled]="updating().has(item.id)"
                  title="Edit item">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="delete-btn" 
                  (click)="deleteItem(item.id)"
                  [disabled]="updating().has(item.id)"
                  title="Delete item">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="item-edit" *ngIf="editingItem() === item.id">
              <input 
                type="text" 
                [(ngModel)]="editText"
                (keyup.enter)="saveEdit(item)"
                (keyup.escape)="cancelEdit()"
                class="edit-input"
                #editInput>
              <div class="edit-actions">
                <button class="save-btn" (click)="saveEdit(item)">
                  <i class="fas fa-check"></i>
                </button>
                <button class="cancel-btn" (click)="cancelEdit()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add new item -->
      <div class="add-item">
        <div class="add-form" *ngIf="!showAddForm()">
          <button class="add-btn" (click)="showAddForm.set(true)">
            <i class="fas fa-plus"></i>
            Add checklist item
          </button>
        </div>
        
        <div class="add-form-expanded" *ngIf="showAddForm()">
          <input 
            type="text" 
            [(ngModel)]="newItemTitle"
            (keyup.enter)="addItem()"
            (keyup.escape)="cancelAdd()"
            placeholder="Enter checklist item..."
            class="add-input"
            #addInput>
          <div class="add-actions">
            <button 
              class="save-btn" 
              (click)="addItem()"
              [disabled]="!newItemTitle.trim() || adding()">
              <span *ngIf="adding()" class="spinner"></span>
              <i class="fas fa-check" *ngIf="!adding()"></i>
            </button>
            <button class="cancel-btn" (click)="cancelAdd()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="checklistItems().length === 0">
        <i class="fas fa-list-check"></i>
        <p>No checklist items yet</p>
        <small>Add items to track subtasks</small>
      </div>
    </div>
  `,
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent {
  taskId = input.required<number>();
  checklistItems = input.required<ChecklistItem[]>();

  private checklistService = inject(ChecklistService);

  // Component state
  editingItem = signal<string | null>(null);
  showAddForm = signal(false);
  updating = signal(new Set<string>());
  adding = signal(false);

  // Form data
  newItemTitle = '';
  editText = '';

  // Computed values
  completedCount = () => this.checklistItems().filter(item => item.isCompleted).length;
  progressPercentage = () => {
    const total = this.checklistItems().length;
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  };

  trackById(index: number, item: ChecklistItem): string {
    return item.id;
  }

  toggleItem(item: ChecklistItem): void {
    this.updateItemStatus(item.id, true);
    
    this.checklistService.updateChecklistItem(item.id, {
      isCompleted: !item.isCompleted
    }).subscribe({
      next: () => {
        // Update will be handled by parent component
        this.updateItemStatus(item.id, false);
      },
      error: (error) => {
        console.error('Error updating checklist item:', error);
        this.updateItemStatus(item.id, false);
        // TODO: Show error toast
      }
    });
  }

  startEdit(item: ChecklistItem): void {
    this.editingItem.set(item.id);
    this.editText = item.title;
    
    // Focus the input after the view updates
    setTimeout(() => {
      const input = document.querySelector('.edit-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  saveEdit(item: ChecklistItem): void {
    const trimmedText = this.editText.trim();
    if (!trimmedText || trimmedText === item.title) {
      this.cancelEdit();
      return;
    }

    this.updateItemStatus(item.id, true);
    
    this.checklistService.updateChecklistItem(item.id, {
      title: trimmedText
    }).subscribe({
      next: () => {
        this.editingItem.set(null);
        this.editText = '';
        this.updateItemStatus(item.id, false);
        // Update will be handled by parent component
      },
      error: (error) => {
        console.error('Error updating checklist item:', error);
        this.updateItemStatus(item.id, false);
        // TODO: Show error toast
      }
    });
  }

  cancelEdit(): void {
    this.editingItem.set(null);
    this.editText = '';
  }

  addItem(): void {
    const trimmedTitle = this.newItemTitle.trim();
    if (!trimmedTitle) return;

    this.adding.set(true);
    
    this.checklistService.addChecklistItem(this.taskId(), {
      title: trimmedTitle
    }).subscribe({
      next: () => {
        this.newItemTitle = '';
        this.showAddForm.set(false);
        this.adding.set(false);
        // Update will be handled by parent component
      },
      error: (error) => {
        console.error('Error adding checklist item:', error);
        this.adding.set(false);
        // TODO: Show error toast
      }
    });
  }

  cancelAdd(): void {
    this.newItemTitle = '';
    this.showAddForm.set(false);
  }

  deleteItem(itemId: string): void {
    if (!confirm('Are you sure you want to delete this checklist item?')) {
      return;
    }

    this.updateItemStatus(itemId, true);
    
    this.checklistService.deleteChecklistItem(itemId).subscribe({
      next: () => {
        this.updateItemStatus(itemId, false);
        // Update will be handled by parent component
      },
      error: (error) => {
        console.error('Error deleting checklist item:', error);
        this.updateItemStatus(itemId, false);
        // TODO: Show error toast
      }
    });
  }

  private updateItemStatus(itemId: string, isUpdating: boolean): void {
    this.updating.update(set => {
      const newSet = new Set(set);
      if (isUpdating) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }
}