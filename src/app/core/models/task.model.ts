export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
  history?: TaskHistory[];
  order?: number; // Para ordenamiento dentro de columnas
  
  // NEW JIRA-like fields
  labels?: string[];
  assignedTo?: string;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: number;
  storyPoints?: number;
  epic?: string;
  sprint?: string;
  reporter?: string;
  watchers?: string[];
  
  // Checklist
  checklistItems?: ChecklistItem[];
}

export enum TaskStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  TESTING = 'TESTING',
  READY_TO_FINISH = 'READY_TO_FINISH',
  FINISHED = 'FINISHED',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface TaskHistory {
  id: number;
  taskId: number;
  userId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  labels?: string[];
  assignedTo?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  storyPoints?: number;
  epic?: string;
  sprint?: string;
  parentTaskId?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  labels?: string[];
  assignedTo?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  epic?: string;
  sprint?: string;
  parentTaskId?: number;
}

export interface UpdateTaskStatusRequest {
  newStatus: string;
  userId: string;
}

export interface ReorderTasksRequest {
  taskId: number;
  newStatus: TaskStatus;
  newOrder: number;
  userId: string;
}

export interface AddCommentRequest {
  comment: string;
  userId: string;
}

// Para comentarios de tareas
export interface TaskComment {
  id: number;
  taskId: number;
  changedBy: string;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Label model
export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: Date;
  createdBy: string;
}

// Comment model (enhanced)
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  parentCommentId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Activity log model
export interface ActivityLog {
  id: string;
  type: 'task_created' | 'task_updated' | 'status_changed' | 'assigned' | 'commented' | 'label_added' | 'label_removed';
  entityId: string;
  entityType: 'task' | 'project';
  userId: string;
  details: Record<string, any>;
  createdAt: Date;
  description: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Para campos personalizados (mockup)
export interface CustomField {
  id: number;
  name: string;
  type: 'text' | 'select' | 'checkbox' | 'radio';
  options?: string[]; // Para select y radio
  required: boolean;
  defaultValue?: any;
}

export interface TaskFieldValue {
  fieldId: number;
  taskId: number;
  value: any;
}

// Checklist models
export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  taskId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistProgress {
  totalItems: number;
  completedItems: number;
  progress: number;
}

export interface CreateChecklistItemRequest {
  title: string;
}

export interface UpdateChecklistItemRequest {
  title?: string;
  isCompleted?: boolean;
}

export interface ReorderChecklistRequest {
  itemOrders: { id: string; order: number }[];
}
