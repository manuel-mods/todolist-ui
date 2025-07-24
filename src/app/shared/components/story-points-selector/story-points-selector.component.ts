import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-story-points-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="story-points-selector">
      <label class="form-label fw-medium" *ngIf="showLabel">{{ label }}</label>
      
      <div class="points-grid">
        <button
          type="button"
          class="point-option"
          [class.selected]="selectedPoints === null"
          [class.disabled]="disabled"
          (click)="selectPoints(null)"
          [disabled]="disabled">
          <span class="point-value">?</span>
          <span class="point-label">Not estimated</span>
        </button>

        <button
          type="button"
          class="point-option"
          *ngFor="let point of fibonacciSequence; trackBy: trackByPoints"
          [class.selected]="selectedPoints === point"
          [class.disabled]="disabled"
          (click)="selectPoints(point)"
          [disabled]="disabled">
          <span class="point-value">{{ point }}</span>
          <span class="point-label" *ngIf="showLabels">{{ getPointLabel(point) }}</span>
        </button>
      </div>

      <div class="estimation-guide" *ngIf="showGuide">
        <div class="guide-header">
          <i class="fas fa-info-circle me-1"></i>
          <strong>Estimation Guide</strong>
        </div>
        <div class="guide-content">
          <div class="guide-item">
            <span class="guide-points">1</span>
            <span class="guide-description">Very small task (< 1 hour)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">2</span>
            <span class="guide-description">Small task (1-2 hours)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">3</span>
            <span class="guide-description">Medium task (2-4 hours)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">5</span>
            <span class="guide-description">Large task (4-8 hours)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">8</span>
            <span class="guide-description">Very large task (1-2 days)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">13</span>
            <span class="guide-description">Extra large (2-3 days)</span>
          </div>
          <div class="guide-item">
            <span class="guide-points">21</span>
            <span class="guide-description">Huge task (> 3 days, consider breaking down)</span>
          </div>
        </div>
      </div>

      <div class="selected-info" *ngIf="selectedPoints !== undefined">
        <div class="info-content">
          <i class="fas fa-chart-line me-2 text-primary"></i>
          <span *ngIf="selectedPoints === null">Task not estimated yet</span>
          <span *ngIf="selectedPoints !== null">
            <strong>{{ selectedPoints }} story points</strong> - {{ getComplexityLabel(selectedPoints) }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .story-points-selector {
      .form-label {
        margin-bottom: 0.75rem;
        display: block;
      }
    }

    .points-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .point-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 0.5rem;
      border: 2px solid var(--gray-300);
      border-radius: var(--radius-lg);
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 60px;

      &:hover:not(.disabled) {
        border-color: var(--primary-400);
        background: var(--primary-25);
        transform: translateY(-1px);
      }

      &.selected {
        border-color: var(--primary-500);
        background: var(--primary-100);
        color: var(--primary-700);
        box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);

        .point-value {
          font-weight: 700;
        }
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--gray-50);
      }

      .point-value {
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      .point-label {
        font-size: 0.7rem;
        color: var(--gray-600);
        text-align: center;
        line-height: 1.2;
      }

      &.selected .point-label {
        color: var(--primary-600);
      }

      // Special styling for "Not estimated" option
      &:first-child {
        .point-value {
          font-size: 1.5rem;
          color: var(--gray-500);
        }

        &.selected .point-value {
          color: var(--primary-600);
        }
      }
    }

    .estimation-guide {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1rem;

      .guide-header {
        display: flex;
        align-items: center;
        color: var(--gray-700);
        font-size: 0.875rem;
        margin-bottom: 0.75rem;

        i {
          color: var(--primary-500);
        }
      }

      .guide-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
      }

      .guide-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;

        .guide-points {
          background: var(--primary-100);
          color: var(--primary-700);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.7rem;
          flex-shrink: 0;
        }

        .guide-description {
          color: var(--gray-600);
          line-height: 1.3;
        }
      }
    }

    .selected-info {
      background: var(--primary-25);
      border: 1px solid var(--primary-200);
      border-radius: var(--radius-md);
      padding: 0.75rem;

      .info-content {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: var(--primary-700);
      }
    }

    @media (max-width: 768px) {
      .points-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.375rem;
      }

      .point-option {
        padding: 0.5rem 0.25rem;
        min-height: 50px;

        .point-value {
          font-size: 1rem;
        }

        .point-label {
          font-size: 0.65rem;
        }
      }

      .estimation-guide {
        .guide-content {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class StoryPointsSelectorComponent {
  @Input() selectedPoints?: number | null;
  @Input() disabled: boolean = false;
  @Input() showLabel: boolean = true;
  @Input() showLabels: boolean = false;
  @Input() showGuide: boolean = false;
  @Input() label: string = 'Story Points';

  @Output() pointsSelected = new EventEmitter<number | null>();

  fibonacciSequence = [1, 2, 3, 5, 8, 13, 21];

  selectPoints(points: number | null): void {
    if (this.disabled) return;
    
    this.selectedPoints = points;
    this.pointsSelected.emit(points);
  }

  getPointLabel(points: number): string {
    switch (points) {
      case 1: return 'XS';
      case 2: return 'S';
      case 3: return 'M';
      case 5: return 'L';
      case 8: return 'XL';
      case 13: return 'XXL';
      case 21: return 'Epic';
      default: return '';
    }
  }

  getComplexityLabel(points: number): string {
    switch (points) {
      case 1: return 'Very simple task';
      case 2: return 'Simple task';
      case 3: return 'Moderate complexity';
      case 5: return 'Complex task';
      case 8: return 'Very complex';
      case 13: return 'Highly complex';
      case 21: return 'Epic-level complexity';
      default: return 'Unknown complexity';
    }
  }

  trackByPoints(index: number, points: number): number {
    return points;
  }
}