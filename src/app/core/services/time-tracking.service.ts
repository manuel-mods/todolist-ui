import { Injectable, inject, signal } from '@angular/core';
import { Observable, interval, BehaviorSubject, EMPTY } from 'rxjs';
import { map, tap, switchMap, takeWhile } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  TimeEntryStats,
  TimeTrackingPreferences,
  TimerSession,
  getDurationBetween,
  getTimeEntryStats
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TimeTrackingService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  // Current active timer session
  private activeSessionSubject = new BehaviorSubject<TimerSession | null>(null);
  public activeSession$ = this.activeSessionSubject.asObservable();

  // Timer tick for updating elapsed time
  private timerInterval$ = interval(1000);

  // User preferences
  private preferencesSignal = signal<TimeTrackingPreferences>({
    autoStartTimer: false,
    defaultBillable: true,
    defaultHourlyRate: 50,
    reminderInterval: 30,
    autoStopAfterHours: 8,
    defaultTags: [],
    trackIdleTime: false,
    requireDescription: false
  });

  constructor() {
    // Start timer updates when there's an active session
    this.activeSession$.pipe(
      switchMap(session => 
        session ? this.timerInterval$.pipe(
          takeWhile(() => this.activeSessionSubject.value !== null),
          tap(() => this.updateElapsedTime())
        ) : EMPTY
      )
    ).subscribe();

    // Load user preferences
    this.loadPreferences();
  }

  // Time Entry CRUD Operations
  getTimeEntries(filters?: {
    taskId?: number;
    projectId?: number;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    billableOnly?: boolean;
  }): Observable<TimeEntry[]> {
    const params = new URLSearchParams();
    
    if (filters?.taskId) params.append('taskId', filters.taskId.toString());
    if (filters?.projectId) params.append('projectId', filters.projectId.toString());
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.billableOnly) params.append('billableOnly', 'true');

    const queryString = params.toString();
    const url = queryString ? `/time-entries?${queryString}` : '/time-entries';
    
    return this.api.get<TimeEntry[]>(url);
  }

  getTimeEntry(entryId: string): Observable<TimeEntry> {
    return this.api.get<TimeEntry>(`/time-entries/${entryId}`);
  }

  createTimeEntry(data: CreateTimeEntryRequest): Observable<TimeEntry> {
    const entryData = {
      ...data,
      startTime: data.startTime || new Date(),
      billable: data.billable ?? this.preferencesSignal().defaultBillable,
      hourlyRate: data.hourlyRate ?? this.preferencesSignal().defaultHourlyRate,
      tags: data.tags ?? []
    };

    return this.api.post<TimeEntry>('/time-entries', entryData);
  }

  updateTimeEntry(entryId: string, data: UpdateTimeEntryRequest): Observable<TimeEntry> {
    return this.api.put<TimeEntry>(`/time-entries/${entryId}`, data);
  }

  deleteTimeEntry(entryId: string): Observable<void> {
    return this.api.delete<void>(`/time-entries/${entryId}`);
  }

  // Timer Operations
  startTimer(taskId: number, options?: {
    description?: string;
    billable?: boolean;
    hourlyRate?: number;
    tags?: string[];
  }): Observable<TimerSession> {
    // Stop any existing timer
    if (this.activeSessionSubject.value) {
      this.stopTimer().subscribe();
    }

    const preferences = this.preferencesSignal();
    const session: TimerSession = {
      id: this.generateSessionId(),
      taskId,
      startTime: new Date(),
      description: options?.description,
      billable: options?.billable ?? preferences.defaultBillable,
      hourlyRate: options?.hourlyRate ?? preferences.defaultHourlyRate,
      tags: options?.tags ?? [],
      elapsedTime: 0
    };

    this.activeSessionSubject.next(session);
    this.saveSessionToStorage(session);

    return new Observable(observer => {
      observer.next(session);
      observer.complete();
    });
  }

  stopTimer(): Observable<TimeEntry | null> {
    const session = this.activeSessionSubject.value;
    if (!session) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    const endTime = new Date();
    const duration = getDurationBetween(session.startTime, endTime);

    // Create time entry
    const entryData: CreateTimeEntryRequest = {
      taskId: session.taskId,
      description: session.description,
      startTime: session.startTime,
      billable: session.billable,
      hourlyRate: session.hourlyRate,
      tags: session.tags
    };

    return this.createTimeEntry(entryData).pipe(
      tap(() => {
        this.activeSessionSubject.next(null);
        this.clearSessionFromStorage();
      })
    );
  }

  pauseTimer(): void {
    const session = this.activeSessionSubject.value;
    if (session) {
      // Update elapsed time and stop the timer
      this.updateElapsedTime();
      this.activeSessionSubject.next(null);
      this.clearSessionFromStorage();
    }
  }

  resumeTimer(session: TimerSession): void {
    // Update start time to now minus elapsed time
    const adjustedStartTime = new Date(Date.now() - (session.elapsedTime * 60 * 1000));
    const resumedSession = {
      ...session,
      startTime: adjustedStartTime
    };
    
    this.activeSessionSubject.next(resumedSession);
    this.saveSessionToStorage(resumedSession);
  }

  updateTimerDescription(description: string): void {
    const session = this.activeSessionSubject.value;
    if (session) {
      const updatedSession = { ...session, description };
      this.activeSessionSubject.next(updatedSession);
      this.saveSessionToStorage(updatedSession);
    }
  }

  updateTimerTags(tags: string[]): void {
    const session = this.activeSessionSubject.value;
    if (session) {
      const updatedSession = { ...session, tags };
      this.activeSessionSubject.next(updatedSession);
      this.saveSessionToStorage(updatedSession);
    }
  }

  // Statistics and Reporting
  getTaskTimeStats(taskId: number): Observable<TimeEntryStats> {
    return this.getTimeEntries({ taskId }).pipe(
      map(entries => getTimeEntryStats(entries))
    );
  }

  getProjectTimeStats(projectId: number): Observable<TimeEntryStats> {
    return this.getTimeEntries({ projectId }).pipe(
      map(entries => getTimeEntryStats(entries))
    );
  }

  getUserTimeStats(userId?: string): Observable<TimeEntryStats> {
    const currentUser = this.authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    
    if (!targetUserId) {
      throw new Error('No user ID available');
    }

    return this.getTimeEntries({ userId: targetUserId }).pipe(
      map(entries => getTimeEntryStats(entries))
    );
  }

  // Time Tracking Preferences
  getPreferences(): TimeTrackingPreferences {
    return this.preferencesSignal();
  }

  updatePreferences(preferences: Partial<TimeTrackingPreferences>): Observable<TimeTrackingPreferences> {
    const currentPrefs = this.preferencesSignal();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    
    return this.api.put<TimeTrackingPreferences>('/user/time-tracking-preferences', updatedPrefs).pipe(
      tap(prefs => {
        this.preferencesSignal.set(prefs);
        this.savePreferencesToStorage(prefs);
      })
    );
  }

  // Bulk Operations
  createBulkTimeEntries(entries: CreateTimeEntryRequest[]): Observable<TimeEntry[]> {
    return this.api.post<TimeEntry[]>('/time-entries/bulk', { entries });
  }

  deleteBulkTimeEntries(entryIds: string[]): Observable<void> {
    return this.api.post<void>('/time-entries/bulk-delete', { entryIds });
  }

  // Export Functions
  exportTimeEntries(filters?: {
    taskId?: number;
    projectId?: number;
    startDate?: Date;
    endDate?: Date;
    format?: 'csv' | 'xlsx' | 'pdf';
  }): Observable<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.taskId) params.append('taskId', filters.taskId.toString());
    if (filters?.projectId) params.append('projectId', filters.projectId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    
    const format = filters?.format || 'csv';
    params.append('format', format);

    return this.api.getBlob(`/time-entries/export?${params.toString()}`);
  }

  // Helper Methods
  getCurrentSession(): TimerSession | null {
    return this.activeSessionSubject.value;
  }

  isTimerActive(): boolean {
    return this.activeSessionSubject.value !== null;
  }

  private updateElapsedTime(): void {
    const session = this.activeSessionSubject.value;
    if (session) {
      const elapsed = getDurationBetween(session.startTime, new Date());
      const updatedSession = { ...session, elapsedTime: elapsed };
      this.activeSessionSubject.next(updatedSession);
      this.saveSessionToStorage(updatedSession);
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private saveSessionToStorage(session: TimerSession): void {
    localStorage.setItem('activeTimerSession', JSON.stringify({
      ...session,
      startTime: session.startTime.toISOString()
    }));
  }

  private clearSessionFromStorage(): void {
    localStorage.removeItem('activeTimerSession');
  }

  private loadSessionFromStorage(): TimerSession | null {
    try {
      const stored = localStorage.getItem('activeTimerSession');
      if (stored) {
        const session = JSON.parse(stored);
        return {
          ...session,
          startTime: new Date(session.startTime)
        };
      }
    } catch (error) {
      console.warn('Failed to load timer session from storage:', error);
    }
    return null;
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('timeTrackingPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        this.preferencesSignal.set(prefs);
      }
    } catch (error) {
      console.warn('Failed to load time tracking preferences:', error);
    }

    // Also try to load from backend
    this.api.get<TimeTrackingPreferences>('/user/time-tracking-preferences').subscribe({
      next: (prefs) => {
        this.preferencesSignal.set(prefs);
        this.savePreferencesToStorage(prefs);
      },
      error: (error) => {
        console.warn('Failed to load preferences from backend:', error);
      }
    });
  }

  private savePreferencesToStorage(preferences: TimeTrackingPreferences): void {
    localStorage.setItem('timeTrackingPreferences', JSON.stringify(preferences));
  }

  // Initialize service (restore session if exists)
  initialize(): void {
    const storedSession = this.loadSessionFromStorage();
    if (storedSession) {
      // Check if session is still valid (not too old)
      const elapsed = getDurationBetween(storedSession.startTime, new Date());
      const maxSessionHours = this.preferencesSignal().autoStopAfterHours || 24;
      
      if (elapsed < maxSessionHours * 60) {
        this.activeSessionSubject.next(storedSession);
      } else {
        this.clearSessionFromStorage();
      }
    }
  }
}