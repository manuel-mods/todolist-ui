import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  TaskWatcher,
  WatcherNotification,
  AddWatcherRequest,
  RemoveWatcherRequest
} from '../models/watcher.model';

@Injectable({
  providedIn: 'root',
})
export class WatcherService {
  private api = inject(ApiService);

  // Get all watchers for a task
  getTaskWatchers(taskId: number): Observable<TaskWatcher[]> {
    return this.api.get<TaskWatcher[]>(`/tasks/${taskId}/watchers`);
  }

  // Add a watcher to a task
  addWatcher(data: AddWatcherRequest): Observable<TaskWatcher> {
    return this.api.post<TaskWatcher>(`/tasks/${data.taskId}/watchers`, data);
  }

  // Remove a watcher from a task
  removeWatcher(data: RemoveWatcherRequest): Observable<void> {
    return this.api.delete<void>(`/tasks/${data.taskId}/watchers/${data.userId}`);
  }

  // Check if current user is watching a task
  isWatching(taskId: number, userId: string): Observable<boolean> {
    return this.api.get<boolean>(`/tasks/${taskId}/watchers/${userId}/status`);
  }

  // Get all tasks being watched by a user
  getUserWatchedTasks(userId: string): Observable<number[]> {
    return this.api.get<number[]>(`/users/${userId}/watched-tasks`);
  }

  // Get watcher notifications for a user
  getWatcherNotifications(userId: string, limit: number = 50): Observable<WatcherNotification[]> {
    return this.api.get<WatcherNotification[]>(`/users/${userId}/watcher-notifications?limit=${limit}`);
  }

  // Mark watcher notification as read
  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.api.put<void>(`/watcher-notifications/${notificationId}/read`, {});
  }

  // Bulk add watchers (for when task is assigned, etc.)
  addMultipleWatchers(taskId: number, userIds: string[]): Observable<TaskWatcher[]> {
    return this.api.post<TaskWatcher[]>(`/tasks/${taskId}/watchers/bulk`, { userIds });
  }

  // Remove all watchers from a task
  removeAllWatchers(taskId: number): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}/watchers`);
  }
}