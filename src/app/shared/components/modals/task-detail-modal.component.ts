import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, Project, User } from '../../../core/models';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-header border-0">
      <h4 class="modal-title fw-bold">Task Details</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>

    <div class="modal-body">
      <!-- Loading State -->
      <div class="text-center py-4" *ngIf="loading()">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Loading task details...</p>
      </div>

      <!-- Error State -->
      <div class="alert alert-danger" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>

      <!-- Task Form -->
      <form [formGroup]="taskForm" *ngIf="!loading() && !error()">
        <!-- Title -->
        <div class="mb-3">
          <label for="title" class="form-label fw-medium">Title *</label>
          <input type="text" id="title" class="form-control" formControlName="title" 
                 placeholder="Enter task title">
          <div class="invalid-feedback" *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched">
            Title is required
          </div>
        </div>

        <!-- Description -->
        <div class="mb-3">
          <label for="description" class="form-label fw-medium">Description</label>
          <textarea id="description" class="form-control" rows="4" formControlName="description" 
                    placeholder="Enter task description"></textarea>
        </div>

        <div class="row">
          <!-- Project -->
          <div class="col-md-6 mb-3">
            <label for="project" class="form-label fw-medium">Project *</label>
            <select id="project" class="form-select" formControlName="projectId">
              <option value="">Select a project</option>
              <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
            </select>
            <div class="invalid-feedback" *ngIf="taskForm.get('projectId')?.invalid && taskForm.get('projectId')?.touched">
              Project is required
            </div>
          </div>

          <!-- Status -->
          <div class="col-md-6 mb-3">
            <label for="status" class="form-label fw-medium">Status</label>
            <select id="status" class="form-select" formControlName="status">
              <option value="CREATED">Created</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="TESTING">Testing</option>
              <option value="READY_TO_FINISH">Ready to Finish</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>
        </div>

        <div class="row">
          <!-- Priority -->
          <div class="col-md-6 mb-3">
            <label for="priority" class="form-label fw-medium">Priority</label>
            <select id="priority" class="form-select" formControlName="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!-- Assigned To -->
          <div class="col-md-6 mb-3">
            <label for="assignedTo" class="form-label fw-medium">Assigned To</label>
            <select id="assignedTo" class="form-select" formControlName="assignedTo">
              <option value="">Unassigned</option>
              <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <!-- Due Date -->
          <div class="col-md-6 mb-3">
            <label for="dueDate" class="form-label fw-medium">Due Date</label>
            <input type="date" id="dueDate" class="form-control" formControlName="dueDate">
          </div>

          <!-- Estimated Hours -->
          <div class="col-md-6 mb-3">
            <label for="estimatedHours" class="form-label fw-medium">Estimated Hours</label>
            <input type="number" id="estimatedHours" class="form-control" formControlName="estimatedHours" 
                   min="0" step="0.5" placeholder="0">
          </div>
        </div>

        <!-- Labels -->
        <div class="mb-3">
          <label for="labels" class="form-label fw-medium">Labels</label>
          <input type="text" id="labels" class="form-control" formControlName="labelsString" 
                 placeholder="Enter labels separated by commas">
          <small class="form-text text-muted">Separate multiple labels with commas</small>
        </div>

        <!-- Story Points -->
        <div class="mb-3">
          <label for="storyPoints" class="form-label fw-medium">Story Points</label>
          <select id="storyPoints" class="form-select" formControlName="storyPoints">
            <option value="">Not estimated</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="8">8</option>
            <option value="13">13</option>
            <option value="21">21</option>
          </select>
        </div>
      </form>
    </div>

    <div class="modal-footer border-0">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">
        Cancel
      </button>
      <button type="button" class="btn btn-danger me-2" (click)="deleteTask()" 
              *ngIf="taskSignal() && !loading()">
        <i class="fas fa-trash me-1"></i>Delete
      </button>
      <button type="button" class="btn btn-primary" (click)="saveTask()" 
              [disabled]="taskForm.invalid || saving()">
        <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
        <i class="fas fa-save me-1" *ngIf="!saving()"></i>
        {{ saving() ? 'Saving...' : 'Save Task' }}
      </button>
    </div>
  `,
  styles: [`
    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-close {
      filter: invert(1);
    }
    
    .form-label {
      color: #374151;
      margin-bottom: 0.5rem;
    }
    
    .form-control, .form-select {
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
    
    .form-control:focus, .form-select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  `]
})
export class TaskDetailModalComponent implements OnInit {
  @Input() taskId?: number;
  @Input() task?: Task; // Accept task object directly
  @Input() projects: Project[] = [];
  @Input() users: User[] = [];

  public activeModal = inject(NgbActiveModal);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  taskSignal = signal<Task | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      projectId: ['', Validators.required],
      status: ['CREATED'],
      priority: ['medium'],
      assignedTo: [''],
      dueDate: [''],
      estimatedHours: [''],
      storyPoints: [''],
      labelsString: ['']
    });
  }

  ngOnInit(): void {
    this.loadTask();
  }

  private loadTask(): void {
    // If task object is provided directly, use it
    if (this.task) {
      this.taskSignal.set(this.task);
      this.populateForm(this.task);
      this.loading.set(false);
      return;
    }
    
    // Otherwise, fetch task by ID
    if (this.taskId) {
      this.taskService.getTask(this.taskId).subscribe({
        next: (task) => {
          this.taskSignal.set(task);
          this.populateForm(task);
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set('Failed to load task details');
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('No task ID or task object provided');
      this.loading.set(false);
    }
  }

  private populateForm(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId,
      status: task.status,
      priority: task.priority || 'medium',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours || '',
      storyPoints: task.storyPoints || '',
      labelsString: task.labels?.join(', ') || ''
    });
  }

  saveTask(): void {
    if (this.taskForm.invalid) return;

    const currentTask = this.taskSignal();
    const currentTaskId = this.taskId || currentTask?.id;
    
    if (!currentTaskId) {
      this.error.set('No task ID available');
      return;
    }

    this.saving.set(true);
    
    const formValue = this.taskForm.value;
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error.set('User not authenticated');
      this.saving.set(false);
      return;
    }

    const taskData = {
      title: formValue.title,
      description: formValue.description,
      projectId: parseInt(formValue.projectId),
      status: formValue.status as TaskStatus,
      priority: formValue.priority,
      assignedTo: formValue.assignedTo || undefined,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
      estimatedHours: formValue.estimatedHours ? parseFloat(formValue.estimatedHours) : undefined,
      storyPoints: formValue.storyPoints ? parseInt(formValue.storyPoints) : undefined,
      labels: formValue.labelsString ? 
        formValue.labelsString.split(',').map((label: string) => label.trim()).filter((label: string) => label) : 
        []
    };

    this.taskService.updateTask(currentTaskId, taskData).subscribe({
      next: (updatedTask) => {
        this.saving.set(false);
        this.activeModal.close(updatedTask);
      },
      error: (err: any) => {
        this.error.set('Failed to update task');
        this.saving.set(false);
      }
    });
  }

  deleteTask(): void {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    const currentTask = this.taskSignal();
    const currentTaskId = this.taskId || currentTask?.id;
    
    if (!currentTaskId) {
      this.error.set('No task ID available');
      return;
    }

    this.saving.set(true);
    
    this.taskService.deleteTask(currentTaskId).subscribe({
      next: () => {
        this.saving.set(false);
        this.activeModal.close({ deleted: true });
      },
      error: (err: any) => {
        this.error.set('Failed to delete task');
        this.saving.set(false);
      }
    });
  }
}