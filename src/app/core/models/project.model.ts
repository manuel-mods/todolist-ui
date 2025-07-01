export interface Project {
  id: number;
  name: string;
  description?: string; // NEW: Project description
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  tasks?: Task[];
  sharedUsers?: User[];
  isShared?: boolean; // Para distinguir proyectos compartidos de propios
  
  // NEW: Additional project metadata
  color?: string;
  icon?: string;
  status?: ProjectStatus;
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export interface CreateProjectRequest {
  name: string;
  description?: string; // NEW: Include description in creation
  userId: string;
  color?: string;
  icon?: string;
}

export interface ShareProjectRequest {
  email: string;
}

import { Task } from './task.model';
import { User } from './user.model';