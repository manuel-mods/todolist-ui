export interface Epic {
  id: string;
  name: string;
  description?: string;
  key: string; // Epic key (e.g., "PROJ-EPIC-1")
  projectId: number;
  status: EpicStatus;
  startDate?: Date;
  endDate?: Date;
  progress: number; // 0-100
  color: string;
  priority: EpicPriority;
  owner?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Calculated fields
  totalStoryPoints?: number;
  completedStoryPoints?: number;
  totalTasks?: number;
  completedTasks?: number;
}

export enum EpicStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EpicPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CreateEpicRequest {
  name: string;
  description?: string;
  projectId: number;
  startDate?: Date;
  endDate?: Date;
  color?: string;
  priority?: EpicPriority;
  owner?: string;
}

export interface UpdateEpicRequest {
  name?: string;
  description?: string;
  status?: EpicStatus;
  startDate?: Date;
  endDate?: Date;
  color?: string;
  priority?: EpicPriority;
  owner?: string;
}