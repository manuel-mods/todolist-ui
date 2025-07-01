import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskComment, TaskStatus, CustomField, TaskFieldValue } from '../../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  task = signal<Task | null>(null);
  comments = signal<TaskComment[]>([]);
  customFields = signal<CustomField[]>([]);
  fieldValues = signal<TaskFieldValue[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Forms
  commentForm: FormGroup;
  editForm: FormGroup;
  
  // UI State
  isEditing = signal(false);
  showCustomFields = signal(false);
  
  // Mock data for demonstration
  mockComments: TaskComment[] = [
    {
      id: 1,
      taskId: 1,
      changedBy: 'user1',
      changeType: 'comment',
      newValue: 'This task needs to be reviewed before implementation.',
      createdAt: new Date('2024-01-15T10:30:00'),
      user: { id: 'user1', email: 'john@example.com', name: 'John Doe' }
    },
    {
      id: 2,
      taskId: 1,
      changedBy: 'user2',
      changeType: 'status_change',
      oldValue: 'CREATED',
      newValue: 'IN_PROGRESS',
      createdAt: new Date('2024-01-16T09:15:00'),
      user: { id: 'user2', email: 'jane@example.com', name: 'Jane Smith' }
    },
    {
      id: 3,
      taskId: 1,
      changedBy: 'user1',
      changeType: 'comment',
      newValue: 'I\'ve started working on this. Should be done by tomorrow.',
      createdAt: new Date('2024-01-16T14:20:00'),
      user: { id: 'user1', email: 'john@example.com', name: 'John Doe' }
    }
  ];

  mockCustomFields: CustomField[] = [
    {
      id: 1,
      name: 'Priority',
      type: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      defaultValue: 'Medium'
    },
    {
      id: 2,
      name: 'Assignee',
      type: 'select',
      options: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      required: false
    },
    {
      id: 3,
      name: 'Story Points',
      type: 'select',
      options: ['1', '2', '3', '5', '8', '13'],
      required: false
    },
    {
      id: 4,
      name: 'Labels',
      type: 'text',
      required: false
    },
    {
      id: 5,
      name: 'Blocked',
      type: 'checkbox',
      required: false,
      defaultValue: false
    }
  ];

  TaskStatus = TaskStatus;

  constructor() {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    const taskId = this.route.snapshot.params['id'];
    if (taskId) {
      this.loadTask(parseInt(taskId));
    }
    
    // Load mock data
    this.comments.set(this.mockComments);
    this.customFields.set(this.mockCustomFields);
  }

  loadTask(taskId: number): void {
    this.loading.set(true);
    this.taskService.getTask(taskId).subscribe({
      next: (task) => {
        this.task.set(task);
        this.editForm.patchValue({
          title: task.title,
          description: task.description
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']); // Or back to the project
  }

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
      // Reset form when canceling
      const task = this.task();
      if (task) {
        this.editForm.patchValue({
          title: task.title,
          description: task.description
        });
      }
    }
  }

  toggleCustomFields(): void {
    this.showCustomFields.update(v => !v);
  }

  saveTask(): void {
    if (this.editForm.invalid || !this.task()) return;

    const taskId = this.task()!.id;
    this.taskService.updateTask(taskId, this.editForm.value).subscribe({
      next: (updatedTask) => {
        this.task.set(updatedTask);
        this.isEditing.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
      }
    });
  }

  updateStatus(newStatus: TaskStatus): void {
    const task = this.task();
    const user = this.authService.getCurrentUser();
    
    if (!task || !user) return;

    this.taskService.updateTaskStatus(task.id, {
      newStatus: newStatus,
      userId: user.id
    }).subscribe({
      next: (updatedTask) => {
        this.task.set(updatedTask);
        this.addMockStatusChange(task.status, newStatus);
      },
      error: (err) => {
        this.error.set(err.message);
      }
    });
  }

  addComment(): void {
    if (this.commentForm.invalid) return;

    const user = this.authService.getCurrentUser();
    const task = this.task();
    
    if (!user || !task) return;

    const commentData = {
      comment: this.commentForm.value.comment,
      userId: user.id
    };

    this.taskService.addComment(task.id, commentData).subscribe({
      next: () => {
        // Add mock comment to UI
        const newComment: TaskComment = {
          id: this.comments().length + 1,
          taskId: task.id,
          changedBy: user.id,
          changeType: 'comment',
          newValue: commentData.comment,
          createdAt: new Date(),
          user: { id: user.id, email: user.email, name: user.name }
        };
        
        this.comments.update(comments => [...comments, newComment]);
        this.commentForm.reset();
      },
      error: (err) => {
        this.error.set(err.message);
      }
    });
  }

  private addMockStatusChange(oldStatus: string, newStatus: TaskStatus): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const statusComment: TaskComment = {
      id: this.comments().length + 1,
      taskId: this.task()!.id,
      changedBy: user.id,
      changeType: 'status_change',
      oldValue: oldStatus,
      newValue: newStatus,
      createdAt: new Date(),
      user: { id: user.id, email: user.email, name: user.name }
    };

    this.comments.update(comments => [...comments, statusComment]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case TaskStatus.CREATED: return '#f39c12';
      case TaskStatus.IN_PROGRESS: return '#3498db';
      case TaskStatus.FINISHED: return '#27ae60';
      default: return '#95a5a6';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case TaskStatus.CREATED: return 'fa-circle';
      case TaskStatus.IN_PROGRESS: return 'fa-clock';
      case TaskStatus.FINISHED: return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  }

  formatChangeType(changeType: string): string {
    switch (changeType) {
      case 'comment': return 'commented';
      case 'status_change': return 'changed status';
      case 'assignment': return 'assigned';
      default: return changeType;
    }
  }

  getCustomFieldValue(fieldId: number): any {
    const fieldValue = this.fieldValues().find(fv => fv.fieldId === fieldId);
    const field = this.customFields().find(f => f.id === fieldId);
    return fieldValue?.value ?? field?.defaultValue ?? '';
  }

  updateCustomField(fieldId: number, value: any): void {
    // This would normally save to backend
    this.fieldValues.update(values => {
      const existingIndex = values.findIndex(v => v.fieldId === fieldId);
      const newValue = { fieldId, taskId: this.task()!.id, value };
      
      if (existingIndex >= 0) {
        values[existingIndex] = newValue;
        return [...values];
      } else {
        return [...values, newValue];
      }
    });
  }

  trackComment(index: number, comment: TaskComment): number {
    return comment.id;
  }
}