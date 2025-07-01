import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, Task, TaskStatus, User, Label } from '../../../core/models';
import { PageHeaderComponent, PageHeaderAction } from '../../../shared/components/page-header/page-header.component';
import { KanbanBoardComponent, TaskStatistics } from '../../../shared/components/kanban-board/kanban-board.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, KanbanBoardComponent],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  @ViewChild(KanbanBoardComponent) kanbanBoard!: KanbanBoardComponent;
  
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  project = signal<Project | null>(null);
  projectId = signal<number>(0);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Data for Kanban component
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  showFilters = signal(false);
  
  filters = {
    assignee: '',
    priority: '',
    label: '',
    dueDate: '',
    search: ''
  };
  
  filteredTasks: Task[] = [];
  
  headerActions: PageHeaderAction[] = [
    {
      label: 'New Task',
      icon: 'fas fa-plus',
      action: () => this.createNewTask(),
      variant: 'primary'
    },
    {
      label: 'Filters',
      icon: 'fas fa-filter',
      action: () => this.toggleFilters(),
      variant: 'outline'
    },
    {
      label: 'Share',
      icon: 'fas fa-share-alt',
      action: () => this.shareProject(),
      variant: 'outline'
    }
  ];

  ngOnInit(): void {
    const projectId = this.route.snapshot.params['id'];
    if (projectId) {
      const id = parseInt(projectId);
      this.projectId.set(id);
      this.loadProjectData(id);
    }
  }

  async loadProjectData(projectId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.error.set('User not authenticated');
        this.loading.set(false);
        return;
      }

      // First try to get project data from getUserProjects (includes tasks)
      const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
      if (projectsResponse) {
        // Combine owned and shared projects
        const allProjects = [...projectsResponse.owned, ...projectsResponse.shared];
        const project = allProjects.find(p => p.id === projectId);
        
        if (project) {
          this.project.set(project);
          
          // Use tasks from project data if available
          if (project.tasks) {
            this.tasks.set(project.tasks);
            this.filteredTasks = project.tasks;
          } else {
            // Fallback: load tasks separately if not included
            const tasks = await this.taskService.getProjectTasks(projectId).toPromise();
            if (tasks) {
              this.tasks.set(tasks);
              this.filteredTasks = tasks;
            }
          }
          
          this.loading.set(false);
          return;
        }
      }
      
      // Fallback: if project not found in user projects, try direct getProject call
      const project = await this.projectService.getProject(projectId).toPromise();
      if (project) {
        this.project.set(project);
        
        // Load tasks separately since getProject might not include them
        const tasks = await this.taskService.getProjectTasks(projectId).toPromise();
        if (tasks) {
          this.tasks.set(tasks);
          this.filteredTasks = tasks;
        }
      } else {
        this.error.set('Project not found');
      }
      
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading project data:', error);
      this.error.set('Failed to load project');
      this.loading.set(false);
    }
  }
  
  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  applyFilters(): void {
    let filtered = this.tasks();
    
    if (this.filters.assignee) {
      filtered = filtered.filter(task => task.assignedTo === this.filters.assignee);
    }
    
    if (this.filters.priority) {
      filtered = filtered.filter(task => task.priority === this.filters.priority);
    }
    
    if (this.filters.label) {
      filtered = filtered.filter(task => 
        task.labels && task.labels.some(label => label.includes(this.filters.label))
      );
    }
    
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }
    
    this.filteredTasks = filtered;
  }
  
  clearFilters(): void {
    this.filters = {
      assignee: '',
      priority: '',
      label: '',
      dueDate: '',
      search: ''
    };
    this.applyFilters();
  }

  shareProject(): void {
    // TODO: Implement project sharing
    console.log('Share project clicked');
  }

  getFilteredTasks(): Task[] {
    return this.filteredTasks;
  }

  createNewTask(): void {
    // Use the KanbanBoard component's createTask method
    if (this.kanbanBoard) {
      this.kanbanBoard.createTask();
    }
  }

  onTaskCreated(status?: string): void {
    // Refresh data after task creation
    this.loadProjectData(this.projectId());
  }

  onTaskUpdated(updatedTask: Task): void {
    // Update the task in our local state
    this.tasks.update(tasks => 
      tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
    this.applyFilters();
  }

  onTaskStatusChanged(event: {task: Task, newStatus: TaskStatus, previousStatus: TaskStatus}): void {
    const { task, newStatus, previousStatus } = event;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Update task in local arrays
    const updatedTasks = [...this.tasks()];
    const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
    if (taskIndex > -1) {
      updatedTasks[taskIndex] = { ...task, status: newStatus };
      this.tasks.set(updatedTasks);
      this.applyFilters(); // Refresh filtered tasks
    }

    // Update task status on server
    this.taskService.updateTaskStatus(task.id, { 
      newStatus: newStatus, 
      userId: user.id 
    }).subscribe({
      next: (updatedTask) => {
        // Server confirmed the update
        console.log('Task status updated successfully:', updatedTask);
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
        // Revert the optimistic update on error
        task.status = previousStatus;
        this.loadProjectData(this.projectId());
      }
    });
  }
}