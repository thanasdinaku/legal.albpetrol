# Overview

This is a full-stack data management system built with React and Express.js, designed for professional database operations with role-based access control. The application provides a comprehensive dashboard for managing data entries with features like user authentication, data visualization, and CRUD operations. It uses a modern tech stack including TypeScript, Tailwind CSS, Drizzle ORM for database management, and shadcn/ui components for a polished user interface.

## Recent Changes (August 8, 2025)

✓ **Database Schema Implemented**: Created users and data_entries tables with proper relationships and constraints
✓ **Authentication System Redesigned**: Converted from external to private password-based authentication service
✓ **Default Admin Account**: Automatically creates admin@albpetrol.al / admin123 on first application startup  
✓ **Login System**: Albanian-language login page with Albpetrol branding and secure session management
✓ **Password Security**: Implemented secure password hashing with salt and validation
✓ **Settings Page**: Built password change functionality with form validation and security checks
✓ **Admin User Creation**: System for administrators to create user accounts with temporary passwords
✓ **Role-Based Access Control**: Maintained user/admin permissions with proper middleware protection
✓ **Dashboard Features**: Built statistics dashboard with real-time data and recent activity tracking
✓ **Data Entry System**: Implemented form validation and data submission with proper error handling
✓ **Data Table Interface**: Created paginated table with horizontal scrolling to display all 19 Albanian legal case fields
✓ **Export System**: Added Excel and CSV export functionality with Albanian headers
✓ **Mobile Responsive Design**: Implemented mobile-first design with responsive navigation, forms, and tables
✓ **Court Field Dropdowns**: Converted court fields to dropdown selectors with specific Albanian court options
✓ **Enhanced UX**: Added lighter grey placeholder text for better visual hierarchy and user experience
✓ **Authentication Flow Fixed**: Resolved logout-login cycle with proper routing and navigation
✓ **Clean Login Interface**: Removed administrator credentials display for professional appearance
✓ **Save Settings Functionality**: Activated 'Save Settings' button with database persistence for all system configuration changes
✓ **Password Policy Display**: Converted password policy from editable textarea to read-only styled display for system security
✓ **Permission System Enhancement**: Updated access control so regular users can view all records but only edit/delete their own entries
✓ **Role-Based Data Access**: Administrators maintain full CRUD access while regular users have view-only access to others' records
✓ **Export Functionality for All Users**: Updated export routes from admin-only to authenticated users for Excel and CSV downloads
✓ **View Button Addition**: Added View button in Actions column for all users to view detailed case information in read-only modal
✓ **Delete Permission Restriction**: Removed delete functionality for regular users; only administrators can now delete data entries
✓ **Password Validation Rules**: Implemented comprehensive password requirements (8+ characters, uppercase, number, special character) with frontend and backend validation
✓ **Court Dropdown Updates**: Updated court selection options for consistency - "Gjykata e Apelit" and "Gjykata e Shkallës së Parë" now include full court names
✓ **Export Headers Synchronization**: Updated Excel and CSV export headers and data mapping to match current data entry form structure exactly
✓ **System Settings Cleanup**: Removed backup and restoration features from System Settings, keeping only database statistics and core system information
✓ **Email Notification System**: Implemented comprehensive email notifications for new data entries with SMTP configuration, customizable recipients, professional Albanian templates, and admin management interface
✓ **Complete CRUD Email Notifications**: Added email notifications for all data operations - create, edit (with before/after comparison), and delete (with full entry details)
✓ **Comprehensive User Activity Tracking**: Implemented real-time activity tracking that updates user's last activity timestamp for all database operations (login, create, edit, delete)
✓ **Two-Factor Authentication System**: Implemented comprehensive 2FA with email verification codes that expire in 3 minutes, professional Albanian email templates, and seamless authentication flow

The application now provides complete legal case management with private authentication enhanced by two-factor email verification, seamless logout-login flow with security codes, admin-controlled user creation, Excel and CSV export capabilities for all users, proper role-based permissions with administrator-only deletion rights, strong password validation, synchronized export functionality, simplified system settings with database statistics only, comprehensive email notifications for all data operations (create/edit/delete) with detailed change tracking and proper Nr. Rendor numbering, real-time user activity tracking for all database interactions, and streamlined Albanian-language interface with professional security features.

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