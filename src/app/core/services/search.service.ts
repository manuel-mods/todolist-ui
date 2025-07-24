import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, Project } from '../models';

export interface SearchTask extends Task {
  project?: {
    id: number;
    name: string;
  };
}

export interface SearchResult {
  tasks: SearchTask[];
  projects: Project[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;

  globalSearch(query: string, limit: number = 20): Observable<SearchResult> {
    return this.http.get<SearchResult>(`${this.apiUrl}/search/global`, {
      params: { q: query, limit: limit.toString() }
    });
  }
}