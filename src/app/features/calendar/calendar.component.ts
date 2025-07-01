import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, Project, User } from '../../core/models';
import { CreateTaskModalContentComponent } from '../../shared/components/modals/create-task-modal-content.component';
import { CreateProjectModalContentComponent } from '../../shared/components/modals/create-project-modal-content.component';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'task' | 'project';
  status?: string;
  color: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private modalService = inject(NgbModal);

  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  currentView = signal<'month' | 'week' | 'day'>('month');
  loading = signal(true);
  
  calendarDays = signal<CalendarDay[]>([]);
  events = signal<CalendarEvent[]>([]);
  
  selectedProjectId = signal(1); // Default project ID
  
  headerActions: PageHeaderAction[] = [
    {
      label: 'New Task',
      icon: 'fas fa-plus',
      action: () => this.openCreateTaskModal(),
      variant: 'primary'
    },
    {
      label: 'New Project',
      icon: 'fas fa-folder-plus',
      action: () => this.openCreateProjectModal(),
      variant: 'outline'
    }
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  getWeeks(): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    const days = this.calendarDays();
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  }
  
  isLastWeek(weekIndex: number): boolean {
    return weekIndex === this.getWeeks().length - 1;
  }
  
  getTodaysEvents(): CalendarEvent[] {
    const today = new Date();
    return this.getEventsForDate(today);
  }

  ngOnInit(): void {
    this.loadData();
    this.generateCalendar();
  }

  private async loadData(): Promise<void> {
    try {
      const user = await this.authService.currentUser$.pipe(take(1)).toPromise();
      if (!user) return;

      // Load projects and tasks
      const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
      if (!projectsResponse) {
        this.loading.set(false);
        return;
      }
      
      // Combine owned and shared projects
      const projects = [...projectsResponse.owned, ...projectsResponse.shared];
      const allTasks: Task[] = [];

      for (const project of projects) {
        const tasks = await this.taskService.getProjectTasks(project.id).toPromise() || [];
        allTasks.push(...tasks);
      }

      // Convert to calendar events
      const events: CalendarEvent[] = [
        ...projects.map(project => ({
          id: project.id,
          title: project.name,
          date: new Date(project.createdAt || Date.now()),
          type: 'project' as const,
          color: '#667eea'
        })),
        ...allTasks.map(task => ({
          id: task.id,
          title: task.title,
          date: new Date(task.createdAt),
          type: 'task' as const,
          status: task.status,
          color: this.getTaskColor(task.status)
        }))
      ];

      this.events.set(events);
      this.generateCalendar();
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private getTaskColor(status: string): string {
    switch (status) {
      case 'CREATED': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'BLOCKED': return '#ef4444';
      case 'TESTING': return '#f59e0b';
      case 'READY_TO_FINISH': return '#06b6d4';
      case 'FINISHED': return '#10b981';
      default: return '#6b7280';
    }
  }

  private generateCalendar(): void {
    const currentDate = this.currentDate();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const lastDateOfMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDate(date)
      });
    }
    
    // Current month days
    for (let day = 1; day <= lastDateOfMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDate(date)
      });
    }
    
    // Next month days
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        events: this.getEventsForDate(date)
      });
    }
    
    this.calendarDays.set(days);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.events().filter(event => 
      this.isSameDay(event.date, date)
    );
  }

  getCurrentMonthYear(): string {
    return this.currentDate().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.generateCalendar();
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.generateCalendar();
  }

  setView(view: 'month' | 'week' | 'day'): void {
    this.currentView.set(view);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  closeSidebar(): void {
    this.selectedDate.set(null);
  }

  formatSelectedDate(): string {
    const date = this.selectedDate();
    if (!date) return '';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  }

  openEvent(event: CalendarEvent, clickEvent: Event): void {
    clickEvent.stopPropagation();
    // Handle event click
    console.log('Open event:', event);
  }

  openCreateTaskModal(): void {
    const modalRef = this.modalService.open(CreateTaskModalContentComponent);
    modalRef.componentInstance.projectId = this.selectedProjectId;
    
    modalRef.result.then((result) => {
      if (result) {
        this.loadData(); // Refresh data after creation
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  openCreateProjectModal(): void {
    const modalRef = this.modalService.open(CreateProjectModalContentComponent);
    
    modalRef.result.then((result) => {
      if (result) {
        this.loadData(); // Refresh data after creation
      }
    }).catch(() => {
      // Modal dismissed
    });
  }
}