import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreateProjectRequest } from '../../../core/models';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Create New Project</h2>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="modal-form">
          <div class="form-group">
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

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="projectForm.invalid || loading()"
            >
              <i class="fas fa-spinner fa-spin" *ngIf="loading()"></i>
              {{ loading() ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.scss']
})
export class CreateProjectModalComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  isOpen = input.required<boolean>();
  onClose = output<void>();
  onProjectCreated = output<void>();

  loading = signal(false);

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  closeModal(): void {
    this.onClose.emit();
    this.projectForm.reset();
  }

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

      await this.projectService.createProject(projectData).toPromise();
      this.onProjectCreated.emit();
      this.closeModal();
    } catch (error) {
      console.error('Error creating project:', error);
      // TODO: Show error toast
    } finally {
      this.loading.set(false);
    }
  }
}