import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Epic,
  CreateEpicRequest,
  UpdateEpicRequest,
  Task
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class EpicService {
  private api = inject(ApiService);

  getProjectEpics(projectId: number): Observable<Epic[]> {
    return this.api.get<Epic[]>(`/projects/${projectId}/epics`);
  }

  getEpic(epicId: string): Observable<Epic> {
    return this.api.get<Epic>(`/epics/${epicId}`);
  }

  createEpic(data: CreateEpicRequest): Observable<Epic> {
    return this.api.post<Epic>(`/projects/${data.projectId}/epics`, data);
  }

  updateEpic(epicId: string, data: UpdateEpicRequest): Observable<Epic> {
    return this.api.put<Epic>(`/epics/${epicId}`, data);
  }

  deleteEpic(epicId: string): Observable<void> {
    return this.api.delete<void>(`/epics/${epicId}`);
  }

  getEpicTasks(epicId: string): Observable<Task[]> {
    return this.api.get<Task[]>(`/epics/${epicId}/tasks`);
  }

  addTaskToEpic(epicId: string, taskId: number): Observable<Task> {
    return this.api.post<Task>(`/epics/${epicId}/tasks/${taskId}`, {});
  }

  removeTaskFromEpic(epicId: string, taskId: number): Observable<void> {
    return this.api.delete<void>(`/epics/${epicId}/tasks/${taskId}`);
  }

  getEpicProgress(epicId: string): Observable<{
    totalStoryPoints: number;
    completedStoryPoints: number;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }> {
    return this.api.get(`/epics/${epicId}/progress`);
  }
}