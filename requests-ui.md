# UI Implementation Plan - TodoList Frontend

## Overview
This document outlines the step-by-step implementation plan for updating the TodoList frontend to use Bootstrap 5 components consistently with a Notion-inspired JIRA-like design system.

## Design System Foundation

### ✅ Completed
- [x] Created `src/themes/theme.scss` with Bootstrap customizations
- [x] Implemented Notion-inspired color palette and spacing
- [x] Added custom utility classes for status badges and Kanban boards
- [x] Updated `src/styles.scss` to import the new theme system

### Theme System Features
- **Bootstrap 5.3** integration with custom variable overrides
- **Notion-inspired color palette** with status-specific colors
- **Custom components**: Task cards, Kanban boards, status badges
- **Responsive design** with mobile-first approach
- **Custom animations** and hover effects

## Implementation Phases

## Phase 1: Core Layout Standardization 

### 1.1 Layout Component Updates
**File:** `src/app/shared/components/layout/layout.component.html`

#### Current Issues
- Custom sidebar implementation
- Inconsistent navigation styling
- Mixed CSS approaches

#### Required Changes
```html
<!-- Replace custom sidebar with Bootstrap nav -->
<div class="d-flex vh-100">
  <!-- Sidebar -->
  <nav class="sidebar-notion flex-shrink-0" style="width: 280px;">
    <div class="p-4">
      <h5 class="text-primary fw-bold mb-4">TodoList</h5>
      <ul class="nav nav-pills flex-column">
        <li class="nav-item">
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
            <i class="fas fa-home"></i>Dashboard
          </a>
        </li>
        <!-- More nav items -->
      </ul>
    </div>
  </nav>
  
  <!-- Main content -->
  <main class="flex-grow-1 overflow-auto">
    <router-outlet></router-outlet>
  </main>
</div>
```

### 1.2 Navigation Improvements
- Implement collapsible sidebar for mobile
- Add breadcrumb navigation
- Standardize active states using Bootstrap classes

## Phase 2: Authentication Pages

### 2.1 Login Component
**File:** `src/app/core/auth/login/login.component.html`

#### Bootstrap Form Implementation
```html
<div class="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
  <div class="card card-notion" style="width: 100%; max-width: 400px;">
    <div class="card-body p-5">
      <div class="text-center mb-4">
        <h2 class="fw-bold text-gray-900">Welcome back</h2>
        <p class="text-muted">Sign in to your account</p>
      </div>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-notion">
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input 
            type="email" 
            class="form-control" 
            id="email"
            formControlName="email"
            placeholder="Enter your email"
            [class.is-invalid]="email?.invalid && email?.touched">
          <div class="invalid-feedback" *ngIf="email?.invalid && email?.touched">
            Please enter a valid email
          </div>
        </div>
        
        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            id="password"
            formControlName="password"
            placeholder="Enter your password"
            [class.is-invalid]="password?.invalid && password?.touched">
          <div class="invalid-feedback" *ngIf="password?.invalid && password?.touched">
            Password is required
          </div>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mb-3"
          [disabled]="loginForm.invalid || isLoading">
          <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          Sign In
        </button>
      </form>
      
      <div class="text-center">
        <a routerLink="/auth/forgot-password" class="text-decoration-none">
          Forgot your password?
        </a>
      </div>
    </div>
  </div>
</div>
```

### 2.2 Register Component
Similar Bootstrap form structure with additional fields

### 2.3 Forgot Password Component
Simplified form with email field and Bootstrap styling

## Phase 3: Dashboard Component

### 3.1 Dashboard Layout
**File:** `src/app/features/dashboard/dashboard.component.html`

#### Bootstrap Grid Implementation
```html
<div class="container-fluid p-4">
  <!-- Header -->
  <div class="row mb-4">
    <div class="col">
      <h1 class="h3 fw-bold text-gray-900">Dashboard</h1>
      <p class="text-muted">Welcome back! Here's what's happening with your projects.</p>
    </div>
    <div class="col-auto">
      <button class="btn btn-primary" (click)="createProject()">
        <i class="fas fa-plus me-2"></i>New Project
      </button>
    </div>
  </div>
  
  <!-- Stats Cards -->
  <div class="row g-4 mb-5">
    <div class="col-sm-6 col-lg-3">
      <div class="card card-notion h-100">
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <div class="bg-primary bg-opacity-10 rounded-circle p-3">
                <i class="fas fa-tasks text-primary"></i>
              </div>
            </div>
            <div class="flex-grow-1 ms-3">
              <div class="fs-6 text-muted">Total Tasks</div>
              <div class="fs-4 fw-bold">{{ totalTasks }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- More stat cards -->
  </div>
  
  <!-- Recent Projects -->
  <div class="row g-4">
    <div class="col-lg-8">
      <div class="card card-notion">
        <div class="card-header">
          <h5 class="mb-0">Recent Projects</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6" *ngFor="let project of recentProjects">
              <div class="card border hover-lift">
                <div class="card-body">
                  <h6 class="card-title">{{ project.name }}</h6>
                  <p class="card-text text-muted small">{{ project.description }}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">{{ project.tasks?.length || 0 }} tasks</span>
                    <small class="text-muted">{{ project.updatedAt | date:'short' }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Activity Feed -->
    <div class="col-lg-4">
      <div class="card card-notion">
        <div class="card-header">
          <h5 class="mb-0">Recent Activity</h5>
        </div>
        <div class="card-body">
          <div class="list-group list-group-flush">
            <div class="list-group-item border-0 px-0" *ngFor="let activity of recentActivity">
              <div class="d-flex">
                <div class="flex-shrink-0">
                  <div class="bg-light rounded-circle p-2">
                    <i class="fas fa-check text-success" style="font-size: 0.75rem;"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <div class="small">{{ activity.description }}</div>
                  <small class="text-muted">{{ activity.createdAt | date:'short' }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Phase 4: Project Management

### 4.1 Project List Component
**File:** `src/app/features/projects/project-list/project-list.component.html`

#### Bootstrap Table Implementation
```html
<div class="container-fluid p-4">
  <div class="row mb-4">
    <div class="col">
      <h1 class="h3 fw-bold">Projects</h1>
      <p class="text-muted">Manage your projects and track progress</p>
    </div>
    <div class="col-auto">
      <button class="btn btn-primary" (click)="createProject()">
        <i class="fas fa-plus me-2"></i>New Project
      </button>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="card card-notion mb-4">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Search</label>
          <input type="text" class="form-control" placeholder="Search projects...">
        </div>
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select class="form-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Sort By</label>
          <select class="form-select">
            <option value="updated">Last Updated</option>
            <option value="created">Created Date</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Projects Grid -->
  <div class="row g-4">
    <div class="col-lg-4 col-md-6" *ngFor="let project of projects">
      <div class="card card-notion h-100 hover-lift">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h5 class="card-title">{{ project.name }}</h5>
            <div class="dropdown">
              <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" (click)="editProject(project)">Edit</a></li>
                <li><a class="dropdown-item" (click)="archiveProject(project)">Archive</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" (click)="deleteProject(project)">Delete</a></li>
              </ul>
            </div>
          </div>
          
          <p class="card-text text-muted small">{{ project.description }}</p>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between text-muted small mb-1">
              <span>Progress</span>
              <span>{{ getCompletionPercentage(project) }}%</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar" [style.width.%]="getCompletionPercentage(project)"></div>
            </div>
          </div>
          
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex gap-2">
              <span class="badge bg-primary">{{ project.tasks?.length || 0 }} tasks</span>
              <span class="badge bg-success">{{ getCompletedTasks(project) }} done</span>
            </div>
            <small class="text-muted">{{ project.updatedAt | date:'short' }}</small>
          </div>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-outline-primary btn-sm w-100" 
                  [routerLink]="['/projects', project.id]">
            View Project
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 4.2 Project Detail Component (Kanban Board)
**File:** `src/app/features/projects/project-detail/project-detail.component.html`

#### JIRA-style Kanban Implementation
```html
<div class="container-fluid p-4">
  <!-- Project Header -->
  <div class="row mb-4">
    <div class="col">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/projects">Projects</a></li>
          <li class="breadcrumb-item active">{{ project?.name }}</li>
        </ol>
      </nav>
      <h1 class="h3 fw-bold">{{ project?.name }}</h1>
      <p class="text-muted">{{ project?.description }}</p>
    </div>
    <div class="col-auto">
      <div class="btn-group">
        <button class="btn btn-primary" (click)="createTask()">
          <i class="fas fa-plus me-2"></i>Add Task
        </button>
        <button class="btn btn-outline-secondary" (click)="showFilters = !showFilters">
          <i class="fas fa-filter me-2"></i>Filters
        </button>
      </div>
    </div>
  </div>
  
  <!-- Filters Panel -->
  <div class="card card-notion mb-4" *ngIf="showFilters">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Assignee</label>
          <select class="form-select form-select-sm">
            <option value="">All Assignees</option>
            <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Priority</label>
          <select class="form-select form-select-sm">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Labels</label>
          <select class="form-select form-select-sm">
            <option value="">All Labels</option>
            <option *ngFor="let label of labels" [value]="label.id">{{ label.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Search</label>
          <input type="text" class="form-control form-control-sm" placeholder="Search tasks...">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Kanban Board -->
  <div class="kanban-board">
    <!-- Created Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>Created</h6>
        <span class="task-count">{{ getTasksByStatus('CREATED').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('CREATED')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-created" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- In Progress Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>In Progress</h6>
        <span class="task-count">{{ getTasksByStatus('IN_PROGRESS').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('IN_PROGRESS')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-in-progress" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Blocked Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>Blocked</h6>
        <span class="task-count">{{ getTasksByStatus('BLOCKED').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('BLOCKED')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-blocked" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Testing Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>Testing</h6>
        <span class="task-count">{{ getTasksByStatus('TESTING').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('TESTING')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-testing" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Ready to Finish Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>Ready to Finish</h6>
        <span class="task-count">{{ getTasksByStatus('READY_TO_FINISH').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('READY_TO_FINISH')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-ready" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Finished Column -->
    <div class="kanban-column">
      <div class="kanban-header">
        <h6>Finished</h6>
        <span class="task-count">{{ getTasksByStatus('FINISHED').length }}</span>
      </div>
      <div class="kanban-tasks">
        <div class="task-card" 
             *ngFor="let task of getTasksByStatus('FINISHED')"
             (click)="openTaskDetail(task)"
             [class.priority-high]="task.priority === 'high'"
             [class.priority-medium]="task.priority === 'medium'"
             [class.priority-low]="task.priority === 'low'">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-description" *ngIf="task.description">{{ task.description }}</div>
          <div class="task-meta">
            <div class="task-labels">
              <span class="badge badge-status status-finished" 
                    *ngFor="let label of task.labels">{{ label }}</span>
            </div>
            <div class="task-assignee" *ngIf="task.assignedTo">
              {{ getAssigneeInitials(task.assignedTo) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Phase 5: Task Management

### 5.1 Task List Component
**File:** `src/app/features/tasks/task-list/task-list.component.html`

#### Bootstrap Table with Advanced Filtering
```html
<div class="container-fluid p-4">
  <div class="row mb-4">
    <div class="col">
      <h1 class="h3 fw-bold">All Tasks</h1>
      <p class="text-muted">View and manage all your tasks across projects</p>
    </div>
    <div class="col-auto">
      <button class="btn btn-primary" (click)="createTask()">
        <i class="fas fa-plus me-2"></i>New Task
      </button>
    </div>
  </div>
  
  <!-- Advanced Filters -->
  <div class="card card-notion mb-4">
    <div class="card-body">
      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <label class="form-label">Project</label>
          <select class="form-select form-select-sm">
            <option value="">All Projects</option>
            <option *ngFor="let project of projects" [value]="project.id">{{ project.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Status</label>
          <select class="form-select form-select-sm">
            <option value="">All Status</option>
            <option value="CREATED">Created</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="TESTING">Testing</option>
            <option value="READY_TO_FINISH">Ready to Finish</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Priority</label>
          <select class="form-select form-select-sm">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Assignee</label>
          <select class="form-select form-select-sm">
            <option value="">All Assignees</option>
            <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Search</label>
          <input type="text" class="form-control form-control-sm" placeholder="Search tasks...">
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm">
          <i class="fas fa-filter me-1"></i>Apply Filters
        </button>
        <button class="btn btn-outline-secondary btn-sm">
          <i class="fas fa-times me-1"></i>Clear All
        </button>
      </div>
    </div>
  </div>
  
  <!-- Tasks Table -->
  <div class="card card-notion">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let task of tasks" (click)="openTaskDetail(task)" style="cursor: pointer;">
            <td>
              <div>
                <div class="fw-medium">{{ task.title }}</div>
                <small class="text-muted" *ngIf="task.description">{{ task.description | slice:0:50 }}...</small>
                <div class="mt-1" *ngIf="task.labels?.length">
                  <span class="badge bg-light text-dark me-1" 
                        *ngFor="let label of task.labels">{{ label }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="badge bg-primary">{{ getProjectName(task.projectId) }}</span>
            </td>
            <td>
              <span class="badge badge-status" 
                    [ngClass]="'status-' + task.status.toLowerCase().replace('_', '-')">
                {{ getStatusLabel(task.status) }}
              </span>
            </td>
            <td>
              <span class="badge" 
                    [ngClass]="{
                      'bg-danger': task.priority === 'high',
                      'bg-warning': task.priority === 'medium',
                      'bg-success': task.priority === 'low'
                    }">
                {{ task.priority | titlecase }}
              </span>
            </td>
            <td>
              <div class="d-flex align-items-center" *ngIf="task.assignedTo">
                <div class="task-assignee me-2">{{ getAssigneeInitials(task.assignedTo) }}</div>
                <span class="small">{{ getAssigneeName(task.assignedTo) }}</span>
              </div>
              <span class="text-muted small" *ngIf="!task.assignedTo">Unassigned</span>
            </td>
            <td>
              <span *ngIf="task.dueDate" [class]="getDueDateClass(task.dueDate)">
                {{ task.dueDate | date:'MMM d' }}
              </span>
              <span class="text-muted" *ngIf="!task.dueDate">No due date</span>
            </td>
            <td>
              <div class="dropdown" (click)="$event.stopPropagation()">
                <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" (click)="editTask(task)">Edit</a></li>
                  <li><a class="dropdown-item" (click)="assignTask(task)">Assign</a></li>
                  <li><a class="dropdown-item" (click)="changeStatus(task)">Change Status</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" (click)="deleteTask(task)">Delete</a></li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Pagination -->
    <div class="card-footer bg-transparent">
      <nav>
        <ngb-pagination 
          [(page)]="currentPage"
          [pageSize]="pageSize"
          [collectionSize]="totalTasks"
          [maxSize]="5"
          [rotate]="true"
          [boundaryLinks]="true">
        </ngb-pagination>
      </nav>
    </div>
  </div>
</div>
```

### 5.2 Task Detail Component
**File:** `src/app/features/tasks/task-detail/task-detail.component.html`

#### JIRA-style Task Detail Modal/Page
```html
<div class="container-fluid p-4">
  <div class="row">
    <!-- Main Content -->
    <div class="col-lg-8">
      <div class="card card-notion">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h4 class="mb-1">{{ task?.title }}</h4>
              <div class="d-flex align-items-center gap-3">
                <span class="badge badge-status" 
                      [ngClass]="'status-' + task?.status?.toLowerCase().replace('_', '-')">
                  {{ getStatusLabel(task?.status) }}
                </span>
                <span class="badge" 
                      [ngClass]="{
                        'bg-danger': task?.priority === 'high',
                        'bg-warning': task?.priority === 'medium',
                        'bg-success': task?.priority === 'low'
                      }">
                  {{ task?.priority | titlecase }}
                </span>
                <small class="text-muted">{{ task?.createdAt | date:'medium' }}</small>
              </div>
            </div>
            <div class="dropdown">
              <button class="btn btn-outline-secondary" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" (click)="editTask()">Edit Task</a></li>
                <li><a class="dropdown-item" (click)="assignTask()">Assign</a></li>
                <li><a class="dropdown-item" (click)="duplicateTask()">Duplicate</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" (click)="deleteTask()">Delete</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <!-- Description -->
          <div class="mb-4">
            <h6 class="fw-bold mb-2">Description</h6>
            <p class="text-muted" *ngIf="task?.description">{{ task.description }}</p>
            <p class="text-muted fst-italic" *ngIf="!task?.description">No description provided</p>
          </div>
          
          <!-- Labels -->
          <div class="mb-4" *ngIf="task?.labels?.length">
            <h6 class="fw-bold mb-2">Labels</h6>
            <div class="d-flex gap-2 flex-wrap">
              <span class="badge bg-light text-dark" *ngFor="let label of task.labels">
                {{ label }}
              </span>
            </div>
          </div>
          
          <!-- Comments Section -->
          <div class="mb-4">
            <h6 class="fw-bold mb-3">Comments</h6>
            
            <!-- Add Comment -->
            <div class="mb-3">
              <div class="form-floating">
                <textarea 
                  class="form-control" 
                  placeholder="Add a comment..."
                  id="newComment"
                  [(ngModel)]="newComment"
                  style="height: 100px;"></textarea>
                <label for="newComment">Add a comment...</label>
              </div>
              <div class="d-flex justify-content-end mt-2">
                <button class="btn btn-primary btn-sm" (click)="addComment()">
                  Add Comment
                </button>
              </div>
            </div>
            
            <!-- Comments List -->
            <div class="list-group list-group-flush" *ngIf="comments?.length">
              <div class="list-group-item border-0 px-0" *ngFor="let comment of comments">
                <div class="d-flex">
                  <div class="flex-shrink-0">
                    <div class="task-assignee">{{ getUserInitials(comment.userId) }}</div>
                  </div>
                  <div class="flex-grow-1 ms-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong class="small">{{ getUserName(comment.userId) }}</strong>
                      <small class="text-muted">{{ comment.createdAt | date:'short' }}</small>
                    </div>
                    <p class="mb-0 small">{{ comment.content }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="text-center text-muted" *ngIf="!comments?.length">
              <i class="fas fa-comments fa-2x mb-2"></i>
              <p>No comments yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Sidebar -->
    <div class="col-lg-4">
      <div class="card card-notion">
        <div class="card-body">
          <h6 class="fw-bold mb-3">Task Details</h6>
          
          <!-- Status -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Status</label>
            <select class="form-select form-select-sm" 
                    [(ngModel)]="task.status" 
                    (change)="updateTaskStatus()">
              <option value="CREATED">Created</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="TESTING">Testing</option>
              <option value="READY_TO_FINISH">Ready to Finish</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>
          
          <!-- Assignee -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Assignee</label>
            <select class="form-select form-select-sm" 
                    [(ngModel)]="task.assignedTo" 
                    (change)="updateTaskAssignee()">
              <option value="">Unassigned</option>
              <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
            </select>
          </div>
          
          <!-- Priority -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Priority</label>
            <select class="form-select form-select-sm" 
                    [(ngModel)]="task.priority" 
                    (change)="updateTaskPriority()">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <!-- Due Date -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Due Date</label>
            <input type="date" 
                   class="form-control form-control-sm" 
                   [(ngModel)]="task.dueDate" 
                   (change)="updateTaskDueDate()">
          </div>
          
          <!-- Project -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Project</label>
            <div class="d-flex align-items-center">
              <span class="badge bg-primary">{{ getProjectName(task?.projectId) }}</span>
            </div>
          </div>
          
          <!-- Reporter -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Reporter</label>
            <div class="d-flex align-items-center">
              <div class="task-assignee me-2">{{ getUserInitials(task?.reporter) }}</div>
              <span class="small">{{ getUserName(task?.reporter) }}</span>
            </div>
          </div>
          
          <!-- Created/Updated -->
          <div class="mb-3">
            <label class="form-label small fw-medium">Created</label>
            <div class="small text-muted">{{ task?.createdAt | date:'medium' }}</div>
          </div>
          
          <div class="mb-3" *ngIf="task?.updatedAt && task?.updatedAt !== task?.createdAt">
            <label class="form-label small fw-medium">Last Updated</label>
            <div class="small text-muted">{{ task?.updatedAt | date:'medium' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Activity Log -->
      <div class="card card-notion mt-3">
        <div class="card-header">
          <h6 class="mb-0 fw-bold">Activity</h6>
        </div>
        <div class="card-body">
          <div class="list-group list-group-flush" *ngIf="activity?.length">
            <div class="list-group-item border-0 px-0" *ngFor="let log of activity">
              <div class="d-flex">
                <div class="flex-shrink-0">
                  <div class="bg-light rounded-circle p-2">
                    <i class="fas fa-history text-muted" style="font-size: 0.75rem;"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <div class="small">{{ log.description }}</div>
                  <small class="text-muted">{{ log.createdAt | date:'short' }}</small>
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-center text-muted" *ngIf="!activity?.length">
            <i class="fas fa-history fa-2x mb-2"></i>
            <p class="small">No activity yet</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Phase 6: Remaining Components

### 6.1 Calendar Component
- Bootstrap calendar grid layout
- Event cards using our card system
- Date picker integration

### 6.2 Account Component
- Bootstrap forms for user profile
- Avatar upload component
- Settings toggles

### 6.3 Settings Component
- Bootstrap form controls
- Toggle switches for preferences
- Notification settings

## Phase 7: Global Components

### 7.1 Task Creation Modal
```html
<!-- Bootstrap Modal -->
<div class="modal fade" id="taskModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form [formGroup]="taskForm" class="form-notion">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Title *</label>
              <input type="text" class="form-control" formControlName="title" placeholder="Enter task title">
            </div>
            <div class="col-12">
              <label class="form-label">Description</label>
              <textarea class="form-control" formControlName="description" rows="3" placeholder="Describe the task..."></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label">Status</label>
              <select class="form-select" formControlName="status">
                <option value="CREATED">Created</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="TESTING">Testing</option>
                <option value="READY_TO_FINISH">Ready to Finish</option>
                <option value="FINISHED">Finished</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Priority</label>
              <select class="form-select" formControlName="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Assignee</label>
              <select class="form-select" formControlName="assignedTo">
                <option value="">Unassigned</option>
                <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Due Date</label>
              <input type="date" class="form-control" formControlName="dueDate">
            </div>
            <div class="col-12">
              <label class="form-label">Labels</label>
              <div class="d-flex gap-2 flex-wrap mb-2">
                <span class="badge bg-light text-dark" *ngFor="let label of selectedLabels">
                  {{ label }}
                  <button type="button" class="btn-close ms-1" (click)="removeLabel(label)"></button>
                </span>
              </div>
              <input type="text" class="form-control" placeholder="Type label and press Enter" (keydown.enter)="addLabel($event)">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveTask()">
          {{ isEditing ? 'Update Task' : 'Create Task' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

## Implementation Timeline

### Week 1: Foundation
- [x] Theme system setup
- [ ] Layout component standardization
- [ ] Authentication pages Bootstrap implementation

### Week 2: Core Features
- [ ] Dashboard component with Bootstrap cards and grid
- [ ] Project list with Bootstrap table/cards
- [ ] Basic task list implementation

### Week 3: Advanced Features
- [ ] Kanban board implementation
- [ ] Task detail modal/page
- [ ] Filtering and search functionality

### Week 4: Polish & Integration
- [ ] Remaining components (Calendar, Account, Settings)
- [ ] Global modals and forms
- [ ] Responsive design testing
- [ ] Performance optimization

### Week 5: Testing & Refinement
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility improvements
- [ ] Final polish and bug fixes

## Next Steps

1. **Start implementing the layout component** with Bootstrap navigation
2. **Update authentication components** to use Bootstrap forms
3. **Implement the dashboard** with Bootstrap cards and grid system
4. **Create the Kanban board** with our custom classes
5. **Add filtering and search** functionality
6. **Test responsiveness** across devices
7. **Optimize performance** and bundle size

This implementation plan provides a comprehensive roadmap for transforming the TodoList UI into a modern, Bootstrap-based, Notion-inspired JIRA-like application while maintaining the existing Angular architecture and adding the requested features.