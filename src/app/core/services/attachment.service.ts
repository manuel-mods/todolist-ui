import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  TaskAttachment,
  UploadAttachmentRequest,
  AttachmentUploadResponse,
  AttachmentPreview
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  private api = inject(ApiService);

  // Get all attachments for a task
  getTaskAttachments(taskId: number): Observable<TaskAttachment[]> {
    return this.api.get<{ success: boolean; attachments: TaskAttachment[] }>(`/tasks/${taskId}/attachments`)
      .pipe(map(response => response.attachments));
  }

  // Upload a new attachment
  uploadAttachment(data: UploadAttachmentRequest & { tags?: string }): Observable<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.tags) {
      formData.append('tags', data.tags);
    }
    
    return this.api.post<AttachmentUploadResponse>(`/tasks/${data.taskId}/attachments`, formData);
  }

  // Delete an attachment
  deleteAttachment(attachmentId: string): Observable<void> {
    return this.api.delete<{ success: boolean; message: string }>(`/attachments/${attachmentId}`)
      .pipe(map(() => void 0));
  }

  // Get attachment preview information
  getAttachmentPreview(attachmentId: string): Observable<AttachmentPreview> {
    return this.api.get<AttachmentPreview>(`/attachments/${attachmentId}/preview`);
  }

  // Download attachment
  downloadAttachment(attachmentId: string): Observable<string> {
    return this.api.get<{ success: boolean; downloadUrl: string }>(`/attachments/${attachmentId}/download`)
      .pipe(map(response => response.downloadUrl));
  }

  // Get attachment thumbnail
  getAttachmentThumbnail(attachmentId: string): Observable<Blob> {
    return this.api.getBlob(`/attachments/${attachmentId}/thumbnail`);
  }

  // Upload multiple files at once
  uploadMultipleAttachments(taskId: number, files: File[]): Observable<AttachmentUploadResponse[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    return this.api.post<AttachmentUploadResponse[]>(`/tasks/${taskId}/attachments/bulk`, formData);
  }

  // Update attachment metadata
  updateAttachment(attachmentId: string, data: { description?: string; tags?: string[] }): Observable<TaskAttachment> {
    return this.api.put<{ success: boolean; attachment: any }>(`/attachments/${attachmentId}`, data)
      .pipe(map(response => response.attachment));
  }

  // Get attachment by ID
  getAttachment(attachmentId: string): Observable<TaskAttachment> {
    return this.api.get<{ success: boolean; attachment: TaskAttachment }>(`/attachments/${attachmentId}`)
      .pipe(map(response => response.attachment));
  }

  // Helper method to validate file
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'application/json', 'text/html', 'text/css', 'application/javascript',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 10MB limit` };
    }

    if (!allowedTypes.includes(file.type) && file.type !== '') {
      return { valid: false, error: `File type not supported` };
    }

    return { valid: true };
  }

  // Helper method to get file icon class
  getFileIconClass(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const iconMap: Record<string, string> = {
      // Images
      'jpg': 'fas fa-image text-primary',
      'jpeg': 'fas fa-image text-primary',
      'png': 'fas fa-image text-primary',
      'gif': 'fas fa-image text-primary',
      'svg': 'fas fa-image text-primary',
      'webp': 'fas fa-image text-primary',
      
      // Documents
      'pdf': 'fas fa-file-pdf text-danger',
      'doc': 'fas fa-file-word text-primary',
      'docx': 'fas fa-file-word text-primary',
      'xls': 'fas fa-file-excel text-success',
      'xlsx': 'fas fa-file-excel text-success',
      'ppt': 'fas fa-file-powerpoint text-warning',
      'pptx': 'fas fa-file-powerpoint text-warning',
      'txt': 'fas fa-file-alt text-muted',
      
      // Code
      'js': 'fas fa-file-code text-warning',
      'ts': 'fas fa-file-code text-info',
      'html': 'fas fa-file-code text-danger',
      'css': 'fas fa-file-code text-primary',
      'json': 'fas fa-file-code text-success',
      
      // Archives
      'zip': 'fas fa-file-archive text-warning',
      'rar': 'fas fa-file-archive text-warning',
      '7z': 'fas fa-file-archive text-warning',
      
      // Media
      'mp4': 'fas fa-file-video text-info',
      'avi': 'fas fa-file-video text-info',
      'mov': 'fas fa-file-video text-info',
      'mp3': 'fas fa-file-audio text-success',
      'wav': 'fas fa-file-audio text-success',
      'ogg': 'fas fa-file-audio text-success'
    };

    return iconMap[extension] || 'fas fa-file text-muted';
  }
}