export interface TaskWatcher {
  id: string;
  taskId: number;
  userId: string;
  watchedAt: Date;
  
  // User information for display
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface WatcherNotification {
  id: string;
  type: 'task_updated' | 'task_commented' | 'task_status_changed' | 'task_assigned' | 'task_deleted';
  taskId: number;
  watcherId: string;
  triggeredBy: string;
  details: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

export interface AddWatcherRequest {
  taskId: number;
  userId: string;
}

export interface RemoveWatcherRequest {
  taskId: number;
  userId: string;
}