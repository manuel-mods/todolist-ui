import { Component, inject, signal, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { Task, TaskStatus, Project, User } from '../../../core/models';
import { TaskHistoryComponent } from '../task-history/task-history.component';
import { UserSelectorComponent } from '../user-selector/user-selector.component';
import { StoryPointsSelectorComponent } from '../story-points-selector/story-points-selector.component';
import { TaskAttachmentsComponent } from '../task-attachments/task-attachments.component';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TaskHistoryComponent, UserSelectorComponent, StoryPointsSelectorComponent, TaskAttachmentsComponent],
  template: `
    <div class="fullscreen-modal">
      <!-- Header -->
      <div class="modal-header-fullscreen">
        <div class="d-flex align-items-center">
          <div class="task-type-badge me-3">
            <i class="fas fa-tasks"></i>
          </div>
          <div>
            <h3 class="mb-0 fw-bold text-white" *ngIf="taskSignal()">{{ taskSignal()?.title }}</h3>
            <h3 class="mb-0 fw-bold text-white" *ngIf="!taskSignal()">Nueva Tarea</h3>
            <small class="text-white-50" *ngIf="getSelectedProject()">{{ getSelectedProject()?.name }}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-link text-white" (click)="saveTask()" 
                  [disabled]="taskForm.invalid || saving()" title="Guardar (Ctrl+S)">
            <span class="spinner-border spinner-border-sm" *ngIf="saving()"></span>
            <i class="fas fa-save" *ngIf="!saving()"></i>
          </button>
          <button type="button" class="btn btn-link text-white" (click)="activeModal.dismiss()" title="Cerrar (Esc)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content-fullscreen">
        <!-- Loading State -->
        <div class="loading-overlay" *ngIf="loading()">
          <div class="text-center">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted">Cargando detalles de la tarea...</p>
          </div>
        </div>

        <!-- Error State -->
        <div class="alert alert-danger m-4" *ngIf="error()" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
        </div>

        <!-- Main Content -->
        <div class="d-flex h-100" *ngIf="!loading() && !error()">
          <!-- Left Side - Form -->
          <div class="form-section">
            <!-- Tabs Navigation -->
            <div class="tabs-nav">
              <button 
                class="tab-btn" 
                [class.active]="activeTab() === 'general'"
                (click)="setActiveTab('general')"
                type="button">
                <i class="fas fa-info-circle me-2"></i>Información General
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab() === 'attachments'"
                (click)="setActiveTab('attachments')"
                type="button">
                <i class="fas fa-paperclip me-2"></i>Archivos
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab() === 'activity'"
                (click)="setActiveTab('activity')"
                type="button">
                <i class="fas fa-history me-2"></i>Actividad
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content-area">
              <!-- General Information Tab -->
              <div class="tab-pane h-100" [class.active]="activeTab() === 'general'">
                <form [formGroup]="taskForm" class="h-100">
                  <div class="form-scroll">
                    <!-- Title -->
                    <div class="form-group">
                      <label for="title" class="form-label">Título *</label>
                      <input type="text" id="title" class="form-control form-control-lg" formControlName="title" 
                             placeholder="Ingresa el título de la tarea">
                      <div class="invalid-feedback" *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched">
                        El título es requerido
                      </div>
                    </div>

                    <!-- Description -->
                    <div class="form-group">
                      <label for="description" class="form-label">Descripción</label>
                      <textarea id="description" class="form-control" rows="6" formControlName="description" 
                                placeholder="Describe la tarea en detalle..."></textarea>
                    </div>

                    <div class="row">
                      <!-- Project -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="project" class="form-label">Proyecto *</label>
                          <select id="project" class="form-select" formControlName="projectId" (change)="onProjectChange()">
                            <option value="">Selecciona un proyecto</option>
                            <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
                          </select>
                          <div class="invalid-feedback" *ngIf="taskForm.get('projectId')?.invalid && taskForm.get('projectId')?.touched">
                            El proyecto es requerido
                          </div>
                        </div>
                      </div>

                      <!-- Status -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="status" class="form-label">Estado</label>
                          <select id="status" class="form-select" formControlName="status">
                            <option value="CREATED">🆕 Creada</option>
                            <option value="IN_PROGRESS">🔄 En Progreso</option>
                            <option value="BLOCKED">🚫 Bloqueada</option>
                            <option value="TESTING">🧪 En Pruebas</option>
                            <option value="READY_TO_FINISH">✅ Lista para Terminar</option>
                            <option value="FINISHED">✨ Terminada</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <!-- Priority -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="priority" class="form-label">Prioridad</label>
                          <select id="priority" class="form-select" formControlName="priority">
                            <option value="low">🟢 Baja</option>
                            <option value="medium">🟡 Media</option>
                            <option value="high">🔴 Alta</option>
                          </select>
                        </div>
                      </div>

                      <!-- Assigned To -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label class="form-label">Asignado a</label>
                          <app-user-selector
                            [users]="users"
                            [selectedUserId]="taskForm.get('assignedTo')?.value"
                            [multiSelect]="false"
                            [allowUnassign]="true"
                            [disabled]="loading() || saving()"
                            placeholder="Seleccionar asignado..."
                            (userSelected)="onUserAssigned($event)">
                          </app-user-selector>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <!-- Due Date -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="dueDate" class="form-label">Fecha Límite</label>
                          <input type="date" id="dueDate" class="form-control" formControlName="dueDate">
                        </div>
                      </div>

                      <!-- Estimated Hours -->
                      <div class="col-lg-6">
                        <div class="form-group">
                          <label for="estimatedHours" class="form-label">Horas Estimadas</label>
                          <input type="number" id="estimatedHours" class="form-control" formControlName="estimatedHours" 
                                 min="0" step="0.5" placeholder="0">
                        </div>
                      </div>
                    </div>

                    <!-- Labels -->
                    <div class="form-group">
                      <label for="labels" class="form-label">Etiquetas</label>
                      <input type="text" id="labels" class="form-control" formControlName="labelsString" 
                             placeholder="frontend, urgent, bug (separadas por comas)">
                      <small class="form-text text-muted">Separa múltiples etiquetas con comas</small>
                    </div>

                    <!-- Story Points -->
                    <div class="form-group">
                      <app-story-points-selector
                        [selectedPoints]="getStoryPointsValue()"
                        [disabled]="loading() || saving()"
                        [showGuide]="true"
                        [showLabels]="true"
                        (pointsSelected)="onStoryPointsSelected($event)">
                      </app-story-points-selector>
                    </div>

                    <!-- Parent Task -->
                    <div class="form-group">
                      <label for="parentTask" class="form-label">Tarea Padre</label>
                      <select id="parentTask" class="form-select" formControlName="parentTaskId">
                        <option value="">Sin tarea padre</option>
                        <option *ngFor="let task of getAvailableParentTasks()" [value]="task.id">
                          {{ task.title }}
                        </option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Attachments Tab -->
              <div class="tab-pane h-100" [class.active]="activeTab() === 'attachments'">
                <app-task-attachments
                  [taskId]="taskSignal()?.id || 0"
                  [readonly]="false"
                  (attachmentsChanged)="onAttachmentsChanged($event)">
                </app-task-attachments>
              </div>

              <!-- Activity Tab -->
              <div class="tab-pane h-100" [class.active]="activeTab() === 'activity'">
                <app-task-history
                  [taskId]="taskSignal()?.id || 0"
                  [allowComments]="true">
                </app-task-history>
              </div>
            </div>
          </div>

          <!-- Right Side - Quick Actions & Info -->
          <div class="sidebar-section">
            <div class="sidebar-content">
              <h6 class="sidebar-title">Acciones Rápidas</h6>
              
              <div class="action-buttons">
                <button type="button" class="btn btn-success btn-sm w-100 mb-2" (click)="saveTask()" 
                        [disabled]="taskForm.invalid || saving()">
                  <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
                  <i class="fas fa-save me-2" *ngIf="!saving()"></i>
                  {{ saving() ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
                
                <button type="button" class="btn btn-outline-danger btn-sm w-100" (click)="deleteTask()" 
                        *ngIf="taskSignal() && !loading()">
                  <i class="fas fa-trash me-2"></i>Eliminar Tarea
                </button>
              </div>

              <hr>

              <h6 class="sidebar-title">Información</h6>
              <div class="info-items" *ngIf="taskSignal()">
                <div class="info-item">
                  <span class="info-label">ID:</span>
                  <span class="info-value">#{{ taskSignal()?.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Creada:</span>
                  <span class="info-value">{{ taskSignal()?.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Actualizada:</span>
                  <span class="info-value">{{ taskSignal()?.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="keyboard-shortcuts mt-4">
                <h6 class="sidebar-title">Atajos de Teclado</h6>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>S</kbd> Guardar
                </div>
                <div class="shortcut-item">
                  <kbd>Esc</kbd> Cerrar
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 1050;
      display: flex;
      flex-direction: column;
    }
    
    .modal-header-fullscreen {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10;
    }
    
    .task-type-badge {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .modal-content-fullscreen {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    
    .form-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    
    .sidebar-section {
      width: 300px;
      background: #f8fafc;
      border-left: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }
    
    .sidebar-content {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
    }
    
    .sidebar-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .tabs-nav {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 2rem;
    }
    
    .tab-btn {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      
      &:hover {
        color: #374151;
        background: rgba(102, 126, 234, 0.05);
      }
      
      &.active {
        color: #667eea;
        background: white;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #667eea;
        }
      }
    }
    
    .tab-content-area {
      flex: 1;
      overflow: hidden;
    }
    
    .tab-pane {
      display: none;
      padding: 2rem;
      overflow-y: auto;
      
      &.active {
        display: block;
      }
    }
    
    .form-scroll {
      max-width: 800px;
    }
    
    .form-group {
      margin-bottom: 2rem;
    }
    
    .form-label {
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: block;
      font-size: 0.875rem;
    }
    
    .form-control, .form-select {
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      
      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        outline: none;
      }
    }
    
    .form-control-lg {
      padding: 1rem 1.25rem;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    textarea.form-control {
      resize: vertical;
      min-height: 120px;
    }
    
    .action-buttons {
      margin-bottom: 1.5rem;
    }
    
    .info-items {
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
        
        &:last-child {
          border-bottom: none;
        }
      }
      
      .info-label {
        color: #6b7280;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .info-value {
        color: #374151;
        font-weight: 500;
        font-size: 0.875rem;
      }
    }
    
    .keyboard-shortcuts {
      .shortcut-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
        
        kbd {
          background: #374151;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          margin: 0 0.25rem;
        }
      }
    }
    
    .btn-link {
      text-decoration: none;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255,255,255,0.1);
      }
    }
    
    // Responsive design
    @media (max-width: 768px) {
      .sidebar-section {
        width: 250px;
      }
      
      .tab-content-area .tab-pane {
        padding: 1rem;
      }
      
      .modal-header-fullscreen {
        padding: 1rem;
      }
      
      .tabs-nav {
        padding: 0 1rem;
      }
      
      .tab-btn {
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
      }
    }
    
    @media (max-width: 576px) {
      .form-section {
        flex-direction: column;
      }
      
      .sidebar-section {
        width: 100%;
        max-height: 200px;
        border-left: none;
        border-top: 1px solid #e5e7eb;
      }
      
      .sidebar-content {
        padding: 1rem;
      }
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
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  taskSignal = signal<Task | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'general' | 'attachments' | 'activity'>('general');

  taskForm: FormGroup;
  availableParentTasks = signal<Task[]>([]);

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
      labelsString: [''],
      parentTaskId: ['']
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
          this.error.set('Error al cargar los detalles de la tarea');
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('No se proporcionó ID de tarea u objeto de tarea');
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
      labelsString: task.labels?.join(', ') || '',
      parentTaskId: (task as any).parentTaskId || ''
    });
    
    // Load available parent tasks for this project
    this.loadAvailableParentTasks(task.projectId, task.id);
  }

  saveTask(): void {
    if (this.taskForm.invalid) return;

    const currentTask = this.taskSignal();
    const currentTaskId = this.taskId || currentTask?.id;
    
    if (!currentTaskId) {
      this.error.set('No hay ID de tarea disponible');
      return;
    }

    this.saving.set(true);
    
    const formValue = this.taskForm.value;
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error.set('Usuario no autenticado');
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
        [],
      parentTaskId: formValue.parentTaskId ? parseInt(formValue.parentTaskId) : undefined
    };

    this.taskService.updateTask(currentTaskId, taskData).subscribe({
      next: (updatedTask) => {
        this.saving.set(false);
        this.activeModal.close(updatedTask);
      },
      error: (err: any) => {
        this.error.set('Error al actualizar la tarea');
        this.saving.set(false);
      }
    });
  }

  deleteTask(): void {
    const currentTask = this.taskSignal();
    const currentTaskId = this.taskId || currentTask?.id;
    
    if (!currentTaskId) {
      this.error.set('No hay ID de tarea disponible');
      return;
    }

    const taskTitle = currentTask?.title || 'esta tarea';
    
    this.confirmService.confirmWithAction(
      {
        title: 'Eliminar Tarea',
        message: `¿Estás seguro de que quieres eliminar "${taskTitle}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      },
      () => this.taskService.deleteTask(currentTaskId)
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          this.activeModal.close({ deleted: true });
        }
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.error.set('Error al eliminar la tarea. Inténtalo de nuevo.');
      }
    });
  }

  private loadAvailableParentTasks(projectId: number, currentTaskId?: number): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // In a real implementation, we would fetch tasks from the project
    // For now, we'll use a simple approach with the task service
    this.taskService.getProjectTasks(projectId).subscribe({
      next: (tasks) => {
        // Filter out the current task and any of its descendants to prevent circular references
        const availableTasks = tasks.filter(task => {
          if (currentTaskId && task.id === currentTaskId) return false;
          // TODO: Add logic to exclude descendants of current task
          return true;
        });
        this.availableParentTasks.set(availableTasks);
      },
      error: (err) => {
        console.error('Error loading parent tasks:', err);
        this.availableParentTasks.set([]);
      }
    });
  }

  getAvailableParentTasks(): Task[] {
    return this.availableParentTasks();
  }

  onProjectChange(): void {
    const projectId = this.taskForm.get('projectId')?.value;
    if (projectId) {
      const currentTask = this.taskSignal();
      this.loadAvailableParentTasks(parseInt(projectId), currentTask?.id);
    } else {
      this.availableParentTasks.set([]);
    }
  }

  setActiveTab(tab: 'general' | 'attachments' | 'activity'): void {
    this.activeTab.set(tab);
  }

  onAttachmentsChanged(attachments: any[]): void {
    // Update task attachments list for any future integrations
    console.log('Attachments changed:', attachments);
  }


  onUserAssigned(user: User | null): void {
    // Update the form control with the selected user ID
    this.taskForm.patchValue({
      assignedTo: user?.id || ''
    });

    // Optionally update the task signal immediately for UI consistency
    const currentTask = this.taskSignal();
    if (currentTask) {
      this.taskSignal.set({
        ...currentTask,
        assignedTo: user?.id
      });
    }
  }

  onStoryPointsSelected(points: number | null): void {
    // Update the form control with the selected story points
    this.taskForm.patchValue({
      storyPoints: points || ''
    });

    // Optionally update the task signal immediately for UI consistency
    const currentTask = this.taskSignal();
    if (currentTask) {
      this.taskSignal.set({
        ...currentTask,
        storyPoints: points || undefined
      });
    }
  }

  getStoryPointsValue(): number | null {
    const formValue = this.taskForm.get('storyPoints')?.value;
    if (!formValue || formValue === '') return null;
    return parseInt(formValue);
  }

  getProjectIdValue(): number | null {
    const projectId = this.taskForm.get('projectId')?.value;
    return projectId ? parseInt(projectId) : null;
  }

  getSelectedProject(): Project | undefined {
    const projectId = this.getProjectIdValue();
    return this.projects.find(p => p.id === projectId);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      if (!this.taskForm.invalid && !this.saving()) {
        this.saveTask();
      }
    }
    
    // Escape to close
    if (event.key === 'Escape') {
      event.preventDefault();
      this.activeModal.dismiss();
    }
  }

}