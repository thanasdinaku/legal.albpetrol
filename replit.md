# Overview

This is a full-stack data management system built with React and Express.js, designed for professional database operations with role-based access control. The application provides a comprehensive dashboard for managing data entries with features like user authentication, data visualization, and CRUD operations. It uses a modern tech stack including TypeScript, Tailwind CSS, Drizzle ORM for database management, and shadcn/ui components for a polished user interface.

## Recent Changes (January 7, 2025)

✓ **Database Schema Implemented**: Created users and data_entries tables with proper relationships and constraints
✓ **Authentication System**: Integrated Replit OIDC authentication with role-based permissions (user/admin)  
✓ **Dashboard Features**: Built statistics dashboard with real-time data and recent activity tracking
✓ **Data Entry System**: Implemented form validation and data submission with proper error handling
✓ **Data Table Interface**: Created paginated table with filtering, search, and admin controls
✓ **Role-Based Access**: Normal users can add entries, admins can edit/delete with proper permission checks
✓ **Bug Fixes**: Resolved SelectItem validation errors and date field handling issues

The application is now fully functional and ready for production use with comprehensive role-based data management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and responsive design
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with type-safe queries and migrations
- **Session Management**: Express sessions with PostgreSQL storage
- **Build System**: esbuild for production bundling with platform-specific optimization

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle migrations with schema-first approach
- **Tables**: Users, sessions, and data entries with proper relationships
- **Enums**: Role-based permissions (user/admin), entry status, and priority levels
- **Indexes**: Optimized for session expiration and query performance

## Authentication & Authorization
- **Provider**: Replit OIDC authentication with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling
- **Role System**: User and admin roles with different permission levels

## API Architecture
- **Design**: RESTful API with consistent error handling and response formats
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Logging**: Request/response logging with performance monitoring

# External Dependencies

## Core Runtime Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **express**: Web application framework with middleware ecosystem

## Authentication Services
- **openid-client**: OpenID Connect client for Replit authentication
- **passport**: Authentication middleware with strategy pattern
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Frontend Libraries
- **@radix-ui/***: Comprehensive suite of accessible UI primitives
- **@tanstack/react-query**: Server state management with caching and synchronization
- **@hookform/resolvers**: Form validation resolvers for React Hook Form
- **tailwindcss**: Utility-first CSS framework with design system

## Development and Build Tools
- **vite**: Fast build tool with HMR and optimized bundling
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds
- **drizzle-kit**: Database migration and schema management tools

## Database and Storage
- **PostgreSQL**: Primary database with ACID compliance and advanced features
- **Sessions Table**: Persistent session storage with automatic cleanup
- **Migration System**: Version-controlled database schema changes