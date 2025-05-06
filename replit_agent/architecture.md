# WataWan Architecture

## Overview

WataWan is a full-stack web application that enables users to create, manage, and share wishlists. The application is designed as a Progressive Web App (PWA) that works across multiple devices and provides a seamless user experience even with intermittent network connectivity. The system architecture follows a client-server model with a React-based frontend and a Node.js backend, connected to a PostgreSQL database.

## System Architecture

### High-Level Architecture

The application follows a modern full-stack architecture with clear separation between:

1. **Frontend**: React-based Single Page Application (SPA) with responsive UI
2. **Backend API**: Express.js server providing RESTful endpoints
3. **Database**: PostgreSQL with Drizzle ORM for data persistence
4. **External Services**: Integration with product metadata extraction services

### Key Design Decisions

1. **Progressive Web App (PWA)**: The application is designed as a PWA to provide a native-like experience across devices, with offline capabilities and installability.

2. **Domain Separation**: The application supports two domain modes:
   - `app.watawan.com`: For authenticated users to create and manage wishlists
   - `watawan.com`: For public access to shared wishlists, without requiring authentication

3. **Serverless Database**: The application uses Neon Database (PostgreSQL) in serverless mode, allowing for cost-efficient scaling.

4. **TypeScript**: Used throughout both frontend and backend to ensure type safety and improve developer experience.

5. **Modular Architecture**: Both frontend and backend are organized in a modular fashion, separating concerns like authentication, data fetching, and UI components.

## Key Components

### Frontend

1. **React Application**
   - Built with Vite for fast development and optimized production builds
   - Uses React Router (Wouter) for client-side routing
   - Implements React Query for efficient data fetching and caching

2. **UI Components**
   - Utilizes the Shadcn UI component library with Radix UI primitives
   - Implements a custom theme system with dark mode support
   - Uses Tailwind CSS for styling

3. **State Management**
   - React Query for server state
   - React Context API for global state (authentication, etc.)
   - Local component state for UI-specific state

4. **PWA Features**
   - Service worker for offline capabilities
   - Web app manifest for installability
   - Client-side caching strategies

### Backend

1. **Express.js Server**
   - RESTful API endpoints for data access
   - Middleware for authentication, CSRF protection, etc.
   - TypeScript for type safety

2. **Authentication System**
   - Session-based authentication with cookies
   - Password hashing with scrypt
   - CSRF protection for secure forms

3. **Data Access Layer**
   - Drizzle ORM for type-safe database queries
   - Schema definitions shared between frontend and backend
   - Connection pooling for efficient database access

4. **Metadata Extraction Service**
   - Specialized extractors for e-commerce sites (Amazon, etc.)
   - Fallback mechanisms for handling different site structures
   - Caching to improve performance and reduce external requests

### Database

1. **Schema Design**
   - Users table for authentication and user data
   - Wishlists table for organizing user wishlists
   - WishItems table for individual wishlist items
   - Reservations table for tracking reserved items

2. **Relationships**
   - One-to-many: User to Wishlists
   - One-to-many: Wishlist to WishItems
   - One-to-one: WishItem to Reservation

## Data Flow

### User Authentication Flow

1. User registers or logs in through the frontend
2. Backend validates credentials and creates a session
3. Session data is stored in the database and a session ID cookie is sent to the client
4. Frontend includes the session cookie in subsequent requests
5. Backend validates the session for protected endpoints

### Wishlist Management Flow

1. Authenticated user creates or modifies a wishlist
2. Frontend sends requests to the appropriate API endpoints
3. Backend validates the requests and updates the database
4. Frontend receives responses and updates the UI accordingly

### Sharing Flow

1. User generates a shareable link for a wishlist
2. The link includes a unique identifier for the wishlist
3. Recipients can access the wishlist without authentication
4. Recipients can reserve items from the wishlist
5. Wishlist owner receives notifications about reservations

### Product Metadata Extraction

1. User enters a product URL
2. Backend attempts to extract metadata (title, description, image, etc.)
3. If extraction fails, fallback methods are attempted
4. Extracted metadata is returned to the frontend
5. User can edit the metadata before saving

## External Dependencies

### Frontend

1. **React and React DOM**: Core UI framework
2. **Vite**: Build tool and development server
3. **TanStack Query**: Data fetching and caching
4. **Wouter**: Lightweight routing
5. **Radix UI**: Accessible UI primitives
6. **Tailwind CSS**: Utility-first CSS framework
7. **Zod**: Schema validation
8. **React Hook Form**: Form handling

### Backend

1. **Express**: Web server framework
2. **Drizzle ORM**: Database ORM
3. **Neon Database**: PostgreSQL database provider
4. **Node-fetch**: HTTP client for external requests
5. **Cheerio**: HTML parsing for metadata extraction
6. **Bcryptjs**: Password hashing
7. **Express-session**: Session management
8. **Cookie-parser**: Cookie handling
9. **CSRF Tokens**: Cross-Site Request Forgery protection

## Deployment Strategy

The application is designed to be deployed on a platform like Replit, as evidenced by the Replit configuration files. The deployment strategy includes:

1. **Build Process**
   - Frontend: Vite builds the React application into static assets
   - Backend: ESBuild compiles TypeScript into JavaScript

2. **Runtime Configuration**
   - Environment variables for database connection strings, API keys, etc.
   - Different configurations for development and production environments

3. **Database Provisioning**
   - Uses Neon Database (PostgreSQL) in serverless mode
   - Database migrations managed through Drizzle Kit

4. **Scaling Considerations**
   - Stateless backend for horizontal scaling
   - Connection pooling for efficient database usage
   - Client-side caching to reduce server load

5. **Monitoring and Error Handling**
   - Server logs for debugging and monitoring
   - Client-side error reporting for frontend issues
   - Network status monitoring for offline detection

## Security Considerations

1. **Authentication**: Secure password hashing with scrypt
2. **Session Management**: HTTP-only cookies with secure flags
3. **CSRF Protection**: Token-based CSRF prevention
4. **XSS Prevention**: Input sanitization and content security policies
5. **Secure Headers**: HTTP security headers for browser protection
6. **Rate Limiting**: Protection against brute force attacks