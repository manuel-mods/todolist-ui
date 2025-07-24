import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models';
import { CreateProjectModalContentComponent } from '../../../shared/components/modals/create-project-modal-content.component';
import { PageHeaderComponent, PageHeaderAction } from '../../../shared/components/page-header/page-header.component';
import { ConfirmService } from '../../../shared/services/confirm.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private modalService = inject(NgbModal);
  public authService = inject(AuthService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  viewMode = signal<ViewMode>('grid');
  dropdownOpen = signal<number | null>(null);
  
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  
  headerActions: PageHeaderAction[] = [
    {
      label: 'Vista Cuadrícula',
      icon: 'fas fa-th',
      action: () => this.setViewMode('grid'),
      variant: this.viewMode() === 'grid' ? 'primary' : 'outline'
    },
    {
      label: 'Vista Tabla',
      icon: 'fas fa-list',
      action: () => this.setViewMode('table'),
      variant: this.viewMode() === 'table' ? 'primary' : 'outline'
    },
    {
      label: 'Nuevo Proyecto',
      icon: 'fas fa-plus',
      action: () => this.openCreateProjectModal(),
      variant: 'primary'
    }
  ];

  ngOnInit(): void {
    this.loadViewMode();
    this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = await this.authService.currentUser$.pipe(take(1)).toPromise();
      if (user) {
        this.projectService.getUserProjects(user.id).subscribe({
          next: (projectsResponse) => {
            // Combine owned and shared projects
            const projects = [...projectsResponse.owned, ...projectsResponse.shared];
            this.projects.set(projects);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message);
            this.loading.set(false);
          }
        });
      }
    } catch (err: any) {
      this.error.set('Error al cargar proyectos');
      this.loading.set(false);
    }
  }

  openCreateProjectModal(): void {
    const modalRef = this.modalService.open(CreateProjectModalContentComponent);
    
    modalRef.result.then((result) => {
      if (result) {
        this.loadProjects(); // Refresh projects after creation
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  getOwnedProjects(): Project[] {
    return this.projects().filter(project => !project.isShared);
  }

  getSharedProjects(): Project[] {
    return this.projects().filter(project => project.isShared);
  }

  getTotalTasks(): number {
    return this.projects().reduce((total, project) => {
      return total + (project.tasks?.length || 0);
    }, 0);
  }

  getActiveProjects(): number {
    return this.projects().filter(project => {
      // A project is active if it has tasks that are not finished
      return project.tasks?.some(task => task.status !== 'FINISHED') || false;
    }).length;
  }

  getProjectProgress(project: Project): number {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'FINISHED').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.saveViewMode();
    this.updateHeaderActions();
  }

  private loadViewMode(): void {
    const savedMode = localStorage.getItem('project-list-view-mode') as ViewMode;
    if (savedMode && (savedMode === 'grid' || savedMode === 'table')) {
      this.viewMode.set(savedMode);
      this.updateHeaderActions();
    }
  }

  private saveViewMode(): void {
    localStorage.setItem('project-list-view-mode', this.viewMode());
  }

  private updateHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Vista Cuadrícula',
        icon: 'fas fa-th',
        action: () => this.setViewMode('grid'),
        variant: this.viewMode() === 'grid' ? 'primary' : 'outline'
      },
      {
        label: 'Vista Tabla',
        icon: 'fas fa-list',
        action: () => this.setViewMode('table'),
        variant: this.viewMode() === 'table' ? 'primary' : 'outline'
      },
      {
        label: 'Nuevo Proyecto',
        icon: 'fas fa-plus',
        action: () => this.openCreateProjectModal(),
        variant: 'primary'
      }
    ];
  }

  async deleteProject(project: Project, event: Event): Promise<void> {
    event.stopPropagation();
    
    this.confirmService.confirmWithAction(
      {
        title: 'Eliminar Proyecto',
        message: `¿Estás seguro de que quieres eliminar "${project.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      },
      () => this.projectService.deleteProject(project.id)
    ).subscribe({
      next: (result) => {
        if (result !== null) {
          // Remove project from list
          const currentProjects = this.projects();
          const updatedProjects = currentProjects.filter(p => p.id !== project.id);
          this.projects.set(updatedProjects);
        }
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        this.error.set('Error al eliminar el proyecto. Inténtalo de nuevo.');
      }
    });
  }

  onTableRowClick(event: Event, projectId: number): void {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'BUTTON' && target.tagName !== 'A' && !target.closest('button') && !target.closest('a')) {
      // Navigate to project detail using Angular Router
      this.router.navigate(['/projects', projectId]);
    }
  }

  onCardClick(event: Event, projectId: number): void {
    // Navigate to project detail - this method is for the grid view cards
    this.router.navigate(['/projects', projectId]);
  }

  toggleDropdown(projectId: number, event: Event): void {
    event.stopPropagation();
    if (this.dropdownOpen() === projectId) {
      this.dropdownOpen.set(null);
    } else {
      this.dropdownOpen.set(projectId);
    }
  }

  closeDropdown(): void {
    this.dropdownOpen.set(null);
  }

  isDropdownOpen(projectId: number): boolean {
    return this.dropdownOpen() === projectId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside
    this.closeDropdown();
  }
}