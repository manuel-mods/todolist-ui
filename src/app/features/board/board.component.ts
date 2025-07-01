import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus, Project, User, Label } from '../../core/models';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { KanbanBoardComponent, TaskStatistics } from '../../shared/components/kanban-board/kanban-board.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, KanbanBoardComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  @ViewChild(KanbanBoardComponent) kanbanBoard!: KanbanBoardComponent;
  
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  labels = signal<Label[]>([]);
  loading = signal(true);
  showFilters = signal(false);

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
    }
  ];

  filters = {
    project: '',
    assignee: '',
    priority: '',
    label: '',
    search: ''
  };

  filteredTasks: Task[] = [];
  
  

  ngOnInit(): void {
    this.loadBoardData();
  }

  private async loadBoardData(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.loading.set(false);
        return;
      }
      
      // Load all projects with tasks already included
      const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
      if (!projectsResponse) {
        this.loading.set(false);
        return;
      }
      
      // Combine owned and shared projects
      const projects = [...projectsResponse.owned, ...projectsResponse.shared];
      this.projects.set(projects);
      
      // Extract all tasks from projects (already included in getUserProjects)
      const allTasks: Task[] = [];
      for (const project of projects) {
        if (project.tasks && project.tasks.length > 0) {
          // Add project name to tasks for display
          const tasksWithProject = project.tasks.map(task => ({
            ...task,
            projectName: project.name
          }));
          allTasks.push(...tasksWithProject);
        }
      }
      
      this.tasks.set(allTasks);
      this.filteredTasks = allTasks;
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading board data:', error);
      this.loading.set(false);
    }
  }




  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.filters = {
      project: '',
      assignee: '',
      priority: '',
      label: '',
      search: ''
    };
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.tasks();
    
    if (this.filters.project) {
      filtered = filtered.filter(task => task.projectId.toString() === this.filters.project);
    }
    
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

  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  createNewTask(): void {
    // Use the KanbanBoard component's createTask method
    if (this.kanbanBoard) {
      this.kanbanBoard.createTask();
    }
  }

  onTaskCreated(status?: string): void {
    // Refresh data after task creation
    this.loadBoardData();
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
        this.loadBoardData();
      }
    });
  }
}