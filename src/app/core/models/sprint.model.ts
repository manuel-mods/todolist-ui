export interface Sprint {
  id: string;
  name: string;
  description?: string;
  projectId: number;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  goal?: string;
  capacity?: number; // Story points capacity
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Calculated fields
  totalStoryPoints?: number;
  completedStoryPoints?: number;
  totalTasks?: number;
  completedTasks?: number;
  progress?: number; // 0-100
  burndownData?: BurndownPoint[];
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface BurndownPoint {
  date: Date;
  remainingStoryPoints: number;
  idealRemaining: number;
}

export interface CreateSprintRequest {
  name: string;
  description?: string;
  projectId: number;
  startDate: Date;
  endDate: Date;
  goal?: string;
  capacity?: number;
}

export interface UpdateSprintRequest {
  name?: string;
  description?: string;
  status?: SprintStatus;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  capacity?: number;
}

export interface SprintSummary {
  sprint: Sprint;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
  storyPoints: {
    total: number;
    completed: number;
    remaining: number;
  };
  velocity: number; // Story points completed
}