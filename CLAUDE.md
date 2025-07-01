# TodoList Frontend Development Documentation

## Project Overview
This Angular application serves as the frontend for a collaborative task management system. It connects to the todolist-api backend using Firebase authentication and provides a modern, responsive interface for managing projects and tasks.

## Architecture

### Core Technologies
- **Framework**: Angular 19.2 with standalone components
- **Authentication**: Firebase Auth with JWT tokens
- **HTTP Client**: Angular HttpClient with custom interceptors
- **Styling**: SCSS with modern CSS custom properties
- **UI Framework**: Bootstrap 5.3 + custom components
- **Icons**: FontAwesome 6.7

### Project Structure
```
src/app/
├── core/                    # Core application modules
│   ├── guards/             # Route guards (auth.guard.ts)
│   ├── interceptors/       # HTTP interceptors (auth.interceptor.ts)
│   ├── models/            # TypeScript interfaces and enums
│   └── services/          # Core services (auth, api, project, task, user)
├── shared/                # Shared components and utilities
│   └── components/
│       └── layout/        # Main application layout
├── features/              # Feature modules
│   ├── auth/             # Authentication (login, register)
│   ├── projects/         # Project management
│   └── tasks/            # Task management
└── environments/         # Environment configurations
```

## Key Components

### 1. Authentication System
- **AuthService**: Manages backend authentication with JWT token storage
- **AuthGuard**: Protects routes requiring authentication
- **AuthInterceptor**: Automatically adds Bearer tokens to API requests
- **Login/Register/ForgotPassword Components**: User authentication forms with validation
- **Token Management**: Automatic token storage and expiration checking

### 2. Project Management
- **ProjectListComponent**: Displays user's projects (owned and shared)
- **ProjectDetailComponent**: Kanban-style task board with project sharing
- **ProjectService**: API calls for CRUD operations and sharing

### 3. Task Management
- **TaskListComponent**: All tasks view with filtering capabilities
- **TaskService**: API calls for task operations and status changes
- **TaskStatus Enum**: TODO, IN_PROGRESS, DONE

### 4. Layout System
- **LayoutComponent**: Main application shell with sidebar navigation
- **Responsive Design**: Mobile-first approach with collapsible sidebar

## API Integration

### Base Configuration
- **Base URL**: http://localhost:8080/api
- **Authentication**: Bearer tokens via Authorization header
- **Error Handling**: Centralized error handling with user-friendly messages

### Service Architecture
```typescript
ApiService → ProjectService, TaskService, UserService
     ↓
AuthInterceptor → Adds Firebase ID tokens
     ↓
Backend API → Returns data or errors
```

### Key Endpoints Used
- `POST /users` - Create user profile
- `GET /projects/user/{userId}` - Get user's projects
- `POST /projects` - Create new project
- `POST /projects/{id}/share` - Share project
- `GET /tasks/project/{projectId}` - Get project tasks
- `POST /tasks/project/{projectId}` - Create task
- `PUT /tasks/{id}/status` - Update task status

## State Management
- **Signal-based State**: Using Angular 19 signals for reactive state management
- **Local Component State**: Each component manages its own state
- **Service Communication**: Services emit observables for cross-component communication

## UI/UX Features

### Design System
- **Modern Color Palette**: CSS custom properties for consistent theming
- **Typography**: Inter font with OpenType features
- **Animations**: Subtle hover effects and transitions
- **Components**: Custom button system, cards, forms, and badges

### Key Interactions
- **Drag-and-Drop**: Task status changes via action buttons
- **Real-time Updates**: Optimistic UI updates with error handling
- **Responsive Layout**: Adapts to mobile, tablet, and desktop screens
- **Loading States**: Spinners and skeleton states for better UX

## Security Considerations
- **Route Protection**: All application routes protected by auth guard
- **Token Management**: Automatic token refresh and secure storage
- **Input Validation**: Client-side validation with server-side verification
- **Error Boundaries**: Graceful error handling without app crashes

## Development Guidelines

### Code Organization
- **Standalone Components**: All components are standalone for better tree-shaking
- **Reactive Forms**: Using Angular reactive forms for validation
- **TypeScript Strict Mode**: Full type safety with strict TypeScript configuration
- **SCSS Architecture**: Component-scoped styles with global design tokens

### Performance Optimizations
- **Lazy Loading**: Route-based code splitting
- **OnPush Change Detection**: Optimized change detection strategy
- **Tree Shaking**: Minimal bundle size with dead code elimination
- **Signal-based Reactivity**: Efficient state updates with Angular signals

## Testing Strategy
- **Unit Tests**: Component and service testing with Jasmine/Karma
- **E2E Tests**: User flow testing capabilities
- **API Mocking**: Mock services for development and testing

## Deployment Configuration
- **Environment Variables**: Separate configs for development and production
- **Build Optimization**: Production builds with AOT compilation
- **Firebase Configuration**: Environment-specific Firebase project settings

## Future Enhancements
1. **Real-time Updates**: WebSocket integration for live collaboration
2. **Offline Support**: PWA capabilities with service workers
3. **Advanced Filtering**: More sophisticated task filtering and search
4. **Task Comments**: Full commenting system with history
5. **Notifications**: Push notifications for task updates
6. **Dark Mode**: Theme switching capabilities
7. **File Attachments**: Task file upload and management

## Development Commands
```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features Used**: ES2020, CSS Grid, Flexbox, CSS Custom Properties

## Performance Metrics
- **Bundle Size**: ~500KB gzipped (estimated)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Lighthouse Score**: 90+ (target)