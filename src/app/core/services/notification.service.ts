import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, Task } from '../models';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_unassigned' | 'task_status_changed' | 'task_comment' | 'project_shared';
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  fromUser: User;
  toUser: User;
  read: boolean;
  createdAt: Date;
  data?: any; // Additional data specific to notification type
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    // In a real implementation, this would load from the backend
    // For now, we'll use mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'You have been assigned to "Implement user authentication"',
        taskId: 1,
        fromUser: { id: 'user2', email: 'jane@example.com', name: 'Jane Smith' },
        toUser: { id: 'user1', email: 'john@example.com', name: 'John Doe' },
        read: false,
        createdAt: new Date('2024-01-16T10:30:00'),
        data: { taskTitle: 'Implement user authentication' }
      },
      {
        id: '2',
        type: 'project_shared',
        title: 'Project Shared',
        message: 'Jane Smith shared "TodoList App" project with you',
        projectId: 1,
        fromUser: { id: 'user2', email: 'jane@example.com', name: 'Jane Smith' },
        toUser: { id: 'user1', email: 'john@example.com', name: 'John Doe' },
        read: true,
        createdAt: new Date('2024-01-15T14:20:00'),
        data: { projectName: 'TodoList App' }
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  // Task assignment notifications
  notifyTaskAssigned(task: Task, assignedUser: User, assignedBy: User): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${assignedBy.name} assigned you to "${task.title}"`,
      taskId: task.id,
      fromUser: assignedBy,
      toUser: assignedUser,
      read: false,
      createdAt: new Date(),
      data: { taskTitle: task.title, projectId: task.projectId }
    };

    this.addNotification(notification);
  }

  notifyTaskUnassigned(task: Task, previousAssignee: User, unassignedBy: User): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'task_unassigned',
      title: 'Task Unassigned',
      message: `${unassignedBy.name} removed you from "${task.title}"`,
      taskId: task.id,
      fromUser: unassignedBy,
      toUser: previousAssignee,
      read: false,
      createdAt: new Date(),
      data: { taskTitle: task.title, projectId: task.projectId }
    };

    this.addNotification(notification);
  }

  notifyTaskStatusChanged(task: Task, oldStatus: string, newStatus: string, changedBy: User, assignedUser?: User): void {
    if (!assignedUser) return;

    const notification: Notification = {
      id: Date.now().toString(),
      type: 'task_status_changed',
      title: 'Task Status Updated',
      message: `${changedBy.name} moved "${task.title}" from ${oldStatus} to ${newStatus}`,
      taskId: task.id,
      fromUser: changedBy,
      toUser: assignedUser,
      read: false,
      createdAt: new Date(),
      data: { 
        taskTitle: task.title, 
        oldStatus, 
        newStatus, 
        projectId: task.projectId 
      }
    };

    this.addNotification(notification);
  }

  notifyTaskComment(task: Task, commentText: string, commentBy: User, assignedUser?: User): void {
    if (!assignedUser || assignedUser.id === commentBy.id) return;

    const notification: Notification = {
      id: Date.now().toString(),
      type: 'task_comment',
      title: 'New Comment',
      message: `${commentBy.name} commented on "${task.title}": "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
      taskId: task.id,
      fromUser: commentBy,
      toUser: assignedUser,
      read: false,
      createdAt: new Date(),
      data: { 
        taskTitle: task.title, 
        commentText, 
        projectId: task.projectId 
      }
    };

    this.addNotification(notification);
  }

  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();

    // In a real implementation, this would also send to the backend
    console.log('New notification created:', notification);
  }

  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();

    // In a real implementation, this would also update the backend
  }

  markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      read: true
    }));
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();

    // In a real implementation, this would also update the backend
  }

  deleteNotification(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(
      notification => notification.id !== notificationId
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();

    // In a real implementation, this would also delete from the backend
  }

  private updateUnreadCount(): void {
    const currentNotifications = this.notificationsSubject.value;
    const unreadCount = currentNotifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Helper method to get notifications for current user
  getNotificationsForCurrentUser(): Observable<Notification[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new BehaviorSubject<Notification[]>([]).asObservable();
    }

    // In a real implementation, this would filter by user on the backend
    // For now, we'll filter client-side
    return this.notifications$;
  }
}