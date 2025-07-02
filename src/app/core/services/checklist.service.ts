import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ChecklistItem,
  ChecklistProgress,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  ReorderChecklistRequest
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  private api = inject(ApiService);

  addChecklistItem(taskId: number, request: CreateChecklistItemRequest): Observable<ChecklistItem> {
    return this.api.post<ChecklistItem>(`/tasks/${taskId}/checklist`, request);
  }

  updateChecklistItem(itemId: string, request: UpdateChecklistItemRequest): Observable<ChecklistItem> {
    return this.api.put<ChecklistItem>(`/tasks/checklist/${itemId}`, request);
  }

  deleteChecklistItem(itemId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/tasks/checklist/${itemId}`);
  }

  reorderChecklistItems(taskId: number, request: ReorderChecklistRequest): Observable<ChecklistItem[]> {
    return this.api.put<ChecklistItem[]>(`/tasks/${taskId}/checklist/reorder`, request);
  }

  getChecklistProgress(taskId: number): Observable<ChecklistProgress> {
    return this.api.get<ChecklistProgress>(`/tasks/${taskId}/checklist/progress`);
  }
}