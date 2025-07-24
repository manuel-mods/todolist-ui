import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, User } from '../../../core/models';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  catchError,
  of,
} from 'rxjs';

@Component({
  selector: 'app-project-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-users">
      <div class="users-header">
        <h3>Miembros del Proyecto</h3>
        <button
          class="btn btn-primary btn-sm"
          (click)="showAddUser = !showAddUser"
          *ngIf="canManageUsers"
        >
          <i class="fa fa-plus"></i> Agregar Usuario
        </button>
      </div>

      <!-- Add User Section -->
      <div class="add-user-section" *ngIf="showAddUser">
        <div class="search-user">
          <div class="input-group">
            <input
              type="email"
              [(ngModel)]="searchEmail"
              (input)="onSearchInput($event)"
              placeholder="Buscar usuario por email..."
              class="form-control"
              [disabled]="isSearching"
            />
            <button
              class="btn btn-outline-secondary"
              type="button"
              (click)="clearSearch()"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>

          <!-- Search Results -->
          <div class="search-results" *ngIf="searchResults.length > 0">
            <div
              class="search-result-item"
              *ngFor="let user of searchResults"
              (click)="selectUser(user)"
            >
              <div class="user-info">
                <img
                  [src]="user.avatar || 'default-avatar.png'"
                  [alt]="user.name || user.email"
                  class="user-avatar-sm"
                />
                <div class="user-details">
                  <div class="user-name">{{ user.name || 'Sin nombre' }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
              <button class="btn btn-sm btn-success">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div class="text-center py-2" *ngIf="isSearching">
            <i class="fa fa-spinner fa-spin"></i> Buscando...
          </div>

          <!-- No results -->
          <div
            class="text-muted text-center py-2"
            *ngIf="searchEmail && !isSearching && searchResults.length === 0"
          >
            No se encontraron usuarios con ese email
          </div>
        </div>
      </div>

      <!-- Current Users List -->
      <div class="users-list">
        <!-- Project Owner -->
        <div class="user-item owner">
          <div class="user-info">
            <img
              [src]="projectOwner?.avatar || 'default-avatar.png'"
              [alt]="projectOwner?.name || projectOwner?.email"
              class="user-avatar"
            />
            <div class="user-details">
              <div class="user-name">
                {{ projectOwner?.name || 'Sin nombre' }}
              </div>
              <div class="user-email">{{ projectOwner?.email }}</div>
              <span class="badge badge-primary">Propietario</span>
            </div>
          </div>
        </div>

        <!-- Shared Users -->
        <div class="user-item" *ngFor="let sharedUser of project?.sharedUsers">
          <div class="user-info">
            <img
              [src]="sharedUser.user.avatar || 'default-avatar.png'"
              [alt]="sharedUser.user.name || sharedUser.user.email"
              class="user-avatar"
            />
            <div class="user-details">
              <div class="user-name">
                {{ sharedUser.user.name || 'Sin nombre' }}
              </div>
              <div class="user-email">{{ sharedUser.user.email }}</div>
              <span class="badge badge-secondary">Colaborador</span>
            </div>
          </div>
          <button
            class="btn btn-sm btn-outline-danger"
            (click)="removeUser(sharedUser.id)"
            *ngIf="canManageUsers"
            title="Remover usuario"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Loading state for operations -->
      <div class="text-center py-3" *ngIf="isLoading">
        <i class="fa fa-spinner fa-spin"></i> Procesando...
      </div>
    </div>
  `,
  styleUrl: './project-users.component.scss',
})
export class ProjectUsersComponent implements OnInit {
  @Input() project!: Project;

  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  projectOwner: User | null = null;
  showAddUser = false;
  searchEmail = '';
  searchResults: any[] = [];
  isSearching = false;
  isLoading = false;

  private searchSubject = new Subject<string>();

  get canManageUsers(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === this.project?.userId;
  }

  ngOnInit() {
    this.loadProjectOwner();
    this.setupSearch();
  }

  private loadProjectOwner() {
    if (this.project?.userId) {
      this.userService.getUser(this.project.userId).subscribe({
        next: (user) => {
          this.projectOwner = user;
        },
        error: (error) => {
          console.error('Error loading project owner:', error);
        },
      });
    }
  }

  private setupSearch() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((email) => {
          if (!email || email.length < 2) {
            return of([]);
          }
          this.isSearching = true;
          return this.userService.searchUsersByEmail(email).pipe(
            catchError((error) => {
              console.error('Error searching users:', error);
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (users) => {
          // Filter out users already in the project
          this.searchResults = users.filter(
            (user) =>
              user.id !== this.project?.userId &&
              !this.project?.sharedUsers?.some((su) => su.id === user.id)
          );
          this.isSearching = false;
        },
        error: () => {
          this.isSearching = false;
        },
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
    this.isLoading = true;

    this.projectService
      .shareProject(this.project.id, { userId: user.id })
      .subscribe({
        next: (result) => {
          // Add the new user to the project's shared users
          if (!this.project.sharedUsers) {
            this.project.sharedUsers = [];
          }
          this.project.sharedUsers.push(result);

          // Clear search
          this.clearSearch();
          this.showAddUser = false;
          this.isLoading = false;

          console.log('Usuario agregado exitosamente');
        },
        error: (error) => {
          console.error('Error sharing project:', error);
          this.isLoading = false;

          // Show error message to user
          alert('Error al agregar usuario al proyecto');
        },
      });
  }

  removeUser(userId: string) {
    if (
      !confirm(
        '¿Estás seguro de que quieres remover este usuario del proyecto?'
      )
    ) {
      return;
    }

    this.isLoading = true;

    this.projectService.removeSharedUser(this.project.id, userId).subscribe({
      next: () => {
        // Remove user from the project's shared users
        if (this.project.sharedUsers) {
          this.project.sharedUsers = this.project.sharedUsers.filter(
            (su) => su.id !== userId
          );
        }
        this.isLoading = false;

        console.log('Usuario removido exitosamente');
      },
      error: (error) => {
        console.error('Error removing user:', error);
        this.isLoading = false;

        // Show error message to user
        alert('Error al remover usuario del proyecto');
      },
    });
  }
}
