import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Task, TaskStatus, Project, User } from '../../../core/models';
import { CreateTaskModalComponent } from '../modals/create-task-modal.component';
import { TaskDetailModalComponent } from '../modals/task-detail-modal.component';

export interface TaskStatistics {
  created: number;
  inProgress: number;
  blocked: number;
  testing: number;
  ready: number;
  finished: number;
  total: number;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent {
  private modalService = inject(NgbModal);

  // Inputs
  @Input() tasks: Task[] = [];
  @Input() projects: Project[] = [];
  @Input() users: User[] = [];
  @Input() loading: boolean = false;
  @Input() showProject: boolean = false; // Show project name on task cards
  @Input() allowCreateTask: boolean = true;
  @Input() statistics: TaskStatistics | null = null;

  // Outputs
  @Output() taskStatusChanged = new EventEmitter<{task: Task, newStatus: TaskStatus, previousStatus: TaskStatus}>();
  @Output() taskCreated = new EventEmitter<string>(); // Emits the status for new task
  @Output() taskUpdated = new EventEmitter<Task>();

  // Expose enum to template
  TaskStatus = TaskStatus;

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    const task = event.item.data;
    const previousStatus = task.status;
    
    if (previousStatus === newStatus) {
      // Same column - just reorder (no server update needed)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Different column - update status
    // Optimistically update the UI first
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update task status locally
    task.status = newStatus;

    // Emit the change event
    this.taskStatusChanged.emit({
      task,
      newStatus,
      previousStatus
    });
  }

  createTask(status?: string): void {
    if (!this.allowCreateTask) return;

    const modalRef = this.modalService.open(CreateTaskModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.defaultStatus = status || 'CREATED';
    
    modalRef.result.then((result) => {
      if (result) {
        this.taskCreated.emit(status);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  openTaskDetail(task: Task, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(TaskDetailModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    
    // Pass the task data directly instead of just the ID
    modalRef.componentInstance.task = { ...task };
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.users = this.users;
    
    modalRef.result.then((updatedTask) => {
      if (updatedTask) {
        this.taskUpdated.emit(updatedTask);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  getAssigneeInitials(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    if (user && user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return userId.substring(0, 2).toUpperCase();
  }

  getAssigneeName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user?.name || `User ${userId}`;
  }

  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  // Checklist progress methods
  getCompletedChecklistItems(task: Task): number {
    if (!task.checklistItems) return 0;
    return task.checklistItems.filter(item => item.isCompleted).length;
  }

  getChecklistProgress(task: Task): number {
    if (!task.checklistItems || task.checklistItems.length === 0) return 0;
    const completed = this.getCompletedChecklistItems(task);
    return Math.round((completed / task.checklistItems.length) * 100);
  }

  getStatistics(): TaskStatistics {
    if (this.statistics) {
      return this.statistics;
    }

    // Calculate statistics from tasks
    return {
      created: this.getTasksByStatus('CREATED').length,
      inProgress: this.getTasksByStatus('IN_PROGRESS').length,
      blocked: this.getTasksByStatus('BLOCKED').length,
      testing: this.getTasksByStatus('TESTING').length,
      ready: this.getTasksByStatus('READY_TO_FINISH').length,
      finished: this.getTasksByStatus('FINISHED').length,
      total: this.tasks.length
    };
  }
}