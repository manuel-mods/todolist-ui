import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, User } from '../../../core/models';

@Component({
  selector: 'app-invite-users-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-header border-0">
      <h4 class="modal-title fw-bold">
        <i class="fas fa-user-plus me-2"></i>Invite People to {{ project?.name }}
      </h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>

    <div class="modal-body">
      <!-- Invite Form -->
      <div class="invite-section mb-4">
        <h6 class="mb-3">Invite by Email</h6>
        <form [formGroup]="inviteForm" (ngSubmit)="sendInvite()">
          <div class="row g-3">
            <div class="col-md-8">
              <input 
                type="email" 
                class="form-control" 
                formControlName="email"
                placeholder="Enter email address"
                [class.is-invalid]="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched">
              <div class="invalid-feedback" *ngIf="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched">
                Please enter a valid email address
              </div>
            </div>
            <div class="col-md-4">
              <button 
                type="submit" 
                class="btn btn-primary w-100"
                [disabled]="inviteForm.invalid || sending()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="sending()"></span>
                <i class="fas fa-paper-plane me-1" *ngIf="!sending()"></i>
                {{ sending() ? 'Sending...' : 'Send Invite' }}
              </button>
            </div>
          </div>
        </form>
        
        <!-- Success/Error Messages -->
        <div class="alert alert-success mt-3" *ngIf="successMessage()" role="alert">
          <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
        </div>
        <div class="alert alert-danger mt-3" *ngIf="errorMessage()" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>{{ errorMessage() }}
        </div>
      </div>

      <!-- Search Existing Users -->
      <div class="search-section mb-4">
        <h6 class="mb-3">Add Existing Users</h6>
        <div class="search-input-container mb-3">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search users by name or email..."
            [(ngModel)]="searchQuery"
            (input)="searchUsers()"
            [disabled]="searchLoading()">
          <div class="search-loading" *ngIf="searchLoading()">
            <span class="spinner-border spinner-border-sm"></span>
          </div>
        </div>

        <!-- Search Results -->
        <div class="search-results" *ngIf="searchResults().length > 0">
          <div 
            class="user-item" 
            *ngFor="let user of searchResults()" 
            [class.adding]="addingUsers().includes(user.id)">
            <div class="user-info">
              <div class="user-avatar">
                {{ getUserInitials(user) }}
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
              </div>
            </div>
            <button 
              class="btn btn-outline-primary btn-sm"
              (click)="addUserToProject(user)"
              [disabled]="addingUsers().includes(user.id) || isUserAlreadyInProject(user.id)">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="addingUsers().includes(user.id)"></span>
              <i class="fas fa-plus me-1" *ngIf="!addingUsers().includes(user.id) && !isUserAlreadyInProject(user.id)"></i>
              <i class="fas fa-check me-1" *ngIf="!addingUsers().includes(user.id) && isUserAlreadyInProject(user.id)"></i>
              {{ 
                addingUsers().includes(user.id) ? 'Adding...' : 
                isUserAlreadyInProject(user.id) ? 'Added' : 'Add'
              }}
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div class="text-center text-muted py-3" *ngIf="searchQuery && searchResults().length === 0 && !searchLoading()">
          <i class="fas fa-search fa-2x mb-2"></i>
          <p>No users found matching "{{ searchQuery }}"</p>
        </div>
      </div>

      <!-- Current Project Members -->
      <div class="members-section">
        <h6 class="mb-3">Project Members ({{ projectMembers().length }})</h6>
        <div class="members-list">
          <div class="member-item" *ngFor="let member of projectMembers()">
            <div class="user-info">
              <div class="user-avatar">
                {{ getUserInitials(member.user) }}
              </div>
              <div class="user-details">
                <div class="user-name">
                  {{ member.user.name }}
                  <span class="badge bg-primary ms-2" *ngIf="member.user.id === project?.userId">Owner</span>
                </div>
                <div class="user-email">{{ member.user.email }}</div>
              </div>
            </div>
            <button 
              class="btn btn-outline-danger btn-sm"
              *ngIf="member.user.id !== project?.userId && canRemoveUser()"
              (click)="removeUserFromProject(member.user)"
              [disabled]="removingUsers().includes(member.user.id)">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="removingUsers().includes(member.user.id)"></span>
              <i class="fas fa-times me-1" *ngIf="!removingUsers().includes(member.user.id)"></i>
              {{ removingUsers().includes(member.user.id) ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer border-0">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">
        Close
      </button>
    </div>
  `,
  styles: [`
    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-close {
      filter: invert(1);
    }

    .invite-section, .search-section, .members-section {
      border-bottom: 1px solid var(--gray-200);
      padding-bottom: 1rem;
    }

    .search-input-container {
      position: relative;
      
      .search-loading {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .user-item, .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      margin-bottom: 0.5rem;
      transition: all 0.2s ease;

      &:hover {
        background: var(--gray-25);
        border-color: var(--gray-300);
      }

      &.adding {
        background: var(--primary-25);
        border-color: var(--primary-200);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
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

    .user-details {
      .user-name {
        font-weight: 500;
        color: var(--gray-900);
        margin-bottom: 0.125rem;
        display: flex;
        align-items: center;
      }

      .user-email {
        font-size: 0.875rem;
        color: var(--gray-600);
      }
    }

    .search-results {
      max-height: 300px;
      overflow-y: auto;
    }

    .members-list {
      max-height: 200px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .user-item, .member-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .user-info {
        justify-content: center;
      }
    }
  `]
})
export class InviteUsersModalComponent implements OnInit {
  @Input() project?: Project;

  public activeModal = inject(NgbActiveModal);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  searchQuery = '';
  searchResults = signal<User[]>([]);
  projectMembers = signal<Array<{user: User, isOwner: boolean}>>([]);
  
  sending = signal(false);
  searchLoading = signal(false);
  addingUsers = signal<string[]>([]);
  removingUsers = signal<string[]>([]);
  
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjectMembers();
  }

  private loadProjectMembers(): void {
    if (!this.project) return;

    // In a real implementation, this would call the backend
    // For now, we'll use mock data
    setTimeout(() => {
      const mockMembers = [
        {
          user: { id: this.project!.userId, name: 'Project Owner', email: 'owner@example.com' },
          isOwner: true
        }
      ];
      this.projectMembers.set(mockMembers);
    }, 100);
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.clearMessages();

    const email = this.inviteForm.value.email;

    // In a real implementation, this would call the backend
    setTimeout(() => {
      // Simulate success/failure
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (isSuccess) {
        this.successMessage.set(`Invitation sent to ${email} successfully!`);
        this.inviteForm.reset();
      } else {
        this.errorMessage.set('Failed to send invitation. Please try again.');
      }
      
      this.sending.set(false);
      
      // Clear messages after 3 seconds
      setTimeout(() => this.clearMessages(), 3000);
    }, 1000);
  }

  searchUsers(): void {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.searchLoading.set(true);

    // In a real implementation, this would call the backend
    setTimeout(() => {
      const mockUsers: User[] = [
        { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com' },
        { id: 'user4', name: 'Alice Wilson', email: 'alice@example.com' }
      ].filter(user => 
        user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
      );

      this.searchResults.set(mockUsers);
      this.searchLoading.set(false);
    }, 500);
  }

  addUserToProject(user: User): void {
    if (!this.project) return;

    this.addingUsers.update(users => [...users, user.id]);
    this.clearMessages();

    // In a real implementation, this would call the backend
    setTimeout(() => {
      // Simulate success/failure
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      
      if (isSuccess) {
        this.projectMembers.update(members => [
          ...members,
          { user, isOwner: false }
        ]);
        this.successMessage.set(`${user.name} has been added to the project!`);
      } else {
        this.errorMessage.set(`Failed to add ${user.name} to the project.`);
      }
      
      this.addingUsers.update(users => users.filter(id => id !== user.id));
      
      // Clear messages after 3 seconds
      setTimeout(() => this.clearMessages(), 3000);
    }, 1000);
  }

  removeUserFromProject(user: User): void {
    if (!this.project || !confirm(`Remove ${user.name} from the project?`)) return;

    this.removingUsers.update(users => [...users, user.id]);
    this.clearMessages();

    // In a real implementation, this would call the backend
    setTimeout(() => {
      this.projectMembers.update(members => 
        members.filter(member => member.user.id !== user.id)
      );
      this.successMessage.set(`${user.name} has been removed from the project.`);
      this.removingUsers.update(users => users.filter(id => id !== user.id));
      
      // Clear messages after 3 seconds
      setTimeout(() => this.clearMessages(), 3000);
    }, 1000);
  }

  isUserAlreadyInProject(userId: string): boolean {
    return this.projectMembers().some(member => member.user.id === userId);
  }

  canRemoveUser(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === this.project?.userId;
  }

  getUserInitials(user: User): string {
    if (!user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}