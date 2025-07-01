import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AddCommentRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private api = inject(ApiService);

  createTask(projectId: number, data: CreateTaskRequest): Observable<Task> {
    return this.api.post<Task>(`/tasks/project/${projectId}`, data);
  }

  getProjectTasks(projectId: number): Observable<Task[]> {
    return this.api.get<Task[]>(`/tasks/project/${projectId}`);
  }

  getTask(taskId: number): Observable<Task> {
    return this.api.get<Task>(`/tasks/${taskId}`);
  }

  updateTask(taskId: number, data: UpdateTaskRequest): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}`, data);
  }

  updateTaskStatus(
    taskId: number,
    data: UpdateTaskStatusRequest
  ): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}/status`, data);
  }

  addComment(taskId: number, data: AddCommentRequest): Observable<any> {
    return this.api.post(`/tasks/${taskId}/comment`, data);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}`);
  }
}
