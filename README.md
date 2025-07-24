# TodoList Frontend

A modern, responsive task management application built with Angular 19. This frontend connects to the todolist-api backend to provide a collaborative project and task management experience.

![Angular](https://img.shields.io/badge/Angular-19.2-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap)
![SCSS](https://img.shields.io/badge/SCSS-Latest-pink?logo=sass)

## ✨ Features

### 🔐 Authentication
- **Backend API Authentication** with email/password
- **Secure login/register/forgot password** with form validation
- **JWT token management** with automatic storage
- **Route protection** with auth guards

### 📊 Project Management
- **Create and manage projects** with descriptive names
- **Project sharing** with other users via email
- **Visual project cards** showing task counts and shared users
- **Owner vs shared project** distinction
- **Project deletion** with cascade task deletion
- **Project customization** with colors and icons
- **Project analytics** and progress tracking

### ✅ Task Management
- **Kanban-style task board** (To Do → In Progress → Done)
- **Create tasks** with title and description
- **Quick status updates** via action buttons
- **Task detail views** (modal and standalone URL routes)
- **Task comments** with activity history tracking
- **Checklist functionality** within tasks
- **Task assignment** to team members
- **Priority levels** with visual indicators
- **Due dates** and deadline tracking
- **Task filtering** by project, status, and search query
- **All tasks overview** across all projects
- **Task deletion** with confirmation modals

### 🎨 Modern UI/UX
- **Responsive design** for mobile, tablet, and desktop
- **Dark/light theme support** with CSS custom properties
- **Smooth animations** and hover effects
- **Loading states** and error handling
- **FontAwesome icons** throughout the interface
- **Drag-and-drop** task status changes
- **Confirmation modals** for destructive actions
- **Advanced search and filtering** capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 19+
- TodoList API backend running on port 8080

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todolist-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   Update `src/environments/environment.ts` with your API URL:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080/api'
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:4200/`

## 🏗️ Project Structure

```
src/app/
├── core/                    # Core application functionality
│   ├── guards/             # Route guards (authentication)
│   ├── interceptors/       # HTTP interceptors (auth token injection)
│   ├── models/            # TypeScript interfaces and enums
│   └── services/          # Core services (auth, api, project, task, user)
├── shared/                # Shared components and utilities
│   └── components/
│       └── layout/        # Main application layout with sidebar
├── features/              # Feature-specific modules
│   ├── auth/             # Authentication (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── projects/         # Project management
│   │   ├── project-list/
│   │   └── project-detail/
│   ├── tasks/            # Task management
│   │   ├── task-list/
│   │   └── task-detail/
│   ├── dashboard/        # Analytics and overview
│   ├── calendar/         # Calendar view
│   ├── settings/         # User settings
│   └── board/            # Kanban board view
└── environments/         # Environment configurations
```

## 🔧 Available Scripts

```bash
# Development server
npm start              # Start dev server on http://localhost:4200

# Building
npm run build         # Build for production
npm run watch         # Build and watch for changes

# Testing
npm test              # Run unit tests with Karma
npm run test:coverage # Run tests with coverage report

# Code quality
npm run lint          # Lint TypeScript and HTML
npm run format        # Format code with Prettier
```

## 📱 Responsive Design

The application is built with a mobile-first approach:

- **Mobile (< 768px)**: Collapsible sidebar, stacked layouts
- **Tablet (768px - 1024px)**: Sidebar navigation, grid layouts
- **Desktop (> 1024px)**: Full sidebar, optimized task boards

## 🎨 Design System

### Color Palette
- **Primary**: Blue theme (`#3498db`, `#2980b9`)
- **Success**: Green (`#27ae60`, `#229954`)
- **Warning**: Orange (`#f39c12`, `#e67e22`)
- **Danger**: Red (`#e74c3c`, `#c0392b`)
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter with OpenType features
- **Scale**: Consistent type scale from 12px to 32px
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Buttons**: Multiple variants (primary, secondary, success, danger)
- **Cards**: Modern card design with hover effects
- **Forms**: Consistent form controls with validation states
- **Badges**: Status indicators with color coding

## 🔌 API Integration

The frontend connects to the todolist-api backend:

### Authentication Flow
1. User logs in with email/password via backend API
2. Backend validates credentials using Firebase Admin SDK
3. Backend returns JWT token stored in localStorage
4. Token is automatically added to all API requests via interceptor
5. Backend validates token and processes requests

### Key Endpoints
- **Authentication**: Login, register, password reset via `/api/auth/`
- **Projects**: CRUD operations and sharing functionality via `/api/projects/`
- **Tasks**: Create, update, delete and manage task status via `/api/tasks/`
- **Comments**: Task comments and activity tracking via `/api/tasks/:id/comments`
- **Checklist**: Task checklist items via `/api/tasks/:id/checklist`
- **Users**: User management and profile updates via `/api/users/`

## 🛡️ Security Features

- **Route Guards**: Protect all application routes with authentication
- **HTTP Interceptors**: Automatic token injection and error handling
- **Input Validation**: Client-side form validation with TypeScript
- **CSRF Protection**: Angular's built-in CSRF protection
- **Secure Token Storage**: JWT tokens stored in localStorage with expiration checking

## 📦 Dependencies

### Core Dependencies
- **@angular/core**: 19.2.0 - Angular framework
- **@angular/fire**: 18.0.1 - Firebase integration
- **firebase**: 11.9.1 - Firebase SDK
- **@ng-bootstrap/ng-bootstrap**: 18.0.0 - Bootstrap components
- **@fortawesome/fontawesome-free**: 6.7.2 - Icons

### Development Dependencies
- **@angular/cli**: 19.2.14 - Angular CLI
- **typescript**: 5.7.2 - TypeScript language
- **jasmine**: Testing framework
- **karma**: Test runner

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## 📈 Performance

- **Bundle Size**: ~500KB gzipped (estimated)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Lighthouse Score**: 90+ target

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
Update `src/environments/environment.prod.ts` for production:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  firebase: {
    // Production Firebase config
  }
};
```

## 🚧 Development Roadmap

### Currently Implemented ✅
- User authentication and authorization
- Project creation, sharing, and basic management
- Task CRUD operations with status tracking
- Kanban-style board interface
- Responsive design with modern UI

### In Development 🔄
- **Project deletion** with cascade task deletion
- **Task detail views** (modal and standalone routes)
- **Task comments** and activity history
- **Checklist functionality** within tasks
- **Task assignment** and priority management

### Planned Features 📋
- **Advanced Task Features**
  - Due dates and deadline tracking
  - Task labels and custom tags
  - Subtask functionality
  - Drag-and-drop status changes
  - Advanced search and filtering

- **Enhanced Project Management**
  - Project analytics and progress tracking
  - Custom project colors and icons
  - Project templates
  - Bulk operations

- **Collaboration Features**
  - Real-time notifications
  - @mentions in comments
  - Activity feeds
  - Team member management

- **Productivity Features**
  - Time tracking and estimation
  - Calendar integration
  - File attachments
  - Email notifications

For a complete project vision and detailed roadmap, see [VISION.md](./VISION.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [CLAUDE.md](./CLAUDE.md) file for detailed development documentation
- Review the [VISION.md](./VISION.md) file for project goals and roadmap
- Create an issue in the repository
- Contact the development team

## 📚 Additional Documentation

- **[VISION.md](./VISION.md)** - Project vision, goals, and long-term roadmap
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development documentation and architecture guide

---

Built with ❤️ using Angular 19 and modern web technologies.
