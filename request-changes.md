# Backend Changes Request - TodoList API

## Overview
This document outlines the required backend changes to support the new JIRA-like functionality with Notion-style UI design for the TodoList application.

## 1. Project Model Enhancements

### Current Project Model
```typescript
interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
}
```

### Required Changes
```typescript
interface Project {
  id: string;
  name: string;
  description: string;          // NEW: Project description field
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  // Additional metadata
  color?: string;               // NEW: Project color theme
  icon?: string;                // NEW: Project icon (emoji or icon name)
  status: 'active' | 'archived' | 'draft'; // NEW: Project status
}
```

### API Endpoint Changes Required
1. **POST /api/projects** - Include description in creation
2. **PUT /api/projects/{id}** - Support description updates
3. **GET /api/projects** - Return description in response

## 2. Task Model Enhancements

### Current Task Model
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Required Changes
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'CREATED' | 'IN_PROGRESS' | 'BLOCKED' | 'TESTING' | 'READY_TO_FINISH' | 'FINISHED'; // UPDATED: New status workflow
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // NEW FIELDS
  labels: string[];             // NEW: Task labels/tags
  assignedTo?: string;          // NEW: User ID of assigned user
  priority: 'low' | 'medium' | 'high'; // NEW: Task priority
  dueDate?: Date;               // NEW: Due date for task
  estimatedHours?: number;      // NEW: Time estimation
  actualHours?: number;         // NEW: Time tracking
  parentTaskId?: string;        // NEW: Support for subtasks
  
  // JIRA-like fields
  storyPoints?: number;         // NEW: Story points for estimation
  epic?: string;                // NEW: Epic association
  sprint?: string;              // NEW: Sprint association
  
  // Metadata
  reporter: string;             // NEW: User who created the task
  watchers: string[];           // NEW: Users watching the task
}
```

### API Endpoint Changes Required

#### 1. Task Creation
```
POST /api/tasks/project/{projectId}
```
**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "labels": ["string"],
  "assignedTo": "string",
  "priority": "low|medium|high",
  "dueDate": "ISO date string",
  "estimatedHours": "number",
  "storyPoints": "number",
  "epic": "string",
  "sprint": "string",
  "parentTaskId": "string"
}
```

#### 2. Task Update
```
PUT /api/tasks/{id}
```
**Request Body:** (same as POST, all fields optional)

#### 3. Task Status Update
```
PUT /api/tasks/{id}/status
```
**Request Body:**
```json
{
  "status": "CREATED|IN_PROGRESS|BLOCKED|TESTING|READY_TO_FINISH|FINISHED",
  "comment": "string" // Optional comment for status change
}
```

#### 4. Task Assignment
```
PUT /api/tasks/{id}/assign
```
**Request Body:**
```json
{
  "assignedTo": "string", // User ID
  "comment": "string"     // Optional comment
}
```

#### 5. Task Labels Management
```
POST /api/tasks/{id}/labels
DELETE /api/tasks/{id}/labels/{label}
```

## 3. User Model Enhancements

### Current User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
```

### Required Changes
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  
  // NEW FIELDS
  role: 'admin' | 'manager' | 'developer' | 'viewer'; // NEW: Role-based permissions
  department?: string;        // NEW: User department
  timezone?: string;          // NEW: User timezone
  preferences: {              // NEW: User preferences
    theme: 'light' | 'dark';
    notifications: boolean;
    emailDigest: boolean;
  };
}
```

## 4. New Models Required

### 1. Label Model
```typescript
interface Label {
  id: string;
  name: string;
  color: string;              // Hex color code
  projectId: string;          // Labels are project-specific
  createdAt: Date;
  createdBy: string;          // User ID
}
```

### 2. Comment Model
```typescript
interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  parentCommentId?: string;   // For nested comments
}
```

### 3. Activity Log Model
```typescript
interface ActivityLog {
  id: string;
  type: 'task_created' | 'task_updated' | 'status_changed' | 'assigned' | 'commented';
  entityId: string;           // Task/Project ID
  entityType: 'task' | 'project';
  userId: string;             // User who performed the action
  details: Record<string, any>; // Flexible details object
  createdAt: Date;
}
```

## 5. New API Endpoints Required

### 1. Labels Management
```
GET /api/projects/{projectId}/labels
POST /api/projects/{projectId}/labels
PUT /api/labels/{id}
DELETE /api/labels/{id}
```

### 2. Comments
```
GET /api/tasks/{taskId}/comments
POST /api/tasks/{taskId}/comments
PUT /api/comments/{id}
DELETE /api/comments/{id}
```

### 3. Activity Logs
```
GET /api/projects/{projectId}/activity
GET /api/tasks/{taskId}/activity
```

### 4. Advanced Filtering
```
GET /api/tasks/search?projectId={id}&status={status}&assignedTo={userId}&labels={label1,label2}&priority={priority}
```

### 5. User Management
```
GET /api/projects/{projectId}/members
POST /api/projects/{projectId}/members
DELETE /api/projects/{projectId}/members/{userId}
```

### 6. Dashboard Analytics
```
GET /api/dashboard/stats
GET /api/projects/{projectId}/stats
```

## 6. Database Schema Changes

### 1. Projects Table
```sql
ALTER TABLE projects 
ADD COLUMN description TEXT,
ADD COLUMN color VARCHAR(7),
ADD COLUMN icon VARCHAR(50),
ADD COLUMN status VARCHAR(20) DEFAULT 'active';
```

### 2. Tasks Table
```sql
ALTER TABLE tasks 
ADD COLUMN labels TEXT[], -- JSON array of labels
ADD COLUMN assigned_to UUID REFERENCES users(id),
ADD COLUMN priority VARCHAR(10) DEFAULT 'medium',
ADD COLUMN due_date TIMESTAMP,
ADD COLUMN estimated_hours DECIMAL(5,2),
ADD COLUMN actual_hours DECIMAL(5,2),
ADD COLUMN parent_task_id UUID REFERENCES tasks(id),
ADD COLUMN story_points INTEGER,
ADD COLUMN epic VARCHAR(100),
ADD COLUMN sprint VARCHAR(100),
ADD COLUMN reporter UUID REFERENCES users(id),
ADD COLUMN watchers UUID[];

-- Update status enum
ALTER TABLE tasks 
ALTER COLUMN status TYPE VARCHAR(20),
ALTER COLUMN status DROP DEFAULT;
```

### 3. New Tables
```sql
-- Labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  parent_comment_id UUID REFERENCES comments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. API Response Format Updates

### 1. Enhanced Task Response
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "CREATED|IN_PROGRESS|BLOCKED|TESTING|READY_TO_FINISH|FINISHED",
  "projectId": "uuid",
  "labels": ["string"],
  "assignedTo": {
    "id": "uuid",
    "name": "string",
    "avatar": "string"
  },
  "priority": "low|medium|high",
  "dueDate": "ISO date",
  "estimatedHours": "number",
  "actualHours": "number",
  "storyPoints": "number",
  "epic": "string",
  "sprint": "string",
  "reporter": {
    "id": "uuid",
    "name": "string",
    "avatar": "string"
  },
  "watchers": [
    {
      "id": "uuid",
      "name": "string",
      "avatar": "string"
    }
  ],
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "commentsCount": "number"
}
```

## 8. Priority Order

### Phase 1 (Critical)
1. Update Task status enum to new workflow
2. Add labels field to tasks
3. Add assignedTo field to tasks
4. Add description field to projects

### Phase 2 (High)
1. Add priority field to tasks
2. Create labels table and API endpoints
3. Add comments system
4. Add activity logging

### Phase 3 (Medium)
1. Add advanced filtering capabilities
2. Add user management features
3. Add dashboard analytics
4. Add time tracking features

## 9. Backwards Compatibility

### Migration Strategy
1. **Status Migration**: Map existing statuses:
   - `TODO` → `CREATED`
   - `IN_PROGRESS` → `IN_PROGRESS`
   - `DONE` → `FINISHED`

2. **Default Values**: Provide sensible defaults for new fields
3. **API Versioning**: Consider API versioning if breaking changes are needed

## 10. Testing Requirements

### Unit Tests
- Test new model validations
- Test status transitions
- Test assignment logic

### Integration Tests
- Test new API endpoints
- Test filtering functionality
- Test activity logging

### Performance Tests
- Test with large datasets
- Test complex filtering queries
- Test activity log performance

## Implementation Timeline

- **Week 1**: Database schema updates and basic model changes
- **Week 2**: Core API endpoints (status, labels, assignments)
- **Week 3**: Comments system and activity logging
- **Week 4**: Advanced filtering and analytics
- **Week 5**: Testing and bug fixes