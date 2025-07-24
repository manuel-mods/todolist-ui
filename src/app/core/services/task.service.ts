import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  ReorderTasksRequest,
  AddCommentRequest,
  TaskComment,
  ChecklistItem,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  ReorderChecklistRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private api = inject(ApiService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  createTask(projectId: number, data: CreateTaskRequest): Observable<Task> {
    return this.api.post<Task>(`/tasks/project/${projectId}`, data);
  }

  getProjectTasks(projectId: number): Observable<Task[]> {
    return this.api.get<Task[]>(`/tasks/project/${projectId}`);
  }

  getTask(taskId: number): Observable<Task> {
    return this.api.get<Task>(`/tasks/${taskId}`);
  }

  updateTask(taskId: number, data: UpdateTaskRequest): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}`, data);
  }

  updateTaskStatus(
    taskId: number,
    data: UpdateTaskStatusRequest
  ): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}/status`, data);
  }

  reorderTasks(data: ReorderTasksRequest): Observable<Task> {
    return this.api.put<Task>(`/tasks/${data.taskId}/reorder`, data);
  }

  addComment(taskId: number, data: AddCommentRequest): Observable<any> {
    return this.api.post(`/tasks/${taskId}/comment`, data);
  }

  getTaskComments(taskId: number): Observable<TaskComment[]> {
    return this.api.get<TaskComment[]>(`/tasks/${taskId}/comments`);
  }

  deleteComment(taskId: number, commentId: number): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}/comments/${commentId}`);
  }

  updateComment(taskId: number, commentId: number, data: { comment: string }): Observable<TaskComment> {
    return this.api.put<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, data);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}`);
  }

  // Checklist methods
  getChecklistItems(taskId: number): Observable<ChecklistItem[]> {
    return this.api.get<ChecklistItem[]>(`/tasks/${taskId}/checklist`);
  }

  createChecklistItem(taskId: number, data: CreateChecklistItemRequest): Observable<ChecklistItem> {
    return this.api.post<ChecklistItem>(`/tasks/${taskId}/checklist`, data);
  }

  updateChecklistItem(taskId: number, itemId: string, data: UpdateChecklistItemRequest): Observable<ChecklistItem> {
    return this.api.put<ChecklistItem>(`/tasks/${taskId}/checklist/${itemId}`, data);
  }

  deleteChecklistItem(taskId: number, itemId: string): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}/checklist/${itemId}`);
  }

  reorderChecklistItems(taskId: number, data: ReorderChecklistRequest): Observable<ChecklistItem[]> {
    return this.api.put<ChecklistItem[]>(`/tasks/${taskId}/checklist/reorder`, data);
  }

  // Enhanced assignment methods with notifications
  assignTask(taskId: number, userId: string, users: any[]): Observable<Task> {
    const currentUser = this.authService.getCurrentUser();
    
    return this.updateTask(taskId, { assignedTo: userId }).pipe(
      tap((updatedTask) => {
        if (currentUser && userId) {
          const assignedUser = users.find(u => u.id === userId);
          if (assignedUser && assignedUser.id !== currentUser.id) {
            this.notificationService.notifyTaskAssigned(updatedTask, assignedUser, currentUser);
          }
        }
      })
    );
  }

  unassignTask(taskId: number, previousAssigneeId: string, users: any[]): Observable<Task> {
    const currentUser = this.authService.getCurrentUser();
    
    return this.updateTask(taskId, { assignedTo: undefined }).pipe(
      tap((updatedTask) => {
        if (currentUser && previousAssigneeId) {
          const previousAssignee = users.find(u => u.id === previousAssigneeId);
          if (previousAssignee && previousAssignee.id !== currentUser.id) {
            this.notificationService.notifyTaskUnassigned(updatedTask, previousAssignee, currentUser);
          }
        }
      })
    );
  }

  updateTaskWithNotification(taskId: number, data: UpdateTaskRequest, users: any[]): Observable<Task> {
    const currentUser = this.authService.getCurrentUser();
    
    return this.getTask(taskId).pipe(
      tap(originalTask => {
        // Store original values for comparison
        (data as any)._originalTask = originalTask;
      }),
      tap(() => {}), // Continue with the update
    ).pipe(
      tap(() => this.updateTask(taskId, data)),
      tap((updatedTask) => {
        const originalTask = (data as any)._originalTask;
        
        if (currentUser) {
          // Check for assignment changes
          if (data.assignedTo !== undefined && originalTask.assignedTo !== data.assignedTo) {
            if (data.assignedTo) {
              // Task was assigned
              const assignedUser = users.find(u => u.id === data.assignedTo);
              if (assignedUser && assignedUser.id !== currentUser.id) {
                this.notificationService.notifyTaskAssigned(updatedTask, assignedUser, currentUser);
              }
            } else if (originalTask.assignedTo) {
              // Task was unassigned
              const previousAssignee = users.find(u => u.id === originalTask.assignedTo);
              if (previousAssignee && previousAssignee.id !== currentUser.id) {
                this.notificationService.notifyTaskUnassigned(updatedTask, previousAssignee, currentUser);
              }
            }
          }
        }
      })
    );
  }
}
