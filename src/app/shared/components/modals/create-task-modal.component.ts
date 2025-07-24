import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskStatus, Project, User } from '../../../core/models';
import { UserSelectorComponent } from '../user-selector/user-selector.component';
import { StoryPointsSelectorComponent } from '../story-points-selector/story-points-selector.component';

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserSelectorComponent, StoryPointsSelectorComponent],
  template: `
    <div class="fullscreen-modal-container">
      <!-- Header -->
      <div class="fullscreen-modal-header">
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon">
              <i class="fas fa-plus-circle"></i>
            </div>
            <div class="header-text">
              <h1 class="header-title">
                {{ defaultProjectId ? 'Crear Nueva Tarea en ' + getProjectName(defaultProjectId) : 'Crear Nueva Tarea' }}
              </h1>
              <p class="header-subtitle">Complete los detalles para crear una nueva tarea</p>
            </div>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-ghost" (click)="activeModal.dismiss()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" (click)="createTask()" 
                    [disabled]="taskForm.invalid || creating()">
              <span class="spinner-border spinner-border-sm me-2" *ngIf="creating()"></span>
              <i class="fas fa-save me-1" *ngIf="!creating()"></i>
              {{ creating() ? 'Creando...' : 'Crear Tarea' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="fullscreen-modal-content">
        <div class="container-fluid">
          <div class="row">
            <!-- Main Form -->
            <div class="col-lg-8">
              <div class="form-section">
                <!-- Error State -->
                <div class="alert alert-danger" *ngIf="error()" role="alert">
                  <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
                </div>

                <!-- Task Form -->
                <form [formGroup]="taskForm">
                  <!-- Title -->
                  <div class="field-group">
                    <label for="title" class="field-label">Título *</label>
                    <input type="text" id="title" class="field-input" formControlName="title" 
                           placeholder="Ingrese el título de la tarea" autofocus>
                    <div class="field-error" *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched">
                      El título es requerido
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="field-group">
                    <label for="description" class="field-label">Descripción</label>
                    <textarea id="description" class="field-input field-textarea" rows="6" formControlName="description" 
                              placeholder="Ingrese la descripción de la tarea..."></textarea>
                  </div>

                  <!-- Project -->
                  <div class="field-group" *ngIf="!defaultProjectId">
                    <label for="project" class="field-label">Proyecto *</label>
                    <select id="project" class="field-input" formControlName="projectId">
                      <option value="">Seleccionar proyecto</option>
                      <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
                    </select>
                    <div class="field-error" *ngIf="taskForm.get('projectId')?.invalid && taskForm.get('projectId')?.touched">
                      El proyecto es requerido
                    </div>
                  </div>
                  
                  <!-- Project Display (when pre-selected) -->
                  <div class="field-group" *ngIf="defaultProjectId">
                    <label class="field-label">Proyecto</label>
                    <div class="field-display">
                      <i class="fas fa-folder me-2 text-primary"></i>
                      {{ getProjectName(defaultProjectId) }}
                    </div>
                  </div>

                  <!-- Labels -->
                  <div class="field-group">
                    <label for="labels" class="field-label">Etiquetas</label>
                    <input type="text" id="labels" class="field-input" formControlName="labelsString" 
                           placeholder="Ingrese etiquetas separadas por comas">
                    <small class="field-help">Separe múltiples etiquetas con comas</small>
                  </div>
                </form>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="col-lg-4">
              <div class="sidebar-section">
                <h3 class="sidebar-title">Configuración</h3>
                
                <form [formGroup]="taskForm">
                  <!-- Status -->
                  <div class="field-group">
                    <label for="status" class="field-label">Estado</label>
                    <select id="status" class="field-input" formControlName="status">
                      <option value="CREATED">Creada</option>
                      <option value="IN_PROGRESS">En Progreso</option>
                      <option value="BLOCKED">Bloqueada</option>
                      <option value="TESTING">En Pruebas</option>
                      <option value="READY_TO_FINISH">Lista para Terminar</option>
                      <option value="FINISHED">Terminada</option>
                    </select>
                  </div>

                  <!-- Priority -->
                  <div class="field-group">
                    <label for="priority" class="field-label">Prioridad</label>
                    <select id="priority" class="field-input" formControlName="priority">
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>

                  <!-- Assigned To -->
                  <div class="field-group">
                    <label class="field-label">Asignado a</label>
                    <app-user-selector
                      [users]="users"
                      [selectedUserId]="taskForm.get('assignedTo')?.value"
                      [multiSelect]="false"
                      [allowUnassign]="true"
                      [disabled]="creating()"
                      placeholder="Seleccionar responsable..."
                      (userSelected)="onUserAssigned($event)">
                    </app-user-selector>
                  </div>

                  <!-- Due Date -->
                  <div class="field-group">
                    <label for="dueDate" class="field-label">Fecha límite</label>
                    <input type="date" id="dueDate" class="field-input" formControlName="dueDate">
                  </div>

                  <!-- Estimated Hours -->
                  <div class="field-group">
                    <label for="estimatedHours" class="field-label">Horas estimadas</label>
                    <input type="number" id="estimatedHours" class="field-input" formControlName="estimatedHours" 
                           min="0" step="0.5" placeholder="0">
                  </div>

                  <!-- Story Points -->
                  <div class="field-group">
                    <app-story-points-selector
                      [selectedPoints]="getStoryPointsValue()"
                      [disabled]="creating()"
                      [showGuide]="false"
                      [showLabels]="true"
                      (pointsSelected)="onStoryPointsSelected($event)">
                    </app-story-points-selector>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-modal-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #fafafa;
      z-index: 1055;
      display: flex;
      flex-direction: column;
    }

    .fullscreen-modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .header-text {
      .header-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0.25rem 0 0 0;
        opacity: 0.9;
        font-size: 0.95rem;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-ghost {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }

    .fullscreen-modal-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .container-fluid {
      max-width: 1200px;
      margin: 0 auto;
    }

    .form-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .sidebar-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      height: fit-content;
      position: sticky;
      top: 0;
    }

    .sidebar-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f3f4f6;
    }

    .field-group {
      margin-bottom: 1.5rem;
    }

    .field-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .field-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: white;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &.field-textarea {
        resize: vertical;
        min-height: 120px;
      }
    }

    .field-display {
      padding: 0.75rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .field-error {
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .field-help {
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    @media (max-width: 992px) {
      .fullscreen-modal-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .fullscreen-modal-content {
        padding: 1rem;
      }

      .form-section,
      .sidebar-section {
        padding: 1.5rem;
      }

      .col-lg-4 {
        margin-top: 1rem;
      }
    }

    @media (max-width: 576px) {
      .header-text .header-title {
        font-size: 1.25rem;
      }

      .form-section,
      .sidebar-section {
        padding: 1rem;
      }
    }
  `]
})
export class CreateTaskModalComponent implements OnInit {
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

  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  onUserAssigned(user: User | null): void {
    // Update the form control with the selected user ID
    this.taskForm.patchValue({
      assignedTo: user?.id || ''
    });
  }

  onStoryPointsSelected(points: number | null): void {
    // Update the form control with the selected story points
    this.taskForm.patchValue({
      storyPoints: points || ''
    });
  }

  getStoryPointsValue(): number | null {
    const formValue = this.taskForm.get('storyPoints')?.value;
    if (!formValue || formValue === '') return null;
    return parseInt(formValue);
  }

  getProjectIdValue(): number | null {
    const projectId = this.defaultProjectId || this.taskForm.get('projectId')?.value;
    return projectId ? parseInt(projectId) : null;
  }

}