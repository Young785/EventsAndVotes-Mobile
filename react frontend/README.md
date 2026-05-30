# Events and Votes Platform - React Frontend

## Overview
A comprehensive Laravel + React TypeScript platform for managing events and voting campaigns with advanced admin functionality.

## New Enhanced Features 🆕

### 🚀 Enhanced Admin Dashboard
Access the new enhanced dashboard with advanced analytics and real-time features:
- **URL**: `/admin/enhanced-dashboard`
- **Features**: 
  - Interactive analytics charts
  - Real-time activity feed
  - Quick action shortcuts
  - Advanced statistics cards
  - Notification center

### 🔔 Real-time Notification System
- Bell icon in admin header with unread count
- Dropdown notification panel
- Multiple notification types with color coding
- Mark as read/delete functionality
- Auto-refresh every 30 seconds

### 📊 Advanced Analytics
- **AnalyticsChart Component**: Interactive revenue and vote analytics
- Period selection (daily, weekly, monthly, yearly)
- CSV export functionality
- Trend analysis with percentage changes
- Hover tooltips with detailed information

### 📈 Activity Feed
- **ActivityFeed Component**: Real-time system activity monitoring
- Filterable by activity type (user, vote, payment, system)
- Expandable details for each activity
- User attribution with avatar display
- Metadata display for additional context

### ⚡ Quick Actions Widget
- **QuickActions Component**: Role-based action shortcuts
- Dynamic filtering based on user role
- Featured actions highlighting
- Grid and list layout options
- Direct navigation to relevant pages

## Component Architecture

### New Components Added
```
src/components/
├── NotificationCenter.tsx     # Real-time notification system
├── AnalyticsChart.tsx        # Interactive analytics charts
├── ActivityFeed.tsx          # System activity monitoring
└── QuickActions.tsx          # Role-based quick actions
```

### Enhanced Components
```
src/components/
├── AdminLayout.tsx           # Updated with notification center
└── LoadingSpinner.tsx        # Existing loading component
```

### New Pages
```
src/pages/admin/
└── EnhancedAdminDashboard.tsx # Advanced dashboard with all new features
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router v6** for routing
- **Lucide React** for icons
- **React Hook Form** with Zod validation

### Key Libraries
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Client-side routing
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `lucide-react` - Icon library
- `react-hot-toast` - Toast notifications

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Laravel backend running on `https://eventsandvotes.test/api`

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Environment Setup
Ensure your Laravel backend is running on `https://eventsandvotes.test/api` as configured in `src/services/api.ts`.

## Features Overview

### 🔐 Authentication & Authorization
- JWT token-based authentication
- Role-based access control (User, Admin, SuperAdmin, Admin_Vote, Admin_Event, Admin_Both)
- Protected routes with automatic redirects
- Token refresh handling

### 🗳️ Voting System
- Vote creation and management
- Real-time vote tracking
- Search functionality (button-triggered)
- Category and status filtering
- Vote analytics and reporting

### 💰 Payment & Subscription System
- Multiple subscription tiers
- Payment processing integration
- Withdrawal management
- Transaction history tracking

### 👥 User Management
- Role-based administration
- User profile management
- Account verification system
- Activity history tracking

### 📊 Advanced Analytics
- Real-time dashboard analytics
- Interactive charts with export functionality
- Revenue and vote tracking
- Trend analysis with percentage changes

## API Integration

### Base Configuration
```typescript
// src/services/api.ts
const API_BASE_URL = 'https://eventsandvotes.test/api'
```

### API Endpoints
- **Admin API**: Dashboard stats, votes CRUD, positions, nominees, withdrawals
- **SuperAdmin API**: User management, transactions, login-as functionality
- **User API**: Profile management, voting, subscriptions

## Role-Based Access

### User Roles
- **User**: Basic voting and profile access
- **Admin**: General administrative tasks
- **Admin_Vote**: Vote-specific management
- **Admin_Event**: Event-specific management  
- **Admin_Both**: Combined vote and event management
- **SuperAdmin**: Full system control

### Route Protection
```typescript
// Protected route example
<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminRoutes />
  </ProtectedRoute>
} />
```

## Development Guidelines

### Component Structure
- Use TypeScript for all components
- Implement proper error handling and loading states
- Follow React Query patterns for data fetching
- Use Tailwind CSS for consistent styling
- Implement responsive design principles

### Code Quality
- TypeScript throughout the application
- Proper error boundaries
- Loading states and skeletons
- Toast notifications for user feedback
- Clean separation of concerns

## Deployment

### Build Process
```bash
# Create production build
npm run build

# Serve build locally (for testing)
npm run serve
```

### Environment Variables
Configure the following in your deployment environment:
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_ENV`: Environment (development/production)

## Performance Optimizations

### Implemented
- React Query for efficient data fetching
- Automatic cache invalidation
- Background data refresh
- Lazy loading of components
- Optimized bundle sizes

### Monitoring
- Real-time data updates every 30 seconds
- Automatic error handling and retry logic
- Performance metrics tracking ready

## Security Features

### Implemented
- JWT token management with automatic refresh
- Role-based route protection
- Input validation and sanitization
- CSRF protection ready
- Secure API communication

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing
1. Follow TypeScript best practices
2. Implement proper error handling
3. Add loading states for all async operations
4. Use React Query for data fetching
5. Follow the existing component structure
6. Test on multiple screen sizes

## License
This project is proprietary software for the Events and Votes platform.

---

**For more detailed feature documentation, see [FEATURES.md](./FEATURES.md)** # EventsAndVotes-V2

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# API Configuration
VITE_API_URL=https://eventsandvotes.test/api

# Environment
NODE_ENV=development

# App Configuration
VITE_APP_NAME="Events and Votes"
VITE_APP_URL=http://localhost:5173
```

### Environment Examples

**Development (.env.development)**
```bash
VITE_API_URL=https://eventsandvotes.test/api
```

**Production (.env.production)**
```bash
VITE_API_URL=https://eventsandvotes.com.ng/api
```

## Authentication Issues Fix

If you're experiencing 302 or 204 errors, ensure:

1. Your `.env` file has the correct `VITE_API_URL`
2. The Laravel backend has proper CORS configuration
3. Sanctum stateful domains include your frontend domain
4. You're using consistent authentication (token-based, not mixed with sessions)

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create your `.env` file with the appropriate configuration
3. Start the development server:
```bash
npm run dev
```

## Authentication Flow

This application uses Laravel Sanctum with token-based authentication:
- No session cookies are used (`withCredentials: false`)
- Bearer tokens are stored in localStorage
- All API requests include the Authorization header
- Automatic token refresh and logout on auth errors
