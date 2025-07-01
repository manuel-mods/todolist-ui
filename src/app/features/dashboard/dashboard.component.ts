import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task, TaskStatus, User } from '../../core/models';
import { PageHeaderComponent, PageHeaderAction } from '../../shared/components/page-header/page-header.component';

interface TaskStats {
  total: number;
  priority: number;
  upcoming: number;
  overdue: number;
  pending: number;
}

interface RecentProject {
  id: number;
  name: string;
  description: string;
  category: 'design' | 'business' | 'personal';
  tasksCount: number;
  completedTasks: number;
  updatedAt: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  
  currentUser = signal<User | null>(null);

  taskStats = signal<TaskStats>({
    total: 0,
    priority: 0,
    upcoming: 0,
    overdue: 0,
    pending: 0
  });

  recentProjects = signal<RecentProject[]>([]);
  loading = signal(true);
  recentActivity = signal<any[]>([]);
  
  headerActions: PageHeaderAction[] = [
    {
      label: 'New Project',
      icon: 'fas fa-plus',
      action: () => this.createNewProject(),
      variant: 'primary'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  private async loadDashboardData(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    
    try {
      const projectsResponse = await this.projectService.getUserProjects(user.id).toPromise();
      const allProjects = [...(projectsResponse?.owned || []), ...(projectsResponse?.shared || [])];
      const allTasks: Task[] = [];

      // Extract tasks from projects response
      for (const project of allProjects) {
        if (project.tasks) {
          allTasks.push(...project.tasks);
        }
      }

      this.calculateTaskStats(allTasks);
      this.prepareRecentProjects(allProjects, allTasks);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private calculateTaskStats(tasks: Task[]): void {
    const stats: TaskStats = {
      total: tasks.length,
      priority: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      upcoming: tasks.filter(task => task.status === TaskStatus.CREATED).length,
      overdue: 0, // No overdue logic in current system
      pending: tasks.filter(task => task.status === TaskStatus.CREATED).length
    };

    this.taskStats.set(stats);
  }

  private prepareRecentProjects(projects: Project[], allTasks: Task[]): void {
    const projectsWithStats = projects
      .map(project => {
        const projectTasks = project.tasks || [];
        const completedTasks = projectTasks.filter(task => task.status === TaskStatus.FINISHED).length;
        
        return {
          id: project.id,
          name: project.name,
          description: 'Discover a seamless blend of creativity and efficiency',
          category: this.getProjectCategory(project.name),
          tasksCount: projectTasks.length,
          completedTasks,
          updatedAt: new Date(project.updatedAt || project.createdAt || Date.now())
        } as RecentProject;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3);

    this.recentProjects.set(projectsWithStats);
  }

  private getProjectCategory(projectName: string): 'design' | 'business' | 'personal' {
    const name = projectName.toLowerCase();
    if (name.includes('design') || name.includes('ui') || name.includes('website')) {
      return 'design';
    } else if (name.includes('business') || name.includes('seo') || name.includes('marketing')) {
      return 'business';
    } else {
      return 'personal';
    }
  }
  
  createNewProject(): void {
    // TODO: Implement project creation
    console.log('Create new project');
  }
  
}