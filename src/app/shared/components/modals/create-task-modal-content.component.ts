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

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    description: ['']
  });

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) return;

    this.loading.set(true);
    try {
      const taskData: CreateTaskRequest = {
        title: this.taskForm.get('title')?.value.trim(),
        description: this.taskForm.get('description')?.value?.trim() || undefined
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
}