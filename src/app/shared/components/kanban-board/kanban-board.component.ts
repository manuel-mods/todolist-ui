import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Task, TaskStatus, Project, User, ReorderTasksRequest } from '../../../core/models';
import { CreateTaskModalComponent } from '../modals/create-task-modal.component';
import { TaskDetailModalComponent } from '../modals/task-detail-modal.component';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';

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
export class KanbanBoardComponent implements OnChanges {
  private modalService = inject(NgbModal);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  // Inputs
  @Input() tasks: Task[] = [];
  @Input() projects: Project[] = [];
  @Input() users: User[] = [];
  @Input() loading: boolean = false;
  @Input() showProject: boolean = false; // Show project name on task cards
  @Input() allowCreateTask: boolean = true;
  @Input() statistics: TaskStatistics | null = null;
  @Input() currentProjectId?: number; // For auto-selecting project in task creation

  // Outputs
  @Output() taskStatusChanged = new EventEmitter<{task: Task, newStatus: TaskStatus, previousStatus: TaskStatus}>();
  @Output() taskCreated = new EventEmitter<string>(); // Emits the status for new task
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskClicked = new EventEmitter<Task>(); // New event for task click

  // Expose enum to template
  TaskStatus = TaskStatus;

  // Cache the task lists to avoid recreating arrays on every call
  private tasksByStatus: { [key: string]: Task[] } = {};
  private lastTasksUpdate = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      console.log('Tasks input changed, clearing cache');
      this.tasksByStatus = {};
      this.lastTasksUpdate = Date.now();
    }
  }

  getTasksByStatus(status: string): Task[] {
    const currentTime = Date.now();
    
    // Only recalculate if tasks have changed
    if (currentTime !== this.lastTasksUpdate) {
      this.tasksByStatus = {};
      this.lastTasksUpdate = currentTime;
    }
    
    if (!this.tasksByStatus[status]) {
      this.tasksByStatus[status] = this.tasks
        .filter(task => task.status === status)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenar por campo order
    }
    
    return this.tasksByStatus[status];
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    console.log('Drop event triggered', event);
    const task = event.item.data as Task;
    const previousStatus = task.status;
    
    console.log(`Moving task "${task.title}" from ${previousStatus} to ${newStatus}`);
    
    if (previousStatus === newStatus) {
      // Same column - just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      console.log('Reordered within same column');
      
      // TODO: Add order update logic here if needed
      return;
    }

    // Validate the drop is allowed based on business rules
    if (!this.canDropTask(task, newStatus)) {
      console.warn(`Drop not allowed from ${previousStatus} to ${newStatus}`);
      return;
    }

    // Clear cached lists since we're modifying them
    this.tasksByStatus = {};
    this.lastTasksUpdate = Date.now();

    // Different column - update status
    // Optimistically update the UI first
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update task status locally
    const updatedTask = { ...task, status: newStatus };

    // Update the task in the original tasks array
    const taskIndex = this.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = updatedTask;
    }

    // Add visual feedback for successful drop
    this.showDropFeedback(event.container.element.nativeElement);

    console.log('Task status updated locally, emitting change event');

    // Emit the change event - let parent component handle server update
    this.taskStatusChanged.emit({
      task: updatedTask,
      newStatus,
      previousStatus
    });
  }

  private showDropFeedback(element: HTMLElement): void {
    element.classList.add('drop-success');
    
    setTimeout(() => {
      element.classList.remove('drop-success');
    }, 1000);
  }

  private updateTaskOrder(task: Task, status: TaskStatus, newOrder: number, userId: string): void {
    const reorderData: ReorderTasksRequest = {
      taskId: task.id,
      newStatus: status,
      newOrder: newOrder,
      userId: userId
    };

    this.taskService.reorderTasks(reorderData).subscribe({
      next: (updatedTask) => {
        console.log('Task order updated successfully:', updatedTask);
        // Update local task with server response
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
      },
      error: (error) => {
        console.error('Failed to update task order:', error);
        // Revert the optimistic update on error
        this.revertTaskOrder(task);
      }
    });
  }

  private updateTaskStatusAndOrder(task: Task, newStatus: TaskStatus, previousStatus: TaskStatus, newOrder: number, userId: string): void {
    // First update the status
    this.taskService.updateTaskStatus(task.id, { 
      newStatus: newStatus.toString(), 
      userId: userId 
    }).subscribe({
      next: (updatedTask) => {
        console.log('Task status updated successfully:', updatedTask);
        
        // Then update the order if needed
        if (newOrder !== (task.order || 0)) {
          this.updateTaskOrder(updatedTask, newStatus, newOrder, userId);
        }
        
        // Emit the change event
        this.taskStatusChanged.emit({
          task: updatedTask,
          newStatus,
          previousStatus
        });
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
        // Revert the optimistic update on error
        task.status = previousStatus;
        this.revertTaskMovement(task, previousStatus, newStatus);
        
        // Refresh data from server
        this.loadProjectData();
      }
    });
  }

  private revertTaskOrder(task: Task): void {
    // Reload tasks to get the correct order from server
    this.tasksByStatus = {};
    this.lastTasksUpdate = Date.now();
  }

  private revertTaskMovement(task: Task, previousStatus: TaskStatus, newStatus: TaskStatus): void {
    // Find and revert the task movement
    const newStatusTasks = this.getTasksByStatus(newStatus.toString());
    const previousStatusTasks = this.getTasksByStatus(previousStatus.toString());
    
    // Remove from new status
    const taskIndex = newStatusTasks.findIndex(t => t.id === task.id);
    if (taskIndex > -1) {
      newStatusTasks.splice(taskIndex, 1);
    }
    
    // Add back to previous status
    previousStatusTasks.push(task);
    
    // Clear cache to force recalculation
    this.tasksByStatus = {};
    this.lastTasksUpdate = Date.now();
  }

  private loadProjectData(): void {
    // This should be implemented to reload data from parent component
    // For now, we'll just clear the cache
    this.tasksByStatus = {};
    this.lastTasksUpdate = Date.now();
  }

  // Enhanced drag predicates for better UX
  canDragTask(task: Task): boolean {
    // Add business logic to determine if a task can be dragged
    // For example, only allow dragging if user has permission
    return true;
  }

  canDropTask(task: Task, newStatus: TaskStatus): boolean {
    // More flexible transition rules - allow most transitions except some invalid ones
    const invalidTransitions: { [key in TaskStatus]: TaskStatus[] } = {
      [TaskStatus.CREATED]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.BLOCKED]: [],
      [TaskStatus.TESTING]: [],
      [TaskStatus.READY_TO_FINISH]: [],
      [TaskStatus.FINISHED]: []
    };

    // Only block specific invalid transitions if needed
    return !invalidTransitions[task.status]?.includes(newStatus);
  }

  // Visual feedback for drag states
  onDragStarted(task: Task): void {
    console.log('Drag started:', task.title);
  }

  onDragEnded(task: Task): void {
    console.log('Drag ended:', task.title);
  }

  onDragEntered(status: TaskStatus): void {
    console.log('Drag entered column:', status);
  }

  onDragExited(status: TaskStatus): void {
    console.log('Drag exited column:', status);
  }

  createTask(status?: string): void {
    if (!this.allowCreateTask) return;

    const modalRef = this.modalService.open(CreateTaskModalComponent, {
      size: 'fullscreen',
      backdrop: 'static',
      windowClass: 'fullscreen-modal-window'
    });
    
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.defaultStatus = status || 'CREATED';
    modalRef.componentInstance.defaultProjectId = this.currentProjectId;
    
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
    
    // Emit the task clicked event instead of opening modal directly
    this.taskClicked.emit(task);
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

  // Subtask methods
  getSubtaskCount(task: Task): number {
    return this.tasks.filter(t => t.parentTaskId === task.id).length;
  }
}