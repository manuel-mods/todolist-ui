import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskComment, User } from '../../../core/models';

export interface TaskHistoryItem {
  id: number;
  taskId: number;
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change' | 'due_date_change' | 'description_change';
  content?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
  user: User;
}

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="task-history">
      <!-- Add Comment Section -->
      <div class="add-comment-section mb-4" *ngIf="allowComments">
        <form [formGroup]="commentForm" (ngSubmit)="addComment()">
          <div class="d-flex gap-3">
            <div class="user-avatar">
              <div class="avatar-circle">
                {{ getCurrentUserInitials() }}
              </div>
            </div>
            <div class="flex-grow-1">
              <textarea 
                class="form-control" 
                formControlName="comment"
                placeholder="Agregar un comentario..."
                rows="3"
                [class.is-invalid]="commentForm.get('comment')?.invalid && commentForm.get('comment')?.touched">
              </textarea>
              <div class="invalid-feedback" *ngIf="commentForm.get('comment')?.invalid && commentForm.get('comment')?.touched">
                El comentario no puede estar vacío
              </div>
              <div class="d-flex justify-content-end mt-2">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-sm"
                  [disabled]="commentForm.invalid || adding()">
                  <span class="spinner-border spinner-border-sm me-1" *ngIf="adding()"></span>
                  <i class="fas fa-comment me-1" *ngIf="!adding()"></i>
                  {{ adding() ? 'Agregando...' : 'Agregar Comentario' }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- History Timeline -->
      <div class="history-timeline">
        <div class="timeline-item" *ngFor="let item of historyItems(); trackBy: trackByHistoryId">
          <div class="timeline-marker" [ngClass]="getTimelineMarkerClass(item.type)">
            <i [class]="getTimelineIcon(item.type)"></i>
          </div>
          
          <div class="timeline-content">
            <div class="timeline-header">
              <div class="d-flex align-items-center gap-2">
                <div class="user-avatar-small">
                  {{ getUserInitials(item.user) }}
                </div>
                <div class="timeline-meta">
                  <span class="user-name">{{ item.user.name }}</span>
                  <span class="action-description">{{ getActionDescription(item) }}</span>
                </div>
              </div>
              <div class="timeline-timestamp">
                {{ formatTimestamp(item.createdAt) }}
              </div>
            </div>

            <!-- Comment Content -->
            <div class="timeline-body" *ngIf="item.type === 'comment' && item.content">
              <div class="comment-content" *ngIf="!isEditingComment(item.id)">
                {{ item.content }}
              </div>
              
              <!-- Edit Comment Form -->
              <form 
                *ngIf="isEditingComment(item.id)" 
                [formGroup]="editCommentForm" 
                (ngSubmit)="saveEditComment(item)">
                <textarea 
                  class="form-control mb-2" 
                  formControlName="editText"
                  rows="3">
                </textarea>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="editCommentForm.invalid">
                    <i class="fas fa-save me-1"></i>Guardar
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="cancelEditComment()">
                    Cancelar
                  </button>
                </div>
              </form>

              <!-- Comment Actions -->
              <div class="comment-actions mt-2" *ngIf="canEditComment(item) && !isEditingComment(item.id)">
                <button 
                  type="button" 
                  class="btn btn-link btn-sm p-0 me-2"
                  (click)="startEditComment(item)">
                  <i class="fas fa-edit me-1"></i>Editar
                </button>
                <button 
                  type="button" 
                  class="btn btn-link btn-sm p-0 text-danger"
                  (click)="deleteComment(item)">
                  <i class="fas fa-trash me-1"></i>Eliminar
                </button>
              </div>
            </div>

            <!-- Change Content -->
            <div class="timeline-body" *ngIf="item.type !== 'comment'">
              <div class="change-content">
                <span class="change-from" *ngIf="item.oldValue">{{ item.oldValue }}</span>
                <i class="fas fa-arrow-right mx-2" *ngIf="item.oldValue && item.newValue"></i>
                <span class="change-to" *ngIf="item.newValue">{{ item.newValue }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state text-center py-4" *ngIf="historyItems().length === 0">
          <i class="fas fa-history fa-2x text-muted mb-2"></i>
          <p class="text-muted mb-0">Aún no hay actividad</p>
          <small class="text-muted">Los comentarios y cambios aparecerán aquí</small>
        </div>
      </div>

      <!-- Loading State -->
      <div class="text-center py-4" *ngIf="loading()">
        <div class="spinner-border text-primary mb-2" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted mb-0">Cargando historial...</p>
      </div>

      <!-- Error State -->
      <div class="alert alert-danger" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>
    </div>
  `,
  styles: [`
    .task-history {
      max-height: 500px;
      overflow-y: auto;
    }

    .add-comment-section {
      border-bottom: 1px solid var(--gray-200);
      padding-bottom: 1rem;
    }

    .user-avatar {
      .avatar-circle {
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
      }
    }

    .user-avatar-small {
      width: 28px;
      height: 28px;
      background: var(--gray-100);
      color: var(--gray-700);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .history-timeline {
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: 14px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--gray-200);
      }
    }

    .timeline-item {
      position: relative;
      padding-left: 3rem;
      padding-bottom: 1.5rem;

      &:last-child {
        padding-bottom: 0;
      }
    }

    .timeline-marker {
      position: absolute;
      left: 0;
      top: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      background: white;
      border: 2px solid var(--gray-300);
      z-index: 1;

      &.marker-comment {
        border-color: var(--primary-500);
        background: var(--primary-50);
        color: var(--primary-600);
      }

      &.marker-status {
        border-color: var(--success-500);
        background: var(--success-50);
        color: var(--success-600);
      }

      &.marker-assignment {
        border-color: var(--warning-500);
        background: var(--warning-50);
        color: var(--warning-600);
      }

      &.marker-change {
        border-color: var(--gray-400);
        background: var(--gray-50);
        color: var(--gray-600);
      }
    }

    .timeline-content {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-xs);
    }

    .timeline-header {
      display: flex;
      justify-content: between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.75rem;

      .timeline-meta {
        flex: 1;
        
        .user-name {
          font-weight: 600;
          color: var(--gray-900);
          margin-right: 0.5rem;
        }

        .action-description {
          color: var(--gray-600);
          font-size: 0.875rem;
        }
      }

      .timeline-timestamp {
        font-size: 0.75rem;
        color: var(--gray-500);
        white-space: nowrap;
      }
    }

    .timeline-body {
      .comment-content {
        color: var(--gray-800);
        line-height: 1.5;
        white-space: pre-wrap;
      }

      .change-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;

        .change-from {
          background: var(--error-50);
          color: var(--error-700);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          text-decoration: line-through;
        }

        .change-to {
          background: var(--success-50);
          color: var(--success-700);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .fa-arrow-right {
          color: var(--gray-400);
        }
      }
    }

    .empty-state {
      padding: 2rem 1rem;
      
      i {
        opacity: 0.5;
      }
    }

    .comment-actions {
      .btn-link {
        color: var(--gray-500);
        text-decoration: none;
        font-size: 0.75rem;
        
        &:hover {
          color: var(--primary-600);
          text-decoration: none;
        }

        &.text-danger:hover {
          color: var(--error-600);
        }
      }
    }

    @media (max-width: 768px) {
      .timeline-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;

        .timeline-timestamp {
          align-self: flex-end;
        }
      }
    }
  `]
})
export class TaskHistoryComponent implements OnInit {
  @Input() taskId!: number;
  @Input() allowComments: boolean = true;
  @Input() initialHistory: TaskHistoryItem[] = [];

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  historyItems = signal<TaskHistoryItem[]>([]);
  loading = signal(false);
  adding = signal(false);
  error = signal<string | null>(null);
  editingCommentId = signal<number | null>(null);

  commentForm: FormGroup = this.fb.group({
    comment: ['', [Validators.required, Validators.minLength(1)]]
  });

  editCommentForm: FormGroup = this.fb.group({
    editText: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    if (this.initialHistory.length > 0) {
      this.historyItems.set(this.initialHistory);
    } else {
      this.loadHistory();
    }
  }

  private loadHistory(): void {
    if (!this.taskId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Load real task comments from backend
    this.taskService.getTaskComments(this.taskId).subscribe({
      next: (comments) => {
        // Transform TaskComment to TaskHistoryItem
        const historyItems: TaskHistoryItem[] = comments.map(comment => ({
          id: comment.id,
          taskId: comment.taskId,
          type: this.mapChangeTypeToHistoryType(comment.changeType),
          content: comment.comment || comment.newValue,
          oldValue: comment.oldValue,
          newValue: comment.newValue,
          createdAt: new Date(comment.createdAt),
          user: comment.user || { 
            id: comment.changedBy, 
            email: comment.changedBy, 
            name: comment.changedBy 
          }
        }));

        // Sort by creation date (newest first)
        historyItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        this.historyItems.set(historyItems);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading task history:', err);
        this.error.set('Error al cargar el historial de la tarea');
        this.loading.set(false);
      }
    });
  }

  private mapChangeTypeToHistoryType(changeType: string): TaskHistoryItem['type'] {
    switch (changeType.toUpperCase()) {
      case 'COMMENT': return 'comment';
      case 'STATUS_CHANGE': return 'status_change';
      case 'ASSIGNMENT': return 'assignment';
      case 'PRIORITY_CHANGE': return 'priority_change';
      case 'DUE_DATE_CHANGE': return 'due_date_change';
      case 'DESCRIPTION_CHANGE': return 'description_change';
      default: return 'comment';
    }
  }

  addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error.set('Debes estar autenticado para agregar comentarios');
      return;
    }

    this.adding.set(true);
    this.error.set(null);

    const commentText = this.commentForm.value.comment;

    // Call real backend to add comment
    this.taskService.addComment(this.taskId, { comment: commentText, userId: user.id }).subscribe({
      next: (commentResponse) => {
        // Create history item from response
        const newComment: TaskHistoryItem = {
          id: commentResponse.id,
          taskId: this.taskId,
          type: 'comment' as const,
          content: commentText,
          createdAt: new Date(commentResponse.createdAt),
          user: commentResponse.user || user
        };

        this.historyItems.update(items => [newComment, ...items]);
        this.commentForm.reset();
        this.adding.set(false);
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.error.set('Error al agregar el comentario');
        this.adding.set(false);
      }
    });
  }

  trackByHistoryId(index: number, item: TaskHistoryItem): number {
    return item.id;
  }

  getCurrentUserInitials(): string {
    const user = this.authService.getCurrentUser();
    return this.getUserInitials(user);
  }

  getUserInitials(user: User | null): string {
    if (!user || !user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getTimelineMarkerClass(type: string): string {
    switch (type) {
      case 'comment': return 'marker-comment';
      case 'status_change': return 'marker-status';
      case 'assignment': return 'marker-assignment';
      default: return 'marker-change';
    }
  }

  getTimelineIcon(type: string): string {
    switch (type) {
      case 'comment': return 'fas fa-comment';
      case 'status_change': return 'fas fa-exchange-alt';
      case 'assignment': return 'fas fa-user';
      case 'priority_change': return 'fas fa-exclamation';
      case 'due_date_change': return 'fas fa-calendar';
      case 'description_change': return 'fas fa-edit';
      default: return 'fas fa-circle';
    }
  }

  getActionDescription(item: TaskHistoryItem): string {
    switch (item.type) {
      case 'comment': return 'comentó';
      case 'status_change': return 'cambió el estado';
      case 'assignment': return 'asignó la tarea';
      case 'priority_change': return 'cambió la prioridad';
      case 'due_date_change': return 'actualizó la fecha límite';
      case 'description_change': return 'actualizó la descripción';
      default: return 'realizó un cambio';
    }
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'ahora mismo';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    
    return new Date(date).toLocaleDateString('es-ES');
  }

  isEditingComment(commentId: number): boolean {
    return this.editingCommentId() === commentId;
  }

  canEditComment(item: TaskHistoryItem): boolean {
    const currentUser = this.authService.getCurrentUser();
    return item.type === 'comment' && currentUser?.id === item.user.id;
  }

  startEditComment(item: TaskHistoryItem): void {
    this.editingCommentId.set(item.id);
    this.editCommentForm.patchValue({
      editText: item.content || ''
    });
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editCommentForm.reset();
  }

  saveEditComment(item: TaskHistoryItem): void {
    if (this.editCommentForm.invalid) {
      this.editCommentForm.markAllAsTouched();
      return;
    }

    const newText = this.editCommentForm.value.editText;
    
    // Call real backend to update comment
    this.taskService.updateComment(this.taskId, item.id, { comment: newText }).subscribe({
      next: (updatedComment) => {
        this.historyItems.update(items =>
          items.map(historyItem =>
            historyItem.id === item.id
              ? { ...historyItem, content: newText }
              : historyItem
          )
        );
        this.editingCommentId.set(null);
        this.editCommentForm.reset();
      },
      error: (err) => {
        console.error('Error updating comment:', err);
        this.error.set('Error al actualizar el comentario');
      }
    });
  }

  deleteComment(item: TaskHistoryItem): void {
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este comentario?');
    if (!confirmed) return;

    // Call real backend to delete comment
    this.taskService.deleteComment(this.taskId, item.id).subscribe({
      next: () => {
        this.historyItems.update(items =>
          items.filter(historyItem => historyItem.id !== item.id)
        );
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.error.set('Error al eliminar el comentario');
      }
    });
  }
}