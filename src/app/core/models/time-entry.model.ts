export interface TimeEntry {
  id: string;
  taskId: number;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isActive: boolean; // currently running
  billable: boolean;
  hourlyRate?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // User information for display
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  
  // Task information for display
  task?: {
    id: number;
    title: string;
    projectId: number;
    projectName?: string;
  };
}

export interface CreateTimeEntryRequest {
  taskId: number;
  description?: string;
  startTime?: Date; // If not provided, uses current time
  billable?: boolean;
  hourlyRate?: number;
  tags?: string[];
}

export interface UpdateTimeEntryRequest {
  description?: string;
  endTime?: Date;
  duration?: number;
  billable?: boolean;
  hourlyRate?: number;
  tags?: string[];
}

export interface TimeEntryStats {
  totalTime: number; // in minutes
  billableTime: number; // in minutes
  totalEarnings: number;
  entriesCount: number;
  averageSessionTime: number; // in minutes
  todayTime: number; // in minutes
  thisWeekTime: number; // in minutes
  thisMonthTime: number; // in minutes
}

export interface TimeTrackingPreferences {
  autoStartTimer: boolean;
  defaultBillable: boolean;
  defaultHourlyRate?: number;
  reminderInterval: number; // in minutes, 0 = disabled
  autoStopAfterHours: number; // 0 = disabled
  defaultTags: string[];
  trackIdleTime: boolean;
  requireDescription: boolean;
}

export interface TimerSession {
  id: string;
  taskId: number;
  startTime: Date;
  description?: string;
  billable: boolean;
  hourlyRate?: number;
  tags: string[];
  elapsedTime: number; // in minutes
}

// Helper functions
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

export function formatDetailedDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
}

export function calculateEarnings(duration: number, hourlyRate: number): number {
  return (duration / 60) * hourlyRate;
}

export function getDurationBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return date >= weekStart && date < weekEnd;
}

export function isThisMonth(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

export function getTimeEntryStats(entries: TimeEntry[]): TimeEntryStats {
  const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const billableTime = entries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration, 0);
  const totalEarnings = entries
    .filter(e => e.billable && e.hourlyRate)
    .reduce((sum, entry) => sum + calculateEarnings(entry.duration, entry.hourlyRate!), 0);
  
  const todayEntries = entries.filter(e => isToday(e.createdAt));
  const thisWeekEntries = entries.filter(e => isThisWeek(e.createdAt));
  const thisMonthEntries = entries.filter(e => isThisMonth(e.createdAt));
  
  const todayTime = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const thisWeekTime = thisWeekEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const thisMonthTime = thisMonthEntries.reduce((sum, entry) => sum + entry.duration, 0);
  
  const averageSessionTime = entries.length > 0 ? totalTime / entries.length : 0;
  
  return {
    totalTime,
    billableTime,
    totalEarnings,
    entriesCount: entries.length,
    averageSessionTime,
    todayTime,
    thisWeekTime,
    thisMonthTime
  };
}