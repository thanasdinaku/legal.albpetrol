# Overview

This is a full-stack legal case management system built with React and Express.js, designed for professional database operations with role-based access control. The application provides a comprehensive dashboard for managing Albanian legal case data with features like user authentication, data visualization, and CRUD operations. It uses a modern tech stack including TypeScript, Tailwind CSS, Drizzle ORM for database management, and shadcn/ui components for a polished user interface.

The project's business vision is to provide a robust, secure, and user-friendly platform for managing legal case data, specifically tailored for organizations like Albpetrol. Its market potential lies in offering a specialized data management solution for legal departments that require stringent access control, comprehensive data tracking, and efficient reporting. The project ambitions include achieving enterprise-grade security and reliability, comprehensive real-time user activity tracking, and an intuitive Albanian-language interface.

**Deployment Status**: ✅ Successfully deployed complete functional React application on Ubuntu 24.04.3 LTS server at http://10.5.20.31 with PM2 process management and PostgreSQL database. Application features working authentication system, professional Albanian login interface, dashboard with statistics cards (Total Cases, Today Cases, Active Cases), and complete backend API integration. Final deployment completed August 20, 2025 with fully functional application including working login form, user authentication, dashboard functionality, and Albanian language interface. Production environment is stable and operational with PM2 status: online.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Library**: shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom design tokens and responsive design.
- **State Management**: TanStack React Query for server state management.
- **Routing**: Wouter for lightweight client-side routing.
- **Forms**: React Hook Form with Zod validation.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM with type-safe queries and migrations.
- **Session Management**: Express sessions with PostgreSQL storage.
- **Build System**: esbuild for production bundling.

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver.
- **Schema Management**: Drizzle migrations with a schema-first approach.
- **Tables**: Users, sessions, and data entries with proper relationships.
- **Enums**: Role-based permissions (user/admin), entry status, and priority levels.
- **Indexes**: Optimized for session expiration and query performance.

## Authentication & Authorization
- **Provider**: Replit OIDC authentication.
- **Session Storage**: PostgreSQL-backed sessions.
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling.
- **Role System**: User and admin roles with different permission levels, including protection for the default admin account.
- **Two-Factor Authentication**: Implemented with email verification codes.

## API Architecture
- **Design**: RESTful API with consistent error handling.
- **Validation**: Zod schemas for request/response validation.
- **Error Handling**: Centralized error middleware.
- **Logging**: Request/response logging with performance monitoring.

## Key Features
- **Data Management**: CRUD operations for legal case data with 19 Albanian legal case fields.
- **User Management**: Admin-controlled user creation with role-based access control.
- **Data Export**: Excel and CSV export functionality with Albanian headers for all authenticated users.
- **Email Notifications**: Comprehensive email notifications for all data operations (create, edit, delete) with customizable recipients and Albanian templates.
- **Activity Tracking**: Real-time user activity tracking for all database interactions.
- **User Manual**: Comprehensive Albanian-language user manual accessible within the system.

# External Dependencies

## Core Runtime Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon.
- **drizzle-orm**: Type-safe ORM.
- **express**: Web application framework.

## Authentication Services
- **openid-client**: OpenID Connect client.
- **passport**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL session store for Express.

## UI and Frontend Libraries
- **@radix-ui/***: Accessible UI primitives.
- **@tanstack/react-query**: Server state management.
- **@hookform/resolvers**: Form validation resolvers for React Hook Form.
- **tailwindcss**: Utility-first CSS framework.

## Development and Build Tools
- **vite**: Fast build tool.
- **tsx**: TypeScript execution for Node.js.
- **esbuild**: Fast JavaScript bundler.
- **drizzle-kit**: Database migration and schema management tools.

## Database and Storage
- **PostgreSQL**: Primary database.
- **Cloudflare**: Used for DNS management, WAF, and Argo Tunnel for external access.