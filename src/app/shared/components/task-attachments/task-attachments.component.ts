import { Component, Input, Output, EventEmitter, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskAttachment, formatFileSize } from '../../../core/models';
import { AttachmentService } from '../../../core/services/attachment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-task-attachments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-attachments">
      <div class="attachments-header">
        <h6 class="mb-0">
          <i class="fas fa-paperclip me-2"></i>
          Attachments ({{ attachments().length }})
        </h6>
        <div class="header-actions" *ngIf="!readonly">
          <input
            #fileInput
            type="file"
            multiple
            class="d-none"
            (change)="onFileSelected($event)"
            [accept]="acceptedFileTypes">
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm"
            (click)="fileInput.click()"
            [disabled]="uploading()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="uploading()"></span>
            <i class="fas fa-plus me-1" *ngIf="!uploading()"></i>
            {{ uploading() ? 'Uploading...' : 'Add Files' }}
          </button>
        </div>
      </div>

      <!-- Upload Progress -->
      <div class="upload-progress" *ngIf="uploadProgress().length > 0">
        <div 
          class="progress-item"
          *ngFor="let progress of uploadProgress(); trackBy: trackByProgressId">
          
          <div class="progress-info">
            <span class="file-name">{{ progress.fileName }}</span>
            <span class="progress-text">{{ progress.progress }}%</span>
          </div>
          
          <div class="progress-bar-container">
            <div 
              class="progress-bar"
              [style.width.%]="progress.progress"
              [class.progress-error]="progress.error"
              [class.progress-complete]="progress.complete">
            </div>
          </div>
          
          <div class="progress-status">
            <span class="status-text" *ngIf="progress.error" title="{{ progress.error }}">
              <i class="fas fa-exclamation-triangle text-danger"></i>
              Error
            </span>
            <span class="status-text" *ngIf="progress.complete && !progress.error">
              <i class="fas fa-check text-success"></i>
              Complete
            </span>
          </div>
        </div>
      </div>

      <!-- Drag & Drop Area -->
      <div 
        class="drop-area"
        *ngIf="!readonly && attachments().length === 0 && !uploading()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.drag-active]="isDragActive()">
        
        <div class="drop-content">
          <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
          <p class="text-muted mb-2">Drag & drop files here</p>
          <small class="text-muted">or click "Add Files" to browse</small>
          <div class="file-info mt-2">
            <small class="text-muted">
              Supported: Images, Documents, Videos, Audio, Archives (Max 10MB)
            </small>
          </div>
        </div>
      </div>

      <!-- Attachments List -->
      <div class="attachments-list" *ngIf="attachments().length > 0">
        <div 
          class="attachment-item"
          *ngFor="let attachment of attachments(); trackBy: trackByAttachmentId"
          [class.image-attachment]="isImageFile(attachment.fileName)">
          
          <!-- Image Preview -->
          <div class="attachment-preview" *ngIf="isImageFile(attachment.fileName)">
            <img 
              [src]="attachment.thumbnailUrl || attachment.firebaseUrl"
              [alt]="attachment.originalName"
              class="preview-image"
              (error)="onImageError($event)">
          </div>
          
          <!-- File Icon -->
          <div class="attachment-icon" *ngIf="!isImageFile(attachment.fileName)">
            <i [class]="getFileIcon(attachment.fileName)"></i>
          </div>
          
          <div class="attachment-info">
            <div class="attachment-name">{{ attachment.originalName }}</div>
            <div class="attachment-meta">
              <span class="file-size">{{ formatFileSize(attachment.fileSize) }}</span>
              <span class="upload-info">
                Uploaded by {{ attachment.uploadedBy || 'Unknown' }} 
                on {{ formatDate(attachment.createdAt) }}
              </span>
            </div>
          </div>
          
          <div class="attachment-actions">
            <button 
              type="button" 
              class="btn btn-link btn-sm p-1"
              (click)="downloadAttachment(attachment)"
              title="Download">
              <i class="fas fa-download"></i>
            </button>
            
            <button 
              type="button" 
              class="btn btn-link btn-sm p-1"
              (click)="openPreview(attachment)"
              *ngIf="canPreview(attachment)"
              title="Preview">
              <i class="fas fa-eye"></i>
            </button>
            
            <button 
              type="button" 
              class="btn btn-link btn-sm p-1 text-danger"
              (click)="deleteAttachment(attachment)"
              *ngIf="canDelete(attachment)"
              [disabled]="deleting() === attachment.id"
              title="Delete">
              <span class="spinner-border spinner-border-sm" *ngIf="deleting() === attachment.id"></span>
              <i class="fas fa-trash" *ngIf="deleting() !== attachment.id"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <div class="spinner-border spinner-border-sm me-2"></div>
        Loading attachments...
      </div>

      <!-- Error State -->
      <div class="alert alert-danger alert-sm" *ngIf="error()" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
      </div>

      <!-- Preview Modal -->
      <div class="preview-modal" *ngIf="currentPreview()" (click)="closePreview()">
        <div class="preview-content" (click)="$event.stopPropagation()">
          <div class="preview-header">
            <h5>{{ currentPreview()?.originalName }}</h5>
            <button type="button" class="btn-close" (click)="closePreview()"></button>
          </div>
          <div class="preview-body">
            <img 
              [src]="currentPreview()?.firebaseUrl"
              [alt]="currentPreview()?.originalName"
              class="preview-image-full"
              *ngIf="isImageFile(currentPreview()?.fileName || '')">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-attachments {
      .attachments-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--gray-200);

        h6 {
          color: var(--gray-900);
          font-weight: 600;
          display: flex;
          align-items: center;

          i {
            color: var(--primary-500);
          }
        }
      }

      .upload-progress {
        margin-bottom: 1rem;

        .progress-item {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          margin-bottom: 0.5rem;

          .progress-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;

            .file-name {
              font-size: 0.875rem;
              font-weight: 500;
              color: var(--gray-900);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              flex: 1;
              margin-right: 1rem;
            }

            .progress-text {
              font-size: 0.75rem;
              color: var(--gray-600);
              font-weight: 500;
            }
          }

          .progress-bar-container {
            height: 4px;
            background: var(--gray-200);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 0.5rem;

            .progress-bar {
              height: 100%;
              background: var(--primary-500);
              transition: width 0.3s ease;

              &.progress-error {
                background: var(--error-500);
              }

              &.progress-complete {
                background: var(--success-500);
              }
            }
          }

          .progress-status {
            display: flex;
            justify-content: flex-end;

            .status-text {
              font-size: 0.75rem;
              display: flex;
              align-items: center;
              gap: 0.25rem;
            }
          }
        }
      }

      .drop-area {
        border: 2px dashed var(--gray-300);
        border-radius: var(--radius-lg);
        padding: 2rem;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover, &.drag-active {
          border-color: var(--primary-400);
          background: var(--primary-25);
        }

        .drop-content {
          .file-info {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--gray-200);
          }
        }
      }

      .attachments-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        transition: all 0.2s ease;

        &:hover {
          background: var(--gray-25);
          border-color: var(--gray-300);
        }

        &.image-attachment {
          .attachment-preview {
            .preview-image {
              width: 48px;
              height: 48px;
              object-fit: cover;
              border-radius: var(--radius-md);
              border: 1px solid var(--gray-200);
            }
          }
        }

        .attachment-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border-radius: var(--radius-md);
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .attachment-info {
          flex: 1;
          min-width: 0;

          .attachment-name {
            font-weight: 500;
            color: var(--gray-900);
            font-size: 0.875rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 0.25rem;
          }

          .attachment-meta {
            font-size: 0.75rem;
            color: var(--gray-500);

            .file-size {
              font-weight: 500;
              margin-right: 0.5rem;
            }

            .upload-info {
              display: block;
              margin-top: 0.125rem;
            }
          }
        }

        .attachment-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s ease;

          .btn-link {
            color: var(--gray-400);
            font-size: 0.875rem;
            padding: 0.25rem;
            border-radius: var(--radius-sm);

            &:hover {
              color: var(--primary-600);
              background: var(--primary-100);
            }

            &.text-danger:hover {
              color: var(--error-600);
              background: var(--error-100);
            }
          }
        }

        &:hover .attachment-actions {
          opacity: 1;
        }
      }

      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: var(--gray-500);
        font-size: 0.875rem;
      }

      .alert-sm {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        margin-bottom: 0;
      }

      .preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;

        .preview-content {
          background: white;
          border-radius: var(--radius-lg);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;

          .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--gray-200);

            h5 {
              margin: 0;
              font-weight: 600;
              color: var(--gray-900);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .btn-close {
              background: none;
              border: none;
              font-size: 1.25rem;
              cursor: pointer;
              color: var(--gray-500);

              &:hover {
                color: var(--gray-900);
              }
            }
          }

          .preview-body {
            padding: 1rem;
            text-align: center;

            .preview-image-full {
              max-width: 100%;
              max-height: 70vh;
              object-fit: contain;
              border-radius: var(--radius-md);
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .task-attachments {
        .attachment-item {
          .attachment-actions {
            opacity: 1;
          }
        }

        .drop-area {
          padding: 1.5rem 1rem;
        }
      }
    }
  `]
})
export class TaskAttachmentsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() taskId?: number;
  @Input() readonly: boolean = false;

  @Output() attachmentsChanged = new EventEmitter<TaskAttachment[]>();

  private attachmentService = inject(AttachmentService);
  private authService = inject(AuthService);

  attachments = signal<TaskAttachment[]>([]);
  loading = signal(false);
  uploading = signal(false);
  deleting = signal<string | null>(null);
  error = signal<string | null>(null);
  isDragActive = signal(false);
  uploadProgress = signal<Array<{
    id: string;
    fileName: string;
    progress: number;
    complete: boolean;
    error?: string;
  }>>([]);
  currentPreview = signal<TaskAttachment | null>(null);

  acceptedFileTypes = '.jpg,.jpeg,.png,.gif,.svg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.mp4,.avi,.mov,.mp3,.wav,.ogg';

  ngOnInit(): void {
    if (this.taskId) {
      this.loadAttachments();
    }
  }

  private loadAttachments(): void {
    if (!this.taskId) return;

    this.loading.set(true);
    this.error.set(null);

    this.attachmentService.getTaskAttachments(this.taskId).subscribe({
      next: (attachments) => {
        this.attachments.set(attachments);
        this.attachmentsChanged.emit(attachments);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading attachments:', err);
        this.error.set('Failed to load attachments');
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
    
    if (event.dataTransfer?.files) {
      this.uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  private uploadFiles(files: File[]): void {
    if (!this.taskId || files.length === 0) return;

    this.uploading.set(true);
    this.error.set(null);

    // Initialize progress tracking
    const progressItems = files.map(file => ({
      id: this.generateId(),
      fileName: file.name,
      progress: 0,
      complete: false,
      error: undefined as string | undefined
    }));
    this.uploadProgress.set(progressItems);

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      const validation = this.attachmentService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
        // Mark as error in progress
        progressItems[index].error = validation.error;
        progressItems[index].progress = 100;
      }
    });

    if (errors.length > 0) {
      this.error.set(`Some files could not be uploaded: ${errors.join(', ')}`);
    }

    if (validFiles.length === 0) {
      this.uploading.set(false);
      return;
    }

    // Upload valid files
    const uploadPromises = validFiles.map((file, index) => {
      const progressItem = progressItems.find(p => p.fileName === file.name);
      
      return this.attachmentService.uploadAttachment({
        taskId: this.taskId!,
        file: file
      }).toPromise().then(
        (response) => {
          if (progressItem) {
            progressItem.progress = 100;
            progressItem.complete = true;
          }
          return response;
        },
        (error) => {
          if (progressItem) {
            progressItem.error = 'Upload failed';
            progressItem.progress = 100;
          }
          throw error;
        }
      );
    });

    Promise.all(uploadPromises).then(
      (responses) => {
        // Clear progress after delay
        setTimeout(() => {
          this.uploadProgress.set([]);
        }, 2000);

        this.loadAttachments();
        this.uploading.set(false);
      },
      (error) => {
        console.error('Upload error:', error);
        this.uploading.set(false);
      }
    );
  }

  downloadAttachment(attachment: TaskAttachment): void {
    this.attachmentService.downloadAttachment(attachment.id).subscribe({
      next: (downloadUrl) => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = attachment.originalName;
        link.target = '_blank';
        link.click();
      },
      error: (err) => {
        console.error('Download error:', err);
        this.error.set('Failed to download file');
      }
    });
  }

  deleteAttachment(attachment: TaskAttachment): void {
    if (!confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
      return;
    }

    this.deleting.set(attachment.id);
    this.error.set(null);

    this.attachmentService.deleteAttachment(attachment.id).subscribe({
      next: () => {
        this.loadAttachments();
        this.deleting.set(null);
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.error.set('Failed to delete attachment');
        this.deleting.set(null);
      }
    });
  }

  openPreview(attachment: TaskAttachment): void {
    if (this.canPreview(attachment)) {
      this.currentPreview.set(attachment);
    }
  }

  closePreview(): void {
    this.currentPreview.set(null);
  }

  canPreview(attachment: TaskAttachment): boolean {
    return this.isImageFile(attachment.fileName);
  }

  canDelete(attachment: TaskAttachment): boolean {
    if (this.readonly) return false;
    
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === attachment.uploadedBy || this.hasAdminRights();
  }

  private hasAdminRights(): boolean {
    // In a real implementation, check if user is project admin
    return true;
  }

  isImageFile(fileName: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension);
  }

  getFileIcon(fileName: string): string {
    return this.attachmentService.getFileIconClass(fileName);
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  trackByAttachmentId(index: number, attachment: TaskAttachment): string {
    return attachment.id;
  }

  trackByProgressId(index: number, progress: any): string {
    return progress.id;
  }
}