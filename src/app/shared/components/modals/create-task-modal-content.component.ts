import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { CreateTaskRequest } from '../../../core/models';

@Component({
  selector: 'app-create-task-modal-content',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styles: [`
    .checklist-builder {
      .checklist-items {
        margin-bottom: 12px;
        
        .checklist-item {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 4px;
          
          .item-content {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .item-number {
              font-weight: 600;
              color: #6c757d;
              font-size: 12px;
              min-width: 20px;
            }
            
            .item-text {
              flex: 1;
              font-size: 14px;
              color: #495057;
            }
            
            .remove-btn {
              background: none;
              border: none;
              color: #dc3545;
              cursor: pointer;
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 12px;
              
              &:hover {
                background: rgba(220, 53, 69, 0.1);
              }
            }
          }
        }
      }
      
      .add-checklist-item {
        .input-group {
          margin-bottom: 4px;
        }
        
        small {
          font-size: 12px;
          color: #6c757d;
        }
      }
    }
  `],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Create New Task</h4>
      <button 
        type="button" 
        class="btn-close" 
        aria-label="Close"
        (click)="activeModal.dismiss()"
      ></button>
    </div>

    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="mb-3">
          <label for="title" class="form-label">Task Title *</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="form-control"
            [class.is-invalid]="taskForm.get('title')?.invalid && taskForm.get('title')?.touched"
            placeholder="Enter task title"
          >
          <div class="invalid-feedback" *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched">
            Task title is required
          </div>
        </div>

        <div class="mb-3">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-control"
            rows="4"
            placeholder="Enter task description (optional)"
          ></textarea>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="priority" class="form-label">Priority</label>
              <select id="priority" formControlName="priority" class="form-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="assignedTo" class="form-label">Assigned To</label>
              <input
                id="assignedTo"
                type="text"
                formControlName="assignedTo"
                class="form-control"
                placeholder="User ID or email"
              >
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="dueDate" class="form-label">Due Date</label>
              <input
                id="dueDate"
                type="date"
                formControlName="dueDate"
                class="form-control"
              >
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="estimatedHours" class="form-label">Estimated Hours</label>
              <input
                id="estimatedHours"
                type="number"
                formControlName="estimatedHours"
                class="form-control"
                min="0"
                step="0.5"
                placeholder="0.0"
              >
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="storyPoints" class="form-label">Story Points</label>
              <select id="storyPoints" formControlName="storyPoints" class="form-select">
                <option value="">Select points</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="8">8</option>
                <option value="13">13</option>
                <option value="21">21</option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="epic" class="form-label">Epic</label>
              <input
                id="epic"
                type="text"
                formControlName="epic"
                class="form-control"
                placeholder="Epic name"
              >
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="sprint" class="form-label">Sprint</label>
              <input
                id="sprint"
                type="text"
                formControlName="sprint"
                class="form-control"
                placeholder="Sprint name"
              >
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="labels" class="form-label">Labels</label>
              <input
                id="labels"
                type="text"
                formControlName="labelsText"
                class="form-control"
                placeholder="Enter labels separated by commas"
              >
              <small class="form-text text-muted">Separate multiple labels with commas</small>
            </div>
          </div>
        </div>

        <!-- Checklist -->
        <div class="mb-3">
          <label class="form-label">Checklist (Optional)</label>
          <div class="checklist-builder">
            <div class="checklist-items" *ngIf="checklistItems().length > 0">
              <div 
                *ngFor="let item of checklistItems(); let i = index; trackBy: trackChecklistItem" 
                class="checklist-item">
                <div class="item-content">
                  <span class="item-number">{{ i + 1 }}.</span>
                  <span class="item-text">{{ item }}</span>
                  <button 
                    type="button" 
                    class="remove-btn" 
                    (click)="removeChecklistItem(i)"
                    title="Remove item">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="add-checklist-item">
              <div class="input-group">
                <input
                  type="text"
                  [(ngModel)]="newChecklistItem"
                  (keyup.enter)="addChecklistItem()"
                  class="form-control"
                  placeholder="Add checklist item..."
                >
                <button 
                  type="button" 
                  class="btn btn-outline-secondary"
                  (click)="addChecklistItem()"
                  [disabled]="!newChecklistItem.trim()">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <small class="form-text text-muted">Press Enter or click + to add items</small>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="activeModal.dismiss()"
          [disabled]="loading()"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          [disabled]="taskForm.invalid || loading()"
        >
          <span *ngIf="loading()" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading() ? 'Creating...' : 'Create Task' }}
        </button>
      </div>
    </form>
  `
})
export class CreateTaskModalContentComponent {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);

  projectId = input.required<number>();
  loading = signal(false);
  
  // Checklist state
  checklistItems = signal<string[]>([]);
  newChecklistItem = '';

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    priority: ['medium'],
    assignedTo: [''],
    dueDate: [''],
    estimatedHours: [''],
    storyPoints: [''],
    epic: [''],
    sprint: [''],
    labelsText: ['']
  });

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) return;

    this.loading.set(true);
    try {
      const formValue = this.taskForm.value;
      
      // Process labels from comma-separated string to array
      const labelsArray = formValue.labelsText 
        ? formValue.labelsText.split(',').map((label: string) => label.trim()).filter((label: string) => label.length > 0)
        : [];

      const taskData: CreateTaskRequest = {
        title: formValue.title.trim(),
        description: formValue.description?.trim() || undefined,
        priority: formValue.priority || 'medium',
        assignedTo: formValue.assignedTo?.trim() || undefined,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        estimatedHours: formValue.estimatedHours ? parseFloat(formValue.estimatedHours) : undefined,
        storyPoints: formValue.storyPoints ? parseInt(formValue.storyPoints) : undefined,
        epic: formValue.epic?.trim() || undefined,
        sprint: formValue.sprint?.trim() || undefined,
        labels: labelsArray.length > 0 ? labelsArray : undefined
      };

      const newTask = await this.taskService.createTask(this.projectId(), taskData).toPromise();
      this.activeModal.close(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      // TODO: Show error toast
    } finally {
      this.loading.set(false);
    }
  }

  // Checklist methods
  addChecklistItem(): void {
    const trimmedItem = this.newChecklistItem.trim();
    if (!trimmedItem) return;

    this.checklistItems.update(items => [...items, trimmedItem]);
    this.newChecklistItem = '';
  }

  removeChecklistItem(index: number): void {
    this.checklistItems.update(items => items.filter((_, i) => i !== index));
  }

  trackChecklistItem(index: number, item: string): string {
    return `${index}-${item}`;
  }
}