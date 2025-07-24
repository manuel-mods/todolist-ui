import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, User } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-invite-users-modal-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Invitar Usuarios al Proyecto</h4>
      <button 
        type="button" 
        class="btn-close" 
        (click)="onClose()"
        aria-label="Close"
      ></button>
    </div>

    <div class="modal-body">
      <div class="invite-section">
        <label class="form-label">Buscar usuario por email</label>
        <div class="input-group mb-3">
          <input
            type="email"
            [(ngModel)]="searchEmail"
            (input)="onSearchInput($event)"
            placeholder="ejemplo@correo.com"
            class="form-control"
            [disabled]="isSearching"
            #emailInput
          >
          <button
            class="btn btn-outline-secondary"
            type="button"
            (click)="clearSearch()"
            [disabled]="!searchEmail"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>

        <!-- Search Results -->
        <div class="search-results" *ngIf="searchResults.length > 0">
          <h6 class="text-muted mb-2">Resultados de búsqueda:</h6>
          <div class="user-list">
            <div
              class="user-card"
              *ngFor="let user of searchResults"
              (click)="selectUser(user)"
              [class.selected]="selectedUsers.includes(user)"
            >
              <div class="user-info">
                <img
                  [src]="user.avatar || 'assets/default-avatar.png'"
                  [alt]="user.name || user.email"
                  class="user-avatar"
                >
                <div class="user-details">
                  <div class="user-name">{{ user.name || 'Sin nombre' }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
              <div class="user-actions">
                <i 
                  class="fa" 
                  [class.fa-plus]="!selectedUsers.includes(user)"
                  [class.fa-check]="selectedUsers.includes(user)"
                  [class.text-success]="selectedUsers.includes(user)"
                ></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div class="text-center py-3" *ngIf="isSearching">
          <i class="fa fa-spinner fa-spin"></i> Buscando usuarios...
        </div>

        <!-- No results -->
        <div class="alert alert-info" *ngIf="searchEmail && !isSearching && searchResults.length === 0">
          <i class="fa fa-info-circle"></i>
          No se encontraron usuarios con ese email
        </div>

        <!-- Selected Users -->
        <div class="selected-users" *ngIf="selectedUsers.length > 0">
          <h6 class="text-muted mb-2">Usuarios seleccionados ({{ selectedUsers.length }}):</h6>
          <div class="selected-user-list">
            <div
              class="selected-user-item"
              *ngFor="let user of selectedUsers"
            >
              <img
                [src]="user.avatar || 'assets/default-avatar.png'"
                [alt]="user.name || user.email"
                class="user-avatar-sm"
              >
              <span class="user-info-text">
                <strong>{{ user.name || 'Sin nombre' }}</strong>
                <br>
                <small class="text-muted">{{ user.email }}</small>
              </span>
              <button
                class="btn btn-sm btn-outline-danger"
                (click)="removeSelectedUser(user)"
                title="Remover"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button 
        type="button" 
        class="btn btn-secondary" 
        (click)="onClose()"
      >
        Cancelar
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        (click)="inviteUsers()"
        [disabled]="selectedUsers.length === 0 || isInviting"
      >
        <span *ngIf="isInviting">
          <i class="fa fa-spinner fa-spin"></i> Invitando...
        </span>
        <span *ngIf="!isInviting">
          Invitar {{ selectedUsers.length }} usuario(s)
        </span>
      </button>
    </div>
  `,
  styles: [`
    .invite-section {
      min-height: 200px;
    }

    .search-results {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      background: #f8f9fa;
      margin-bottom: 1rem;
    }

    .user-list {
      padding: 0.5rem;
    }

    .user-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: #007bff;
        box-shadow: 0 2px 4px rgba(0,123,255,0.1);
      }

      &.selected {
        border-color: #28a745;
        background-color: #f8fff9;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 0.75rem;
      object-fit: cover;
    }

    .user-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 0.5rem;
      object-fit: cover;
    }

    .user-details {
      .user-name {
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.25rem;
      }

      .user-email {
        color: #6c757d;
        font-size: 0.875rem;
      }
    }

    .user-actions {
      color: #007bff;
      font-size: 1.1rem;
    }

    .selected-users {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .selected-user-list {
      max-height: 150px;
      overflow-y: auto;
    }

    .selected-user-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 0.375rem;

      .user-info-text {
        flex: 1;
        margin-left: 0.5rem;
      }

      .btn {
        margin-left: 0.5rem;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .alert {
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 0.375rem;
    }

    .alert-info {
      color: #0c5460;
      background-color: #d1ecf1;
      border-color: #bee5eb;
    }

    .text-center.py-3 {
      padding: 1rem 0;
      color: #007bff;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      opacity: 0.5;
      cursor: pointer;

      &:hover {
        opacity: 0.75;
      }
    }

    @media (max-width: 768px) {
      .user-card {
        padding: 0.5rem;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        margin-right: 0.5rem;
      }

      .selected-user-item {
        padding: 0.375rem;
      }
    }
  `]
})
export class InviteUsersModalContentComponent implements OnInit {
  @Input() project!: Project;
  @Output() close = new EventEmitter<void>();
  @Output() usersInvited = new EventEmitter<User[]>();

  private userService = inject(UserService);
  private projectService = inject(ProjectService);

  searchEmail = '';
  searchResults: User[] = [];
  selectedUsers: User[] = [];
  isSearching = false;
  isInviting = false;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.setupSearch();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || email.length < 2) {
          return of([]);
        }
        this.isSearching = true;
        return this.userService.searchUsersByEmail(email).pipe(
          catchError(error => {
            console.error('Error searching users:', error);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (users) => {
        // Filter out users already in the project
        this.searchResults = users.filter(user => 
          user.id !== this.project?.userId && 
          !this.project?.sharedUsers?.some(su => su.user?.id === user.id) &&
          !this.selectedUsers.some(su => su.id === user.id)
        );
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
      }
    });
  }

  onSearchInput(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchEmail = '';
    this.searchResults = [];
  }

  selectUser(user: User) {
    if (!this.selectedUsers.includes(user)) {
      this.selectedUsers.push(user);
      // Remove from search results
      this.searchResults = this.searchResults.filter(u => u.id !== user.id);
    }
  }

  removeSelectedUser(user: User) {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
    // If user matches current search, add back to results
    if (this.searchEmail && user.email.toLowerCase().includes(this.searchEmail.toLowerCase())) {
      this.searchResults.push(user);
    }
  }

  async inviteUsers() {
    if (this.selectedUsers.length === 0) return;

    this.isInviting = true;
    const invitedUsers: User[] = [];
    
    try {
      // Invite users one by one
      for (const user of this.selectedUsers) {
        try {
          await this.projectService.shareProject(this.project.id, { userId: user.id }).toPromise();
          invitedUsers.push(user);
        } catch (error) {
          console.error(`Error inviting user ${user.email}:`, error);
        }
      }

      if (invitedUsers.length > 0) {
        this.usersInvited.emit(invitedUsers);
      }

      if (invitedUsers.length === this.selectedUsers.length) {
        console.log('Todos los usuarios fueron invitados exitosamente');
      } else {
        console.log(`${invitedUsers.length} de ${this.selectedUsers.length} usuarios fueron invitados`);
      }

      this.onClose();
    } catch (error) {
      console.error('Error during invitation process:', error);
    } finally {
      this.isInviting = false;
    }
  }

  onClose() {
    this.close.emit();
  }
}