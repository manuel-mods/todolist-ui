import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notifications-dropdown" [class.show]="showDropdown()">
      <!-- Notification Bell -->
      <button 
        type="button" 
        class="notification-bell"
        (click)="toggleDropdown()"
        [class.has-unread]="unreadCount() > 0">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" *ngIf="unreadCount() > 0">
          {{ unreadCount() > 99 ? '99+' : unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Menu -->
      <div class="dropdown-menu" *ngIf="showDropdown()">
        <div class="dropdown-header">
          <h6 class="mb-0">Notifications</h6>
          <div class="header-actions">
            <button 
              type="button" 
              class="btn btn-link btn-sm p-0"
              (click)="markAllAsRead()"
              *ngIf="unreadCount() > 0">
              Mark all read
            </button>
          </div>
        </div>

        <div class="notifications-list">
          <!-- Notification Items -->
          <div 
            class="notification-item"
            *ngFor="let notification of notifications(); trackBy: trackByNotificationId"
            [class.unread]="!notification.read"
            (click)="onNotificationClick(notification)">
            
            <div class="notification-icon" [ngClass]="getNotificationIconClass(notification.type)">
              <i [class]="getNotificationIcon(notification.type)"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-meta">
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                <span class="notification-from">from {{ notification.fromUser.name }}</span>
              </div>
            </div>

            <div class="notification-actions">
              <button 
                type="button" 
                class="btn btn-link btn-sm p-0"
                (click)="markAsRead(notification, $event)"
                *ngIf="!notification.read"
                title="Mark as read">
                <i class="fas fa-check"></i>
              </button>
              <button 
                type="button" 
                class="btn btn-link btn-sm p-0 text-danger"
                (click)="deleteNotification(notification, $event)"
                title="Delete notification">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="notifications().length === 0">
            <i class="fas fa-bell-slash fa-2x text-muted mb-2"></i>
            <p class="text-muted mb-0">No notifications yet</p>
            <small class="text-muted">You'll see notifications here when there's activity</small>
          </div>
        </div>

        <div class="dropdown-footer" *ngIf="notifications().length > 5">
          <a routerLink="/notifications" class="btn btn-link btn-sm">
            View all notifications
          </a>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div class="dropdown-backdrop" *ngIf="showDropdown()" (click)="closeDropdown()"></div>
  `,
  styles: [`
    .notifications-dropdown {
      position: relative;
    }

    .notification-bell {
      position: relative;
      background: none;
      border: none;
      color: var(--gray-600);
      font-size: 1.25rem;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--gray-100);
        color: var(--primary-600);
      }

      &.has-unread {
        color: var(--primary-600);
      }

      .notification-badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--error-500);
        color: white;
        font-size: 0.625rem;
        font-weight: 600;
        padding: 0.125rem 0.375rem;
        border-radius: 10px;
        min-width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(25%, -25%);
        border: 2px solid white;
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      width: 380px;
      background: white;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      margin-top: 0.5rem;
      max-height: 500px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--gray-200);
      background: var(--gray-50);

      h6 {
        color: var(--gray-900);
        font-weight: 600;
      }

      .header-actions {
        .btn-link {
          color: var(--primary-600);
          text-decoration: none;
          font-size: 0.875rem;

          &:hover {
            color: var(--primary-700);
            text-decoration: underline;
          }
        }
      }
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      max-height: 400px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--gray-100);
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--gray-25);
      }

      &.unread {
        background: var(--primary-25);
        border-left: 3px solid var(--primary-500);
      }

      &:last-child {
        border-bottom: none;
      }

      .notification-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        flex-shrink: 0;

        &.icon-assigned {
          background: var(--primary-100);
          color: var(--primary-600);
        }

        &.icon-unassigned {
          background: var(--warning-100);
          color: var(--warning-600);
        }

        &.icon-status-changed {
          background: var(--success-100);
          color: var(--success-600);
        }

        &.icon-comment {
          background: var(--info-100);
          color: var(--info-600);
        }

        &.icon-project-shared {
          background: var(--purple-100);
          color: var(--purple-600);
        }
      }

      .notification-content {
        flex: 1;
        min-width: 0;

        .notification-title {
          font-weight: 600;
          color: var(--gray-900);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .notification-message {
          color: var(--gray-600);
          font-size: 0.875rem;
          line-height: 1.4;
          margin-bottom: 0.5rem;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--gray-500);

          .notification-time {
            font-weight: 500;
          }

          .notification-from {
            &::before {
              content: '•';
              margin-right: 0.5rem;
            }
          }
        }
      }

      .notification-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s ease;

        .btn-link {
          color: var(--gray-500);
          font-size: 0.875rem;

          &:hover {
            color: var(--primary-600);
          }

          &.text-danger:hover {
            color: var(--error-600);
          }
        }
      }

      &:hover .notification-actions {
        opacity: 1;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;

      i {
        opacity: 0.5;
      }

      p {
        margin-bottom: 0.5rem;
      }
    }

    .dropdown-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--gray-200);
      background: var(--gray-50);
      text-align: center;

      .btn-link {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          color: var(--primary-700);
          text-decoration: underline;
        }
      }
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }

    @media (max-width: 768px) {
      .dropdown-menu {
        width: 320px;
        right: -1rem;
      }

      .notification-item {
        padding: 0.75rem 1rem;

        .notification-actions {
          opacity: 1;
        }
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  showDropdown = signal(false);
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.getNotifications().subscribe(notifications => {
        // Show only the first 10 notifications in dropdown
        this.notifications.set(notifications.slice(0, 10));
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.getUnreadCount().subscribe(count => {
        this.unreadCount.set(count);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    this.showDropdown.set(!this.showDropdown());
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.read) {
      this.markAsRead(notification);
    }

    // Navigate to relevant page based on notification type
    if (notification.taskId) {
      // In a real app, this would navigate to the task detail view
      console.log('Navigate to task:', notification.taskId);
    } else if (notification.projectId) {
      // In a real app, this would navigate to the project view
      console.log('Navigate to project:', notification.projectId);
    }

    this.closeDropdown();
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task_assigned': return 'fas fa-user-plus';
      case 'task_unassigned': return 'fas fa-user-minus';
      case 'task_status_changed': return 'fas fa-exchange-alt';
      case 'task_comment': return 'fas fa-comment';
      case 'project_shared': return 'fas fa-share-alt';
      default: return 'fas fa-bell';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'task_assigned': return 'icon-assigned';
      case 'task_unassigned': return 'icon-unassigned';
      case 'task_status_changed': return 'icon-status-changed';
      case 'task_comment': return 'icon-comment';
      case 'project_shared': return 'icon-project-shared';
      default: return 'icon-default';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}