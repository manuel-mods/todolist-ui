import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, Project, TaskStatus } from '../../../core/models';
import { PageHeaderComponent, PageHeaderAction } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  allTasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  filteredTasks = signal<Task[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  selectedProject = signal<number | null>(null);
  selectedStatus = signal<TaskStatus | null>(null);
  searchQuery = signal('');
  
  TaskStatus = TaskStatus;
  showFilters = false;
  currentPage = 1;
  pageSize = 20;
  totalTasks = 0;

  filterForm: FormGroup;
  
  headerActions: PageHeaderAction[] = [
    {
      label: 'New Task',
      icon: 'fas fa-plus',
      action: () => this.createTask(),
      variant: 'primary'
    },
    {
      label: 'Filters',
      icon: 'fas fa-filter',
      action: () => this.toggleFilters(),
      variant: 'outline'
    }
  ];

  constructor() {
    this.filterForm = this.fb.group({
      project: [''],
      status: [''],
      priority: [''],
      assignee: [''],
      search: ['']
    });

    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(filters => {
      this.applyFilters(filters);
    });
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  createTask(): void {
    // TODO: Implement task creation
    console.log('Create task');
  }
  
  openTaskDetail(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }
  
  getProjectName(projectId: number): string {
    const project = this.projects().find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }
  
  getStatusLabel(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  getAssigneeInitials(userId: string): string {
    return userId.substring(0, 2).toUpperCase();
  }
  
  getAssigneeName(userId: string): string {
    return 'User ' + userId;
  }
  
  getDueDateClass(dueDate: Date): string {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (due < today) return 'text-danger fw-bold';
    if (due.getTime() - today.getTime() < 24 * 60 * 60 * 1000) return 'text-warning fw-bold';
    return 'text-muted';
  }
  
  getFilteredTasks(): Task[] {
    return this.filteredTasks();
  }
  
  filteredTasksCount(): number {
    return this.filteredTasks().length;
  }
  
  Math = Math;
  
  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks().filter(task => task.status === status);
  }
  
  editTask(task: Task): void {
    // TODO: Implement task editing
    console.log('Edit task:', task);
  }
  
  assignTask(task: Task): void {
    // TODO: Implement task assignment
    console.log('Assign task:', task);
  }
  
  changeStatus(task: Task): void {
    // TODO: Implement status change
    console.log('Change status:', task);
  }
  
  deleteTask(task: Task): void {
    // TODO: Implement task deletion
    console.log('Delete task:', task);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.loading.set(false);
        return;
      }

      // Load projects with tasks included in the response
      const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
      if (!projectsResponse) {
        this.loading.set(false);
        return;
      }

      // Combine owned and shared projects
      const projects = [...projectsResponse.owned, ...projectsResponse.shared];
      this.projects.set(projects);
      
      // Extract all tasks from projects (tasks are already included in the projects response)
      const allTasks: Task[] = [];
      for (const project of projects) {
        if (project.tasks) {
          // Add project name to each task for display
          const tasksWithProjectName = project.tasks.map(task => ({
            ...task,
            projectName: project.name
          }));
          allTasks.push(...tasksWithProjectName);
        }
      }
      
      this.allTasks.set(allTasks);
      this.filteredTasks.set(allTasks);
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading task data:', error);
      this.error.set('Failed to load tasks');
      this.loading.set(false);
    }
  }


  applyFilters(filters: any): void {
    let filtered = [...this.allTasks()];

    // Filter by project
    if (filters.project) {
      filtered = filtered.filter(task => task.projectId === parseInt(filters.project));
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Filter by assignee
    if (filters.assignee) {
      filtered = filtered.filter(task => task.assignedTo === filters.assignee);
    }

    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    this.filteredTasks.set(filtered);
  }

  updateTaskStatus(task: Task, status: TaskStatus): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    this.taskService.updateTaskStatus(task.id, { newStatus: status, userId: user.id }).subscribe({
      next: (updatedTask) => {
        // Update in allTasks while preserving projectName
        this.allTasks.update(tasks => 
          tasks.map(t => t.id === task.id ? { ...updatedTask, projectName: (t as any).projectName } : t)
        );
        
        // Reapply filters
        this.applyFilters(this.filterForm.value);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to update task status');
      }
    });
  }


  clearFilters(): void {
    this.filterForm.reset();
  }
}