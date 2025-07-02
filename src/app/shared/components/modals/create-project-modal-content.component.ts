import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreateProjectRequest } from '../../../core/models';

@Component({
  selector: 'app-create-project-modal-content',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Create New Project</h4>
      <button 
        type="button" 
        class="btn-close" 
        aria-label="Close"
        (click)="activeModal.dismiss()"
      ></button>
    </div>

    <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="mb-3">
          <label for="name" class="form-label">Project Name *</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="form-control"
            [class.is-invalid]="projectForm.get('name')?.invalid && projectForm.get('name')?.touched"
            placeholder="Enter project name"
          >
          <div class="invalid-feedback" *ngIf="projectForm.get('name')?.invalid && projectForm.get('name')?.touched">
            Project name is required
          </div>
        </div>

        <div class="mb-3">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-control"
            rows="3"
            placeholder="Enter project description (optional)"
          ></textarea>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="color" class="form-label">Project Color</label>
              <input
                id="color"
                type="color"
                formControlName="color"
                class="form-control form-control-color"
                title="Choose project color"
              >
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="icon" class="form-label">Icon</label>
              <select id="icon" formControlName="icon" class="form-select">
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
      </div>

      <div class="modal-footer">
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="activeModal.dismiss()"
          [disabled]="loading()"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          [disabled]="projectForm.invalid || loading()"
        >
          <span *ngIf="loading()" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading() ? 'Creating...' : 'Create Project' }}
        </button>
      </div>
    </form>
  `
})
export class CreateProjectModalContentComponent {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  loading = signal(false);

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    color: ['#007bff'],
    icon: ['']
  });

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;

    const currentUser = await this.authService.currentUser$.pipe(take(1)).toPromise();
    if (!currentUser) return;

    this.loading.set(true);
    try {
      const formValue = this.projectForm.value;
      const projectData: CreateProjectRequest = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        color: formValue.color || undefined,
        icon: formValue.icon || undefined,
        userId: currentUser.id
      };

      const newProject = await this.projectService.createProject(projectData).toPromise();
      this.activeModal.close(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
      // TODO: Show error toast
    } finally {
      this.loading.set(false);
    }
  }
}