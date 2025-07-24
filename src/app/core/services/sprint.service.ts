import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Sprint,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintSummary,
  Task,
  BurndownPoint
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class SprintService {
  private api = inject(ApiService);

  getProjectSprints(projectId: number): Observable<Sprint[]> {
    return this.api.get<Sprint[]>(`/projects/${projectId}/sprints`);
  }

  getActiveSprint(projectId: number): Observable<Sprint | null> {
    return this.api.get<Sprint | null>(`/projects/${projectId}/sprints/active`);
  }

  getSprint(sprintId: string): Observable<Sprint> {
    return this.api.get<Sprint>(`/sprints/${sprintId}`);
  }

  createSprint(data: CreateSprintRequest): Observable<Sprint> {
    return this.api.post<Sprint>(`/projects/${data.projectId}/sprints`, data);
  }

  updateSprint(sprintId: string, data: UpdateSprintRequest): Observable<Sprint> {
    return this.api.put<Sprint>(`/sprints/${sprintId}`, data);
  }

  deleteSprint(sprintId: string): Observable<void> {
    return this.api.delete<void>(`/sprints/${sprintId}`);
  }

  startSprint(sprintId: string): Observable<Sprint> {
    return this.api.post<Sprint>(`/sprints/${sprintId}/start`, {});
  }

  completeSprint(sprintId: string): Observable<Sprint> {
    return this.api.post<Sprint>(`/sprints/${sprintId}/complete`, {});
  }

  getSprintTasks(sprintId: string): Observable<Task[]> {
    return this.api.get<Task[]>(`/sprints/${sprintId}/tasks`);
  }

  addTaskToSprint(sprintId: string, taskId: number): Observable<Task> {
    return this.api.post<Task>(`/sprints/${sprintId}/tasks/${taskId}`, {});
  }

  removeTaskFromSprint(sprintId: string, taskId: number): Observable<void> {
    return this.api.delete<void>(`/sprints/${sprintId}/tasks/${taskId}`);
  }

  getSprintSummary(sprintId: string): Observable<SprintSummary> {
    return this.api.get<SprintSummary>(`/sprints/${sprintId}/summary`);
  }

  getBurndownChart(sprintId: string): Observable<BurndownPoint[]> {
    return this.api.get<BurndownPoint[]>(`/sprints/${sprintId}/burndown`);
  }

  getSprintVelocity(projectId: number, sprintCount: number = 5): Observable<{
    sprints: { name: string; velocity: number; date: Date }[];
    averageVelocity: number;
  }> {
    return this.api.get(`/projects/${projectId}/velocity?count=${sprintCount}`);
  }
}