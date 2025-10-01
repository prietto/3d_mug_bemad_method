# Technical Assumptions

### Repository Structure: Monorepo

Single repository containing both frontend and backend applications with shared TypeScript types and interfaces. This approach reduces complexity for solo entrepreneur/small team development while enabling code sharing and simplified deployment workflows. Includes comprehensive README with setup instructions and clear folder structure separating concerns.

### Service Architecture

**NestJS Backend Monolith:** Enterprise-grade TypeScript framework with built-in dependency injection, decorators for clean code organization, and excellent MongoDB integration via Mongoose. Modular architecture with separate modules for leads, designs, and file uploads, using DTOs for data validation and guards for route protection.

**React Frontend SPA:** Component-based architecture with TypeScript for type safety, Three.js for 3D rendering and WebGL interactions, Tailwind CSS for responsive design system. Single-page application optimized for mobile-first user experience with progressive enhancement for desktop viewports.

### Testing Requirements: Unit + Integration

**Backend Testing:** NestJS built-in testing framework with Jest for unit tests on services and controllers, integration tests for database operations and API endpoints, supertest for HTTP request testing, comprehensive test coverage for lead capture and file upload functionality.

**Frontend Testing:** React Testing Library for component unit tests, Jest for business logic testing, Cypress or Playwright for end-to-end testing of 3D tool functionality and lead conversion flow, mobile device testing on real devices for 3D performance validation.

**Performance Testing:** Load testing for 3D model delivery, stress testing for concurrent users during marketing campaigns, mobile performance benchmarking across various devices and network conditions.

### Additional Technical Assumptions and Requests

**Cloud Infrastructure:** Vercel or Netlify for frontend deployment with automatic scaling and CDN distribution, Railway or DigitalOcean App Platform for NestJS backend hosting, MongoDB Atlas for cloud database with automated backups and scaling.

**File Processing:** Cloudinary integration for image optimization, resizing, and format conversion to ensure optimal 3D texture loading performance across devices. Automatic image validation and processing pipeline for user uploads.

**Analytics Integration:** Google Analytics 4 with custom event tracking for 3D tool interactions, conversion funnel analysis, and user behavior insights. Integration with backend API to correlate user actions with lead conversion data.

**Email Services:** SendGrid or Mailgun integration for automated lead notifications to business owner and confirmation emails to users, with basic email templates for professional communication.

**Security Implementation:** JWT authentication foundation for future admin features, HTTPS enforcement across all environments, CORS configuration for secure API access, input sanitization and validation for all user inputs including uploaded images.

**Development Tooling:** TypeScript across full stack for type safety and developer productivity, ESLint and Prettier for code consistency, Husky for git hooks and pre-commit validation, Docker for development environment consistency.

**Performance Optimization:** Three.js model optimization with texture compression, progressive loading for 3D assets, lazy loading for non-critical components, service worker implementation for offline functionality and faster repeat visits.

**Monitoring and Logging:** Basic application monitoring with error tracking (Sentry), performance monitoring for 3D rendering metrics, database query optimization monitoring, automated alerts for system issues.
