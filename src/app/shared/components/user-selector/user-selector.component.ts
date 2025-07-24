import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-selector">
      <!-- Single User Selection -->
      <div class="single-selection" *ngIf="!multiSelect">
        <div class="current-selection" (click)="toggleDropdown()" [class.active]="showDropdown()">
          <div class="selected-user" *ngIf="selectedUser(); else noSelection">
            <div class="user-avatar">
              {{ getUserInitials(selectedUser()!) }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ selectedUser()!.name }}</span>
              <span class="user-email">{{ selectedUser()!.email }}</span>
            </div>
          </div>
          <ng-template #noSelection>
            <div class="no-selection">
              <i class="fas fa-user-plus text-muted me-2"></i>
              <span class="text-muted">{{ placeholder }}</span>
            </div>
          </ng-template>
          <div class="dropdown-arrow">
            <i class="fas fa-chevron-down" [class.rotated]="showDropdown()"></i>
          </div>
        </div>

        <!-- Dropdown Menu -->
        <div class="dropdown-menu" *ngIf="showDropdown()">
          <!-- Unassign Option -->
          <div class="dropdown-item unassign-option" 
               (click)="selectUser(null)"
               *ngIf="allowUnassign && selectedUser()">
            <div class="user-avatar unassigned">
              <i class="fas fa-user-slash"></i>
            </div>
            <div class="user-info">
              <span class="user-name">Unassigned</span>
              <span class="user-email">Remove assignment</span>
            </div>
          </div>
          
          <!-- Available Users -->
          <div class="dropdown-item" 
               *ngFor="let user of availableUsers(); trackBy: trackByUserId"
               (click)="selectUser(user)"
               [class.selected]="isSelected(user)">
            <div class="user-avatar">
              {{ getUserInitials(user) }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <div class="selection-indicator" *ngIf="isSelected(user)">
              <i class="fas fa-check"></i>
            </div>
          </div>

          <!-- No Users Available -->
          <div class="no-users" *ngIf="availableUsers().length === 0">
            <i class="fas fa-users text-muted"></i>
            <p class="text-muted mb-0">No team members available</p>
          </div>
        </div>
      </div>

      <!-- Multi User Selection -->
      <div class="multi-selection" *ngIf="multiSelect">
        <div class="selected-users" *ngIf="selectedUsers().length > 0">
          <h6 class="fw-bold mb-2">Selected Users ({{ selectedUsers().length }})</h6>
          <div class="selected-users-list">
            <div class="selected-user-tag" 
                 *ngFor="let user of selectedUsers(); trackBy: trackByUserId">
              <div class="user-avatar">
                {{ getUserInitials(user) }}
              </div>
              <span class="user-name">{{ user.name }}</span>
              <button type="button" 
                      class="remove-btn"
                      (click)="removeUser(user)"
                      [disabled]="disabled">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="add-users-section">
          <button type="button" 
                  class="btn btn-outline-primary btn-sm"
                  (click)="toggleDropdown()"
                  [disabled]="disabled">
            <i class="fas fa-plus me-1"></i>Add Users
          </button>

          <!-- Multi-select Dropdown -->
          <div class="dropdown-menu multi-dropdown" *ngIf="showDropdown()">
            <div class="dropdown-header">
              <h6 class="mb-0">Add Team Members</h6>
              <button type="button" 
                      class="btn btn-link btn-sm p-0"
                      (click)="closeDropdown()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="dropdown-body">
              <div class="dropdown-item" 
                   *ngFor="let user of availableUsers(); trackBy: trackByUserId"
                   (click)="toggleUserSelection(user)"
                   [class.selected]="isSelected(user)">
                <div class="user-avatar">
                  {{ getUserInitials(user) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <div class="selection-checkbox">
                  <input type="checkbox" 
                         [checked]="isSelected(user)"
                         (click)="$event.stopPropagation()"
                         (change)="toggleUserSelection(user)">
                </div>
              </div>

              <!-- No Users Available -->
              <div class="no-users" *ngIf="availableUsers().length === 0">
                <i class="fas fa-users text-muted"></i>
                <p class="text-muted mb-0">All team members are already selected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        <span class="text-muted">Loading users...</span>
      </div>

      <!-- Error State -->
      <div class="alert alert-danger alert-sm" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>
    </div>
  `,
  styles: [`
    .user-selector {
      position: relative;
    }

    .single-selection {
      .current-selection {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-md);
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--primary-400);
        }

        &.active {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
        }

        .selected-user,
        .no-selection {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 0.75rem;
        }

        .dropdown-arrow {
          margin-left: auto;
          transition: transform 0.2s ease;

          &.rotated {
            transform: rotate(180deg);
          }
        }
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;

      &.unassigned {
        background: var(--gray-100);
        color: var(--gray-500);
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .user-name {
        font-weight: 500;
        color: var(--gray-900);
        font-size: 0.875rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-email {
        font-size: 0.75rem;
        color: var(--gray-500);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      max-height: 300px;
      overflow-y: auto;
      margin-top: 0.25rem;

      &.multi-dropdown {
        width: 300px;
      }

      .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
      }

      .dropdown-body {
        padding: 0.5rem 0;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background: var(--gray-50);
        }

        &.selected {
          background: var(--primary-50);
        }

        &.unassign-option {
          border-bottom: 1px solid var(--gray-200);
          margin-bottom: 0.5rem;

          &:hover {
            background: var(--error-50);
          }
        }

        .user-info {
          flex: 1;
        }

        .selection-indicator {
          color: var(--primary-600);
          font-size: 0.875rem;
        }

        .selection-checkbox {
          input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
          }
        }
      }

      .no-users {
        text-align: center;
        padding: 2rem 1rem;

        i {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }
      }
    }

    .multi-selection {
      .selected-users {
        margin-bottom: 1rem;

        .selected-users-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .selected-user-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary-50);
          color: var(--primary-700);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          border: 1px solid var(--primary-200);

          .user-avatar {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
            background: var(--primary-200);
            color: var(--primary-800);
          }

          .user-name {
            font-weight: 500;
          }

          .remove-btn {
            background: none;
            border: none;
            color: var(--primary-600);
            padding: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background: var(--primary-200);
              color: var(--primary-800);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            i {
              font-size: 0.625rem;
            }
          }
        }
      }
    }

    .loading-state {
      display: flex;
      align-items: center;
      padding: 1rem;
      justify-content: center;
    }

    .alert-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .dropdown-menu {
        &.multi-dropdown {
          width: 100%;
          left: 0;
          right: 0;
        }
      }

      .selected-users-list {
        flex-direction: column;
        gap: 0.25rem;

        .selected-user-tag {
          justify-content: space-between;
        }
      }
    }
  `]
})
export class UserSelectorComponent implements OnInit {
  @Input() users: User[] = [];
  @Input() selectedUserId?: string | null;
  @Input() selectedUserIds: string[] = [];
  @Input() multiSelect: boolean = false;
  @Input() disabled: boolean = false;
  @Input() allowUnassign: boolean = true;
  @Input() placeholder: string = 'Select user...';
  @Input() projectId?: number; // Filter users by project membership

  @Output() userSelected = new EventEmitter<User | null>();
  @Output() usersSelected = new EventEmitter<User[]>();
  @Output() userRemoved = new EventEmitter<User>();

  private fb = inject(FormBuilder);

  selectedUser = signal<User | null>(null);
  selectedUsers = signal<User[]>([]);
  availableUsers = signal<User[]>([]);
  showDropdown = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeUsers();
    this.setupInitialSelection();
  }

  ngOnChanges(): void {
    this.initializeUsers();
    this.setupInitialSelection();
  }

  private initializeUsers(): void {
    // In a real implementation, this would filter users by project membership
    // For now, we'll use all provided users
    this.availableUsers.set(this.users);
  }

  private setupInitialSelection(): void {
    if (this.multiSelect) {
      const selected = this.users.filter(user => 
        this.selectedUserIds.includes(user.id)
      );
      this.selectedUsers.set(selected);
    } else {
      const selected = this.selectedUserId ? 
        this.users.find(user => user.id === this.selectedUserId) || null : 
        null;
      this.selectedUser.set(selected);
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.showDropdown.set(!this.showDropdown());
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  selectUser(user: User | null): void {
    if (this.disabled) return;

    this.selectedUser.set(user);
    this.userSelected.emit(user);
    this.closeDropdown();
  }

  toggleUserSelection(user: User): void {
    if (this.disabled) return;

    const currentSelected = this.selectedUsers();
    const isCurrentlySelected = this.isSelected(user);

    if (isCurrentlySelected) {
      const newSelected = currentSelected.filter(u => u.id !== user.id);
      this.selectedUsers.set(newSelected);
      this.userRemoved.emit(user);
    } else {
      const newSelected = [...currentSelected, user];
      this.selectedUsers.set(newSelected);
    }

    this.usersSelected.emit(this.selectedUsers());
  }

  removeUser(user: User): void {
    if (this.disabled) return;

    if (this.multiSelect) {
      const newSelected = this.selectedUsers().filter(u => u.id !== user.id);
      this.selectedUsers.set(newSelected);
      this.usersSelected.emit(newSelected);
    } else {
      this.selectedUser.set(null);
      this.userSelected.emit(null);
    }
    
    this.userRemoved.emit(user);
  }

  isSelected(user: User): boolean {
    if (this.multiSelect) {
      return this.selectedUsers().some(u => u.id === user.id);
    } else {
      return this.selectedUser()?.id === user.id;
    }
  }

  getUserInitials(user: User): string {
    if (!user.name) return user.email.substring(0, 2).toUpperCase();
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}