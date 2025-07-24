import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { Project, User } from '../../../core/models';
import { UserSearchComponent } from '../../../shared/components/user-search/user-search.component';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserSearchComponent],
  template: `
    <div class="modal-header border-0">
      <h4 class="modal-title fw-bold">
        <i class="fas fa-cog me-2"></i>Project Settings
      </h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>

    <div class="modal-body">
      <!-- Loading State -->
      <div class="text-center py-4" *ngIf="loading()">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Loading project settings...</p>
      </div>

      <!-- Error State -->
      <div class="alert alert-danger" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>

      <!-- Settings Content -->
      <div *ngIf="!loading() && !error()">
        <!-- Tabs -->
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              [class.active]="activeTab() === 'general'"
              (click)="setActiveTab('general')"
              type="button">
              <i class="fas fa-info-circle me-1"></i>General
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              [class.active]="activeTab() === 'team'"
              (click)="setActiveTab('team')"
              type="button">
              <i class="fas fa-users me-1"></i>Team
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              [class.active]="activeTab() === 'advanced'"
              (click)="setActiveTab('advanced')"
              type="button">
              <i class="fas fa-cogs me-1"></i>Advanced
            </button>
          </li>
        </ul>

        <div class="tab-content mt-4">
          <!-- General Settings Tab -->
          <div class="tab-pane" [class.active]="activeTab() === 'general'">
            <form [formGroup]="projectForm">
              <div class="mb-3">
                <label for="projectName" class="form-label fw-medium">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  class="form-control"
                  formControlName="name"
                  placeholder="Enter project name">
              </div>

              <div class="mb-3">
                <label for="projectDescription" class="form-label fw-medium">Description</label>
                <textarea
                  id="projectDescription"
                  class="form-control"
                  rows="3"
                  formControlName="description"
                  placeholder="Enter project description"></textarea>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="projectColor" class="form-label fw-medium">Project Color</label>
                    <input
                      id="projectColor"
                      type="color"
                      class="form-control form-control-color"
                      formControlName="color"
                      title="Choose project color">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="projectIcon" class="form-label fw-medium">Icon</label>
                    <select id="projectIcon" formControlName="icon" class="form-select">
                      <option value="">Select an icon</option>
                      <option value="fas fa-folder">📁 Folder</option>
                      <option value="fas fa-project-diagram">📊 Project</option>
                      <option value="fas fa-code">💻 Code</option>
                      <option value="fas fa-bug">🐛 Bug</option>
                      <option value="fas fa-rocket">🚀 Rocket</option>
                      <option value="fas fa-lightbulb">💡 Idea</option>
                      <option value="fas fa-tasks">✅ Tasks</option>
                      <option value="fas fa-users">👥 Team</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Team Management Tab -->
          <div class="tab-pane" [class.active]="activeTab() === 'team'">
            <!-- Project Owner -->
            <div class="team-section mb-4">
              <h6 class="fw-bold mb-3">
                <i class="fas fa-crown text-warning me-2"></i>Project Owner
              </h6>
              <div class="owner-card">
                <div class="user-avatar">
                  {{ getOwnerInitials() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ projectOwner()?.name || 'Current User' }}</div>
                  <div class="user-email">{{ projectOwner()?.email || 'owner@example.com' }}</div>
                  <div class="user-role">Owner</div>
                </div>
              </div>
            </div>

            <!-- Team Members -->
            <div class="team-section mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0">
                  <i class="fas fa-users text-primary me-2"></i>Team Members ({{ teamMembers().length }})
                </h6>
                <button 
                  class="btn btn-primary btn-sm"
                  (click)="showAddMember = !showAddMember">
                  <i class="fas fa-plus me-1"></i>Add Member
                </button>
              </div>

              <!-- Add Member Section -->
              <div class="add-member-section mb-3" *ngIf="showAddMember">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Add Team Member</h6>
                    <app-user-search
                      [placeholder]="'Search by name or email...'"
                      [multiSelect]="false"
                      [excludeUsers]="getAllProjectUsers()"
                      (userSelected)="addTeamMember($event)">
                    </app-user-search>
                  </div>
                </div>
              </div>

              <!-- Team Members List -->
              <div class="team-members-list">
                <div 
                  class="team-member-card"
                  *ngFor="let member of teamMembers(); trackBy: trackByUserId">
                  <div class="user-avatar">
                    {{ getUserInitials(member) }}
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ member.name }}</div>
                    <div class="user-email">{{ member.email }}</div>
                    <div class="user-role">Member</div>
                  </div>
                  <div class="user-actions">
                    <button 
                      class="btn btn-outline-danger btn-sm"
                      (click)="removeTeamMember(member)"
                      [disabled]="removing()">
                      <span class="spinner-border spinner-border-sm me-1" *ngIf="removing()"></span>
                      <i class="fas fa-times me-1" *ngIf="!removing()"></i>
                      Remove
                    </button>
                  </div>
                </div>

                <!-- Empty State -->
                <div class="empty-state text-center py-4" *ngIf="teamMembers().length === 0">
                  <i class="fas fa-users fa-2x text-muted mb-2"></i>
                  <p class="text-muted mb-0">No team members yet</p>
                  <small class="text-muted">Add team members to collaborate on this project</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Advanced Settings Tab -->
          <div class="tab-pane" [class.active]="activeTab() === 'advanced'">
            <div class="advanced-settings">
              <!-- Archive Project -->
              <div class="setting-item mb-4">
                <div class="setting-header">
                  <h6 class="fw-bold mb-1">Archive Project</h6>
                  <p class="text-muted mb-0">Hide this project from the main view</p>
                </div>
                <div class="setting-action">
                  <button class="btn btn-outline-warning">
                    <i class="fas fa-archive me-1"></i>Archive
                  </button>
                </div>
              </div>

              <!-- Delete Project -->
              <div class="setting-item">
                <div class="setting-header">
                  <h6 class="fw-bold mb-1 text-danger">Delete Project</h6>
                  <p class="text-muted mb-0">Permanently delete this project and all its tasks</p>
                </div>
                <div class="setting-action">
                  <button 
                    class="btn btn-danger"
                    (click)="deleteProject()">
                    <i class="fas fa-trash me-1"></i>Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer border-0">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">
        Cancel
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        (click)="saveSettings()"
        [disabled]="projectForm.invalid || saving()">
        <span class="spinner-border spinner-border-sm me-2" *ngIf="saving()"></span>
        <i class="fas fa-save me-1" *ngIf="!saving()"></i>
        {{ saving() ? 'Saving...' : 'Save Changes' }}
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

    .nav-tabs {
      border-bottom: 1px solid var(--gray-200);

      .nav-link {
        border: none;
        color: var(--gray-600);
        padding: 0.75rem 1rem;
        font-weight: 500;
        transition: var(--transition-base);

        &:hover {
          color: var(--primary-600);
          background: transparent;
        }

        &.active {
          color: var(--primary-600);
          background: transparent;
          border-bottom: 2px solid var(--primary-500);
        }
      }
    }

    .tab-content {
      min-height: 400px;
      max-height: 500px;
      overflow-y: auto;
    }

    .tab-pane {
      display: none;

      &.active {
        display: block;
      }
    }

    .team-section {
      .owner-card,
      .team-member-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-lg);
        background: white;
        margin-bottom: 0.75rem;

        .user-avatar {
          width: 48px;
          height: 48px;
          background: var(--primary-100);
          color: var(--primary-700);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;

          .user-name {
            font-weight: 600;
            color: var(--gray-900);
            margin-bottom: 0.125rem;
          }

          .user-email {
            font-size: 0.875rem;
            color: var(--gray-500);
            margin-bottom: 0.125rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .user-role {
            font-size: 0.75rem;
            color: var(--primary-600);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }

        .user-actions {
          flex-shrink: 0;
        }
      }

      .owner-card .user-avatar {
        background: var(--warning-100);
        color: var(--warning-700);
      }
    }

    .add-member-section {
      .card {
        border: 2px dashed var(--gray-300);
        background: var(--gray-50);
      }
    }

    .empty-state {
      padding: 2rem 1rem;
      
      i {
        opacity: 0.5;
      }
    }

    .advanced-settings {
      .setting-item {
        display: flex;
        justify-content: between;
        align-items: center;
        padding: 1.5rem;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-lg);
        gap: 1rem;

        .setting-header {
          flex: 1;
        }

        .setting-action {
          flex-shrink: 0;
        }
      }
    }

    @media (max-width: 768px) {
      .modal-dialog {
        margin: 0.5rem;
        max-width: calc(100% - 1rem);
      }

      .team-member-card,
      .owner-card {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;

        .user-info {
          text-align: center;
        }
      }

      .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .setting-action {
          align-self: stretch;
        }
      }
    }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  @Input() project!: Project;

  public activeModal = inject(NgbActiveModal);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  saving = signal(false);
  removing = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'general' | 'team' | 'advanced'>('general');

  projectOwner = signal<User | null>(null);
  teamMembers = signal<User[]>([]);
  showAddMember = false;

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    color: ['#007bff'],
    icon: ['']
  });

  ngOnInit(): void {
    this.loadProjectData();
  }

  private loadProjectData(): void {
    if (this.project) {
      this.projectForm.patchValue({
        name: this.project.name,
        description: this.project.description || '',
        color: this.project.color || '#007bff',
        icon: this.project.icon || ''
      });

      // Load project owner
      const currentUser = this.authService.getCurrentUser();
      this.projectOwner.set(currentUser);

      // Load team members (mock data for now)
      setTimeout(() => {
        const mockTeamMembers: User[] = [
          { id: 'user2', email: 'jane.smith@example.com', name: 'Jane Smith' },
          { id: 'user3', email: 'bob.johnson@example.com', name: 'Bob Johnson' }
        ];
        this.teamMembers.set(mockTeamMembers);
      }, 100);
    }
  }

  setActiveTab(tab: 'general' | 'team' | 'advanced'): void {
    this.activeTab.set(tab);
  }

  addTeamMember(user: User): void {
    this.teamMembers.update(members => [...members, user]);
    this.showAddMember = false;
    
    // In a real implementation, this would call the backend
    console.log('Adding team member:', user);
  }

  removeTeamMember(user: User): void {
    const confirmed = confirm(`Remove ${user.name} from the project team?`);
    if (!confirmed) return;

    this.removing.set(true);

    // Mock API call
    setTimeout(() => {
      this.teamMembers.update(members => members.filter(m => m.id !== user.id));
      this.removing.set(false);
    }, 500);
  }

  getAllProjectUsers(): User[] {
    const owner = this.projectOwner();
    const members = this.teamMembers();
    return [...(owner ? [owner] : []), ...members];
  }

  saveSettings(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.projectForm.value;
    const updatedProject = {
      ...this.project,
      name: formValue.name,
      description: formValue.description,
      color: formValue.color,
      icon: formValue.icon
    };

    // Mock API call
    setTimeout(() => {
      this.saving.set(false);
      this.activeModal.close(updatedProject);
    }, 1000);
  }

  deleteProject(): void {
    this.confirmService.confirmWithAction(
      {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${this.project.name}"? This action cannot be undone and will delete all tasks.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      },
      () => this.projectService.deleteProject(this.project.id)
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          this.activeModal.close({ deleted: true });
        }
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        this.error.set('Failed to delete project. Please try again.');
      }
    });
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  getUserInitials(user: User): string {
    if (!user.name) return user.email.substring(0, 2).toUpperCase();
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getOwnerInitials(): string {
    const owner = this.projectOwner();
    return this.getUserInitials(owner || { id: '', email: 'owner@example.com', name: 'Owner' });
  }
}