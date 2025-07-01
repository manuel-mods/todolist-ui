import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface PageHeaderAction {
  label: string;
  icon?: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header bg-white border-bottom">
      <div class="container-fluid px-4 py-3">
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" *ngIf="breadcrumbs?.length">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item" 
                *ngFor="let crumb of breadcrumbs; let last = last"
                [class.active]="last">
              <a *ngIf="crumb.link && !last" 
                 [routerLink]="crumb.link" 
                 class="text-decoration-none">{{ crumb.label }}</a>
              <span *ngIf="!crumb.link || last">{{ crumb.label }}</span>
            </li>
          </ol>
        </nav>

        <!-- Header Content -->
        <div class="row align-items-center">
          <div class="col">
            <h1 class="h3 fw-bold mb-1">{{ title }}</h1>
            <p class="text-muted mb-0" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
          <div class="col-auto" *ngIf="actions?.length">
            <div class="btn-group" role="group">
              <button 
                *ngFor="let action of actions"
                type="button" 
                [class]="getButtonClass(action.variant)"
                (click)="action.action()">
                <i *ngIf="action.icon" [class]="action.icon + ' me-2'"></i>
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Additional Content Slot -->
        <div class="mt-3" *ngIf="showFilters">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }

    .breadcrumb {
      margin-bottom: 0.5rem;
      background: transparent;
      padding: 0;
      font-size: 0.875rem;
    }

    .breadcrumb-item + .breadcrumb-item::before {
      content: "/";
      color: #9ca3af;
    }

    .breadcrumb-item a {
      color: #6b7280;
    }

    .breadcrumb-item a:hover {
      color: #2563eb;
    }

    .breadcrumb-item.active {
      color: #374151;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() breadcrumbs?: BreadcrumbItem[];
  @Input() actions?: PageHeaderAction[];
  @Input() showFilters: boolean = false;

  getButtonClass(variant: string = 'primary'): string {
    const baseClass = 'btn';
    switch (variant) {
      case 'primary':
        return `${baseClass} btn-primary`;
      case 'secondary':
        return `${baseClass} btn-secondary`;
      case 'outline':
        return `${baseClass} btn-outline-secondary`;
      case 'danger':
        return `${baseClass} btn-danger`;
      default:
        return `${baseClass} btn-primary`;
    }
  }
}