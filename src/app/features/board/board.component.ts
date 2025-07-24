import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus, Project, User, Label } from '../../core/models';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';
import { KanbanBoardComponent, TaskStatistics } from '../../shared/components/kanban-board/kanban-board.component';
import { ProjectUsersComponent } from '../../shared/components/project-users/project-users.component';
import { TaskDetailModalComponent } from '../../shared/components/modals/task-detail-modal.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, KanbanBoardComponent, ProjectUsersComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  @ViewChild(KanbanBoardComponent) kanbanBoard!: KanbanBoardComponent;
  @ViewChild('membersOffcanvas') membersOffcanvasTemplate!: TemplateRef<any>;
  
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  private offcanvasService = inject(NgbOffcanvas);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  labels = signal<Label[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showFilters = signal(false);
  selectedProject = signal<Project | null>(null);
  
  // Single project mode (when projectId is provided)
  projectId = signal<number | null>(null);
  isSingleProjectMode = signal(false);

  headerActions: PageHeaderAction[] = [];

  filters = {
    project: '',
    assignee: '',
    priority: '',
    label: '',
    search: ''
  };

  filteredTasks: Task[] = [];

  ngOnInit(): void {
    // Check if we have a project ID in the route
    const projectId = this.route.snapshot.params['id'];
    if (projectId) {
      const id = parseInt(projectId);
      this.projectId.set(id);
      this.isSingleProjectMode.set(true);
    }
    
    this.setupHeaderActions();
    this.loadBoardData();
    
    // Handle task modal opening from route
    const taskId = this.route.snapshot.params['taskId'];
    if (taskId) {
      setTimeout(() => {
        this.openTaskModalById(parseInt(taskId));
      }, 1000); // Wait for data to load
    }
  }

  private setupHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Nueva Tarea',
        icon: 'fas fa-plus',
        action: () => this.createNewTask(),
        variant: 'primary'
      },
      {
        label: 'Filtros',
        icon: 'fas fa-filter',
        action: () => this.toggleFilters(),
        variant: 'outline'
      }
    ];
    
    // Add project-specific actions in single project mode
    if (this.isSingleProjectMode()) {
      this.headerActions.push(
        {
          label: 'Documentación',
          icon: 'fas fa-book',
          action: () => this.openDocumentation(),
          variant: 'outline'
        },
        {
          label: 'Miembros',
          icon: 'fas fa-users',
          action: () => this.openMembersOffcanvas(),
          variant: 'outline'
        }
      );
    }
  }

  async loadBoardData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.loading.set(false);
        return;
      }
      
      if (this.isSingleProjectMode()) {
        // Load single project with tasks
        const projectId = this.projectId()!;
        const [project, tasks] = await Promise.all([
          this.projectService.getProject(projectId).toPromise(),
          this.taskService.getProjectTasks(projectId).toPromise()
        ]);
        
        if (project && tasks) {
          this.projects.set([project]);
          this.selectedProject.set(project);
          this.tasks.set(tasks);
          this.filteredTasks = tasks;
        } else {
          this.error.set('Proyecto no encontrado');
        }
      } else {
        // Load all projects with tasks
        const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
        if (!projectsResponse) {
          this.loading.set(false);
          return;
        }
        
        const projects = [...projectsResponse.owned, ...projectsResponse.shared];
        this.projects.set(projects);
        
        // Extract all tasks from projects
        const allTasks: Task[] = [];
        for (const project of projects) {
          if (project.tasks && project.tasks.length > 0) {
            const tasksWithProject = project.tasks.map(task => ({
              ...task,
              projectName: project.name
            }));
            allTasks.push(...tasksWithProject);
          }
        }
        
        this.tasks.set(allTasks);
        this.filteredTasks = allTasks;
      }
      
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading board data:', error);
      this.error.set('Error al cargar los datos');
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
    
    // Apply selected project filter first (main project selector)
    if (this.selectedProject() && !this.isSingleProjectMode()) {
      filtered = filtered.filter(task => task.projectId === this.selectedProject()!.id);
    }
    
    // Apply additional filters
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

  openTaskModal(task: Task): void {
    // Update URL if in single project mode
    if (this.isSingleProjectMode()) {
      this.router.navigate(['/projects', this.projectId(), 'tasks', task.id]);
    }
    
    const modalRef = this.modalService.open(TaskDetailModalComponent, {
      size: 'fullscreen',
      backdrop: 'static',
      windowClass: 'fullscreen-modal-window'
    });
    
    modalRef.componentInstance.task = { ...task };
    modalRef.componentInstance.projects = this.projects();
    modalRef.componentInstance.users = this.users();
    
    modalRef.result.then((updatedTask) => {
      if (updatedTask) {
        this.onTaskUpdated(updatedTask);
      }
      // Navigate back if in single project mode
      if (this.isSingleProjectMode()) {
        this.router.navigate(['/projects', this.projectId()]);
      }
    }).catch(() => {
      // Modal dismissed
      if (this.isSingleProjectMode()) {
        this.router.navigate(['/projects', this.projectId()]);
      }
    });
  }
  
  openTaskModalById(taskId: number): void {
    const task = this.tasks().find(t => t.id === taskId);
    if (task) {
      this.openTaskModal(task);
    }
  }
  
  openDocumentation(): void {
    const projectId = this.projectId();
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'documentation']);
    }
  }
  
  openMembersOffcanvas(): void {
    const offcanvasRef = this.offcanvasService.open(this.membersOffcanvasTemplate, {
      position: 'end',
      backdrop: true,
      keyboard: true,
      panelClass: 'members-offcanvas'
    });

    offcanvasRef.result.then(
      (result) => {
        if (result) {
          this.loadBoardData();
        }
      },
      (dismissed) => {
        console.log('Members offcanvas dismissed');
      }
    );
  }
  
  onProjectSelected(project: Project | null): void {
    this.selectedProject.set(project);
    this.applyFilters();
  }

  onProjectSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const projectId = selectElement.value;
    
    if (projectId) {
      const project = this.projects().find(p => p.id.toString() === projectId);
      this.onProjectSelected(project || null);
    } else {
      this.onProjectSelected(null);
    }
  }

  clearProjectSelection(): void {
    this.selectedProject.set(null);
    this.applyFilters();
  }
  
  getCurrentProject(): Project | null {
    return this.selectedProject();
  }
  
  getMembersCount(): number {
    const project = this.getCurrentProject();
    if (!project) return 0;
    
    let count = 1; // Owner
    if (project.sharedUsers) {
      count += project.sharedUsers.length;
    }
    return count;
  }
  
  getFilteredTasks(): Task[] {
    return this.filteredTasks;
  }
  
  getPageTitle(): string {
    if (this.isSingleProjectMode()) {
      const project = this.getCurrentProject();
      return project?.name || 'Proyecto';
    }
    return 'Tablero';
  }
  
  getPageSubtitle(): string {
    if (this.isSingleProjectMode()) {
      const project = this.getCurrentProject();
      return project?.description || 'Gestión de tareas del proyecto';
    }
    return 'Vista Kanban de todas las tareas en todos los proyectos';
  }
  
  get completedTasksCount(): number {
    return this.tasks().filter(t => t.status === TaskStatus.FINISHED).length;
  }

  get inProgressTasksCount(): number {
    return this.tasks().filter(t => 
      t.status === TaskStatus.IN_PROGRESS || 
      t.status === TaskStatus.TESTING || 
      t.status === TaskStatus.READY_TO_FINISH
    ).length;
  }

  get pendingTasksCount(): number {
    return this.tasks().filter(t => 
      t.status === TaskStatus.CREATED || 
      t.status === TaskStatus.BLOCKED
    ).length;
  }
}