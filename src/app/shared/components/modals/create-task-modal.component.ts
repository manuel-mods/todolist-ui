import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskStatus, Project, User } from '../../../core/models';

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-header border-0">
      <h4 class="modal-title fw-bold">Create New Task</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>

    <div class="modal-body">
      <!-- Error State -->
      <div class="alert alert-danger" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>

      <!-- Task Form -->
      <form [formGroup]="taskForm">
        <!-- Title -->
        <div class="mb-3">
          <label for="title" class="form-label fw-medium">Title *</label>
          <input type="text" id="title" class="form-control" formControlName="title" 
                 placeholder="Enter task title" autofocus>
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
      <button type="button" class="btn btn-primary" (click)="createTask()" 
              [disabled]="taskForm.invalid || creating()">
        <span class="spinner-border spinner-border-sm me-2" *ngIf="creating()"></span>
        <i class="fas fa-plus me-1" *ngIf="!creating()"></i>
        {{ creating() ? 'Creating...' : 'Create Task' }}
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
export class CreateTaskModalComponent {
  @Input() projects: Project[] = [];
  @Input() users: User[] = [];
  @Input() defaultStatus: string = 'CREATED';
  @Input() defaultProjectId?: number;

  public activeModal = inject(NgbActiveModal);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  creating = signal(false);
  error = signal<string | null>(null);

  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      projectId: ['', Validators.required],
      status: [this.defaultStatus],
      priority: ['medium'],
      assignedTo: [''],
      dueDate: [''],
      estimatedHours: [''],
      storyPoints: [''],
      labelsString: ['']
    });
  }

  ngOnInit(): void {
    // Set default values
    this.taskForm.patchValue({
      status: this.defaultStatus,
      projectId: this.defaultProjectId || ''
    });
  }

  createTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.error.set(null);
    
    const formValue = this.taskForm.value;
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error.set('User not authenticated');
      this.creating.set(false);
      return;
    }

    const taskData = {
      title: formValue.title,
      description: formValue.description || undefined,
      projectId: parseInt(formValue.projectId),
      status: formValue.status as TaskStatus,
      priority: formValue.priority,
      assignedTo: formValue.assignedTo || undefined,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
      estimatedHours: formValue.estimatedHours ? parseFloat(formValue.estimatedHours) : undefined,
      storyPoints: formValue.storyPoints ? parseInt(formValue.storyPoints) : undefined,
      labels: formValue.labelsString ? 
        formValue.labelsString.split(',').map((label: string) => label.trim()).filter((label: string) => label) : 
        [],
      createdBy: user.id,
      createdAt: new Date()
    };

    this.taskService.createTask(taskData.projectId, taskData).subscribe({
      next: (newTask) => {
        this.creating.set(false);
        this.activeModal.close(newTask);
      },
      error: (err: any) => {
        this.error.set('Failed to create task. Please try again.');
        this.creating.set(false);
      }
    });
  }
}