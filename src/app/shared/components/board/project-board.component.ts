import { Component, inject, signal, input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, User } from '../../../core/models';
import { CreateTaskModalContentComponent } from '../modals/create-task-modal-content.component';

interface TaskColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="board-container">
      <!-- Board Header -->
      <div class="board-header">
        <div class="board-info">
          <h1 class="board-title">{{ projectName() || 'Project Board' }}</h1>
          <div class="board-meta">
            <div class="team-info">
              <div class="team-avatars">
                <div class="avatar" *ngFor="let member of teamMembers(); let i = index" [style.z-index]="10-i">
                  <img [src]="member.avatar || '/assets/default-avatar.png'" [alt]="member.name">
                </div>
                <button class="add-member-btn">
                  <i class="fas fa-plus"></i>
                  Add New Member
                </button>
              </div>
              <div class="privacy-badge">
                <i class="fas fa-lock"></i>
                Private
              </div>
            </div>
            <div class="board-date">
              Created: {{ createdDate() }}
            </div>
          </div>
        </div>
        <div class="board-actions">
          <button class="btn btn-primary" (click)="openCreateTaskModal()">
            <i class="fas fa-plus"></i>
            Create New Task
          </button>
        </div>
      </div>

      <!-- Board Controls -->
      <div class="board-controls">
        <div class="view-tabs">
          <button class="tab-btn active">
            <i class="fas fa-th-large"></i>
            Overview
          </button>
          <button class="tab-btn">
            <i class="fas fa-chart-line"></i>
            Timeline view
          </button>
          <button class="tab-btn">
            <i class="fas fa-chart-bar"></i>
            Chart view
          </button>
        </div>
        
        <div class="board-filters">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search" [(ngModel)]="searchQuery">
          </div>
          <button class="filter-btn">
            <i class="fas fa-users"></i>
            Members
          </button>
          <button class="filter-btn">
            <i class="fas fa-filter"></i>
            Filter A
          </button>
          <button class="filter-btn">
            <i class="fas fa-filter"></i>
            Filter B
          </button>
          <button class="filter-btn">
            <i class="fas fa-sort"></i>
            Sort
          </button>
          <button class="filter-btn">
            <i class="fas fa-eye-slash"></i>
            Hide
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board" *ngIf="!loading(); else loadingTemplate">
        <div class="board-column" *ngFor="let column of columns()">
          <div class="column-header">
            <div class="column-title">
              <div class="status-indicator" [style.background-color]="column.color"></div>
              <span>{{ column.title }}</span>
              <span class="task-count">{{ column.tasks.length }}</span>
            </div>
            <button class="column-menu">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
          
          <div class="column-content">
            <div class="task-card" *ngFor="let task of column.tasks" (click)="openTaskDetail(task)">
              <div class="task-header">
                <div class="task-priority" [ngClass]="'priority-' + getTaskPriority(task)">
                  {{ getTaskPriority(task).toUpperCase() }}
                </div>
                <button class="task-menu">
                  <i class="fas fa-ellipsis-h"></i>
                </button>
              </div>
              
              <h3 class="task-title">{{ task.title }}</h3>
              <p class="task-description" *ngIf="task.description">{{ task.description }}</p>
              
              <div class="task-preview" *ngIf="hasTaskPreview(task)">
                <div class="preview-mockup" [ngClass]="getTaskMockupClass(task)">
                  <div class="mockup-content">
                    <div class="mockup-elements">
                      <div class="element" *ngFor="let element of getMockupElements(task)"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="task-footer">
                <div class="task-status-badge" [ngClass]="'status-' + column.id.toLowerCase()">
                  {{ column.id === TaskStatus.CREATED ? 'Created' : 
                     column.id === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Active' }}
                  <span class="progress-percent">{{ getTaskProgress(task) }}%</span>
                </div>
                
                <div class="task-meta">
                  <div class="task-stats">
                    <span class="stat">
                      <i class="fas fa-eye"></i>
                      {{ getTaskViews(task) }}
                    </span>
                    <span class="stat">
                      <i class="fas fa-comment"></i>
                      {{ getTaskComments(task) }}
                    </span>
                    <span class="stat">
                      <i class="fas fa-paperclip"></i>
                      {{ getTaskAttachments(task) }}
                    </span>
                  </div>
                  
                  <div class="task-assignees">
                    <div class="assignee-avatar" *ngFor="let assignee of getTaskAssignees(task)">
                      <img [src]="assignee.avatar || '/assets/default-avatar.png'" [alt]="assignee.name">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button class="add-task-btn" (click)="openCreateTaskModal()">
              <i class="fas fa-plus"></i>
              Add new
            </button>
          </div>
        </div>
        
        <button class="add-column-btn">
          <i class="fas fa-plus"></i>
          Add new
        </button>
      </div>

      <!-- Loading Template -->
      <ng-template #loadingTemplate>
        <div class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading board...</p>
        </div>
      </ng-template>
    </div>

  `,
  styleUrls: ['./project-board.component.scss']
})
export class ProjectBoardComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private modalService = inject(NgbModal);

  projectId = input.required<number>();
  projectName = input<string>('');
  
  loading = signal(true);
  searchQuery = signal('');
  TaskStatus = TaskStatus;
  
  tasks = signal<Task[]>([]);
  columns = signal<TaskColumn[]>([]);
  
  teamMembers = signal<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '/assets/avatars/avatar1.jpg' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '/assets/avatars/avatar2.jpg' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', avatar: '/assets/avatars/avatar3.jpg' }
  ]);
  
  createdDate = signal('Feb 23, 2024');

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private async loadTasks(): Promise<void> {
    try {
      const tasks = await this.taskService.getProjectTasks(this.projectId()).toPromise() || [];
      this.tasks.set(tasks);
      this.updateColumns();
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private updateColumns(): void {
    const allTasks = this.tasks();
    
    const columns: TaskColumn[] = [
      {
        id: TaskStatus.CREATED,
        title: 'Created',
        color: '#8b5cf6',
        tasks: allTasks.filter(task => task.status === TaskStatus.CREATED)
      },
      {
        id: TaskStatus.IN_PROGRESS,
        title: 'In Progress',
        color: '#3b82f6',
        tasks: allTasks.filter(task => task.status === TaskStatus.IN_PROGRESS)
      },
      {
        id: TaskStatus.BLOCKED,
        title: 'Blocked',
        color: '#ef4444',
        tasks: allTasks.filter(task => task.status === TaskStatus.BLOCKED)
      },
      {
        id: TaskStatus.TESTING,
        title: 'Testing',
        color: '#f59e0b',
        tasks: allTasks.filter(task => task.status === TaskStatus.TESTING)
      },
      {
        id: TaskStatus.READY_TO_FINISH,
        title: 'Ready to Finish',
        color: '#10b981',
        tasks: allTasks.filter(task => task.status === TaskStatus.READY_TO_FINISH)
      },
      {
        id: TaskStatus.FINISHED,
        title: 'Finished',
        color: '#6b7280',
        tasks: allTasks.filter(task => task.status === TaskStatus.FINISHED)
      }
    ];
    
    this.columns.set(columns);
  }

  openCreateTaskModal(): void {
    const modalRef = this.modalService.open(CreateTaskModalContentComponent);
    modalRef.componentInstance.projectId = this.projectId;
    
    modalRef.result.then((result) => {
      if (result) {
        this.loadTasks(); // Refresh tasks after creation
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  openTaskDetail(task: Task): void {
    // Navigate to task detail or open task modal
    console.log('Open task detail:', task);
  }

  getTaskPriority(task: Task): string {
    // Mock priority based on task ID
    const priorities = ['high', 'medium', 'low'];
    return priorities[task.id % 3];
  }

  hasTaskPreview(task: Task): boolean {
    // Mock condition for showing preview
    return task.id % 2 === 0;
  }

  getTaskMockupClass(task: Task): string {
    const classes = ['dashboard', 'mobile', 'website'];
    return `mockup-${classes[task.id % 3]}`;
  }

  getMockupElements(task: Task): any[] {
    return Array(3).fill(null);
  }

  getTaskProgress(task: Task): number {
    const progresses = [100, 75, 50];
    return progresses[task.id % 3];
  }

  getTaskViews(task: Task): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  getTaskComments(task: Task): number {
    return Math.floor(Math.random() * 10);
  }

  getTaskAttachments(task: Task): number {
    return Math.floor(Math.random() * 5);
  }

  getTaskAssignees(task: Task): User[] {
    const members = this.teamMembers();
    const count = Math.floor(Math.random() * 3) + 1;
    return members.slice(0, count);
  }
}