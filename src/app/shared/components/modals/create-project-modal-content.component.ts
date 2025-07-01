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
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;

    const currentUser = await this.authService.currentUser$.pipe(take(1)).toPromise();
    if (!currentUser) return;

    this.loading.set(true);
    try {
      const projectData: CreateProjectRequest = {
        name: this.projectForm.get('name')?.value.trim(),
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