import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-search">
      <form [formGroup]="searchForm">
        <div class="search-input-container">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              formControlName="searchTerm"
              [placeholder]="placeholder"
              [disabled]="disabled">
            <button 
              class="btn btn-outline-secondary" 
              type="button"
              [disabled]="disabled"
              (click)="clearSearch()">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </form>

      <!-- Search Results -->
      <div class="search-results" *ngIf="showResults() && searchResults().length > 0">
        <div class="results-list">
          <div 
            class="result-item"
            *ngFor="let user of searchResults(); trackBy: trackByUserId"
            (click)="selectUser(user)">
            <div class="user-avatar">
              {{ getUserInitials(user) }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-email">{{ user.email }}</div>
            </div>
            <div class="select-indicator">
              <i class="fas fa-plus"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div class="no-results" *ngIf="showResults() && searchResults().length === 0 && !searching()">
        <i class="fas fa-search text-muted"></i>
        <p class="text-muted mb-0">No users found</p>
      </div>

      <!-- Loading -->
      <div class="search-loading text-center py-3" *ngIf="searching()">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        <span class="text-muted">Searching...</span>
      </div>

      <!-- Selected Users Display (if multiSelect) -->
      <div class="selected-users mt-3" *ngIf="multiSelect && selectedUsers().length > 0">
        <h6 class="fw-bold mb-2">Selected Users:</h6>
        <div class="d-flex flex-wrap gap-2">
          <div 
            class="selected-user-tag"
            *ngFor="let user of selectedUsers(); trackBy: trackByUserId">
            <div class="user-avatar-small">
              {{ getUserInitials(user) }}
            </div>
            <span class="user-name">{{ user.name }}</span>
            <button 
              type="button" 
              class="btn-remove"
              (click)="removeUser(user)"
              [disabled]="disabled">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-search {
      position: relative;
    }

    .search-input-container {
      .input-group {
        .form-control:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
        }
      }
    }

    .search-results {
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
    }

    .results-list {
      padding: 0.5rem 0;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: var(--transition-base);

      &:hover {
        background: var(--gray-50);
      }

      .user-avatar {
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
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        min-width: 0;

        .user-name {
          font-weight: 500;
          color: var(--gray-900);
          margin-bottom: 0.125rem;
        }

        .user-email {
          font-size: 0.875rem;
          color: var(--gray-500);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .select-indicator {
        color: var(--primary-500);
        opacity: 0.7;
        transition: var(--transition-base);
      }

      &:hover .select-indicator {
        opacity: 1;
      }
    }

    .no-results {
      padding: 2rem 1rem;
      text-align: center;
      
      i {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }
    }

    .selected-users {
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

        .user-avatar-small {
          width: 24px;
          height: 24px;
          background: var(--primary-200);
          color: var(--primary-800);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .user-name {
          font-weight: 500;
        }

        .btn-remove {
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
          transition: var(--transition-base);

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

    @media (max-width: 768px) {
      .search-results {
        position: fixed;
        top: auto;
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        max-height: 50vh;
      }
    }
  `]
})
export class UserSearchComponent implements OnInit {
  @Input() placeholder: string = 'Search users...';
  @Input() multiSelect: boolean = false;
  @Input() disabled: boolean = false;
  @Input() excludeUsers: User[] = [];

  @Output() userSelected = new EventEmitter<User>();
  @Output() userRemoved = new EventEmitter<User>();
  @Output() selectionChanged = new EventEmitter<User[]>();

  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  searchForm: FormGroup = this.fb.group({
    searchTerm: ['']
  });

  searchResults = signal<User[]>([]);
  selectedUsers = signal<User[]>([]);
  searching = signal(false);
  showResults = signal(false);

  ngOnInit(): void {
    // Setup search with debouncing
    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.performSearch(term))
    ).subscribe(results => {
      this.searchResults.set(results);
      this.searching.set(false);
      this.showResults.set(true);
    });
  }

  private performSearch(term: string): Observable<User[]> {
    if (!term || term.trim().length < 2) {
      this.showResults.set(false);
      return of([]);
    }

    this.searching.set(true);
    
    // Mock search implementation
    // In a real app, this would call the UserService
    return new Promise<User[]>((resolve) => {
      setTimeout(() => {
        const mockUsers: User[] = [
          { id: 'user1', email: 'john.doe@example.com', name: 'John Doe' },
          { id: 'user2', email: 'jane.smith@example.com', name: 'Jane Smith' },
          { id: 'user3', email: 'bob.johnson@example.com', name: 'Bob Johnson' },
          { id: 'user4', email: 'alice.brown@example.com', name: 'Alice Brown' },
          { id: 'user5', email: 'charlie.wilson@example.com', name: 'Charlie Wilson' }
        ];

        const filteredUsers = mockUsers.filter(user => {
          const searchTerm = term.toLowerCase();
          const matchesName = user.name?.toLowerCase().includes(searchTerm);
          const matchesEmail = user.email.toLowerCase().includes(searchTerm);
          const isNotExcluded = !this.excludeUsers.find(excludedUser => excludedUser.id === user.id);
          const isNotSelected = !this.selectedUsers().find(selectedUser => selectedUser.id === user.id);
          
          return (matchesName || matchesEmail) && isNotExcluded && isNotSelected;
        });

        resolve(filteredUsers);
      }, 500);
    }).then(results => of(results)).catch(() => of([])) as any;
  }

  selectUser(user: User): void {
    if (this.disabled) return;

    if (this.multiSelect) {
      this.selectedUsers.update(users => [...users, user]);
      this.selectionChanged.emit(this.selectedUsers());
    }
    
    this.userSelected.emit(user);
    
    // Clear search after selection
    this.searchForm.patchValue({ searchTerm: '' });
    this.showResults.set(false);
    this.searchResults.set([]);
  }

  removeUser(user: User): void {
    if (this.disabled) return;

    this.selectedUsers.update(users => users.filter(u => u.id !== user.id));
    this.userRemoved.emit(user);
    this.selectionChanged.emit(this.selectedUsers());
  }

  clearSearch(): void {
    this.searchForm.patchValue({ searchTerm: '' });
    this.showResults.set(false);
    this.searchResults.set([]);
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  getUserInitials(user: User): string {
    if (!user.name) return user.email.substring(0, 2).toUpperCase();
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}