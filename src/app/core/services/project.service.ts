import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Project, CreateProjectRequest, ShareProjectRequest } from '../models';

interface ProjectsResponse {
  owned: Project[];
  shared: Project[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private api = inject(ApiService);

  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.api.post<Project>('/projects', data);
  }

  getUserProjects(userId: string): Observable<ProjectsResponse> {
    return this.api.get<ProjectsResponse>(`/projects/user/${userId}`);
  }

  getProject(projectId: number): Observable<Project> {
    return this.api.get<Project>(`/projects/${projectId}`);
  }

  shareProject(projectId: number, data: ShareProjectRequest): Observable<any> {
    return this.api.post(`/projects/${projectId}/share`, data);
  }

  removeSharedUser(projectId: number, userId: string): Observable<any> {
    return this.api.delete(`/projects/${projectId}/share/${userId}`);
  }

  deleteProject(projectId: number): Observable<any> {
    return this.api.delete(`/projects/${projectId}`);
  }
}