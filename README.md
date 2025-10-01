# Custom Ceramic Mug Landing Page

A modern fullstack application for custom ceramic mug visualization and lead generation, built with Next.js 14+, TypeScript, Three.js, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account (for database)
- Vercel account (for deployment)

### Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd landing_page_bmad
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Database Setup:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy the SQL schema from `lib/database/schema.sql`
   - Run the schema in your Supabase SQL editor
   - Obtain your API keys from project settings

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   ├── leads/         # Lead management API
│   │   └── designs/       # Design persistence API
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── lib/                   # Shared utilities and configurations
│   ├── types/             # TypeScript interfaces
│   ├── database/          # Database schema and migrations
│   └── supabase.ts        # Supabase client configuration
├── components/            # Reusable React components
├── test/                  # Test configuration and utilities
├── .github/workflows/     # CI/CD pipeline configuration
└── docs/                  # Project documentation
```

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Frontend Framework | Next.js | 14.0+ | React framework with SSR/SSG |
| Language | TypeScript | 5.2+ | Type-safe development |
| 3D Graphics | Three.js + React Three Fiber | 0.156+ / 8.15+ | 3D mug visualization |
| Styling | Tailwind CSS | 3.3+ | Utility-first CSS framework |
| Database | Supabase PostgreSQL | Latest | Managed database service |
| State Management | Zustand | 4.4+ | Lightweight React state management |
| Testing | Vitest + Testing Library | 1.0+ / 14.0+ | Unit and integration testing |
| Deployment | Vercel | Latest | Serverless deployment platform |
| Analytics | Google Analytics 4 | Latest | User behavior tracking |

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Structure
- **Unit Tests**: Located alongside source files with `.test.ts` extension
- **Integration Tests**: API route testing with mocked dependencies
- **Component Tests**: React component testing with Testing Library
- **Coverage**: Focus on critical business logic (Lead capture, Design persistence)

## 📊 Database Schema

### Core Tables

1. **leads** - Customer lead information
   - `id` (UUID, PK)
   - `email` (VARCHAR, required)
   - `name` (VARCHAR, required)
   - `phone` (VARCHAR, optional)
   - `project_description` (TEXT, required)
   - `design_id` (UUID, FK to designs)
   - `engagement_level` (ENUM: low/medium/high)
   - `status` (ENUM: new/contacted/qualified/converted)
   - `created_at` (TIMESTAMP)

2. **designs** - 3D mug customization data
   - `id` (UUID, PK)
   - `mug_color` (VARCHAR, required)
   - `uploaded_image_base64` (TEXT, optional)
   - `custom_text` (TEXT, optional)
   - `text_font` (VARCHAR, optional)
   - `text_position` (JSONB, optional)
   - `is_complete` (BOOLEAN)
   - `created_at`, `last_modified` (TIMESTAMP)

3. **analytics_events** - User interaction tracking
   - `id` (UUID, PK)
   - `session_id` (VARCHAR, required)
   - `event_type` (ENUM: page_view/mug_rotate/color_change/etc.)
   - `event_data` (JSONB)
   - `timestamp` (TIMESTAMP)
   - `lead_id` (UUID, FK to leads)

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository:**
   - Import project in Vercel dashboard
   - Connect your Git repository

2. **Environment Variables:**
   Configure the following in Vercel project settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   GOOGLE_ANALYTICS_ID
   NEXT_PUBLIC_APP_URL
   ```

3. **Automatic Deployments:**
   - Push to `main` branch triggers production deployment
   - Pull requests create preview deployments
   - GitHub Actions runs tests before deployment

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

## 🔌 API Documentation

### Overview
All API endpoints follow a consistent response format:
```json
{
  "success": boolean,
  "data": object | null,
  "error": string | null
}
```

### Rate Limiting
- **Health Check**: 30 requests/minute per IP
- **Lead Creation**: 10 requests/minute per IP  
- **Design Operations**: 20-30 requests/minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Security Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` for XSS protection

---

### 🏥 Health Check Endpoint

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-26T10:00:00.000Z",
  "service": "Custom Ceramic Mug Landing Page API",
  "version": "1.5.0",
  "database": "connected",
  "uptime": 3600.5,
  "requestId": "uuid-string"
}
```

**Status Codes:**
- `200` - Service healthy
- `429` - Rate limit exceeded
- `500` - Service unhealthy

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/health \
  -H "Accept: application/json"
```

---

### 👤 Lead Management API

#### Create Lead
```http
POST /api/leads
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.smith@example.com",
  "name": "John Smith",
  "phone": "+1-555-123-4567",
  "projectDescription": "Need 50 custom mugs for company event with logo",
  "designId": "550e8400-e29b-41d4-a716-446655440000",
  "source": "website",
  "engagementLevel": "high"
}
```

**Required Fields:**
- `email` (string) - Valid email address
- `name` (string) - Customer full name
- `projectDescription` (string) - Project details

**Optional Fields:**
- `phone` (string) - Contact phone number
- `designId` (UUID) - Associated design reference
- `source` (string) - Traffic source (default: "direct")
- `engagementLevel` ("low"|"medium"|"high") - Engagement level (default: "medium")

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "john.smith@example.com",
    "name": "John Smith",
    "phone": "+1-555-123-4567",
    "projectDescription": "Need 50 custom mugs for company event with logo",
    "designId": "550e8400-e29b-41d4-a716-446655440000",
    "source": "website",
    "engagementLevel": "high",
    "status": "new",
    "createdAt": "2025-09-26T10:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 - Missing required fields
{
  "success": false,
  "error": "Missing required fields: email, name, projectDescription"
}

// 400 - Invalid email format
{
  "success": false,
  "error": "Invalid email format"
}

// 429 - Rate limit exceeded
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@example.com",
    "name": "John Smith",
    "projectDescription": "Custom mug order for 50 pieces",
    "engagementLevel": "high"
  }'
```

---

### 🎨 Design Management API

#### Create Design
```http
POST /api/designs
Content-Type: application/json
```

**Request Body:**
```json
{
  "mugColor": "#FF5733",
  "uploadedImageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "customText": "Best Dad Ever",
  "textFont": "Arial",
  "textPosition": "{\"x\": 0, \"y\": 0.5, \"z\": 0.8}"
}
```

**Required Fields:**
- `mugColor` (string) - Hex color code or color name

**Optional Fields:**
- `uploadedImageBase64` (string) - Base64 encoded image (max 5MB)
- `customText` (string) - Custom text overlay
- `textFont` (string) - Font family name
- `textPosition` (string) - JSON string with 3D coordinates

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "mugColor": "#FF5733",
    "uploadedImageBase64": "data:image/png;base64,...",
    "customText": "Best Dad Ever",
    "textFont": "Arial",
    "textPosition": "{\"x\": 0, \"y\": 0.5, \"z\": 0.8}",
    "createdAt": "2025-09-26T10:00:00.000Z",
    "lastModified": "2025-09-26T10:00:00.000Z",
    "isComplete": false
  }
}
```

**Error Responses:**
```json
// 400 - Missing required field
{
  "success": false,
  "error": "Missing required field: mugColor"
}

// 400 - Image too large
{
  "success": false,
  "error": "Image size exceeds 5MB limit"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/designs \
  -H "Content-Type: application/json" \
  -d '{
    "mugColor": "#FF5733",
    "customText": "Best Dad Ever",
    "textFont": "Arial"
  }'
```

#### Get Design by ID
```http
GET /api/designs/{id}
```

**Path Parameters:**
- `id` (UUID) - Design unique identifier

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "mugColor": "#FF5733",
    "uploadedImageBase64": "data:image/png;base64,...",
    "customText": "Best Dad Ever",
    "textFont": "Arial",
    "textPosition": "{\"x\": 0, \"y\": 0.5, \"z\": 0.8}",
    "createdAt": "2025-09-26T10:00:00.000Z",
    "lastModified": "2025-09-26T10:00:00.000Z",
    "isComplete": false
  }
}
```

**Error Responses:**
```json
// 400 - Invalid UUID format
{
  "success": false,
  "error": "Invalid design ID format"
}

// 404 - Design not found
{
  "success": false,
  "error": "Design not found"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/designs/550e8400-e29b-41d4-a716-446655440002 \
  -H "Accept: application/json"
```

---

### 🧪 API Testing with Postman

**Collection Setup:**
1. Import base URL: `http://localhost:3000` or your deployed URL
2. Set up environment variables for common values
3. Add authorization headers if needed

**Sample Postman Collection:**
```json
{
  "info": { "name": "Ceramic Mug API" },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/health"
      }
    },
    {
      "name": "Create Lead",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/leads",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"name\": \"Test User\",\n  \"projectDescription\": \"Test order\"\n}"
        }
      }
    }
  ]
}
```

---

### 🚨 Error Handling

**Common HTTP Status Codes:**
- `200` - Success (GET requests)
- `201` - Created successfully (POST requests)
- `400` - Bad Request (validation errors)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error (server issues)

**Error Response Format:**
```json
{
  "success": false,
  "error": "Descriptive error message",
  "requestId": "uuid-for-debugging"
}
```

---

### 🔧 Troubleshooting

**Common Issues:**

1. **Database Connection Errors:**
   - Verify Supabase environment variables
   - Check database connectivity via health endpoint
   - Ensure service role key has proper permissions

2. **Rate Limiting Issues:**
   - Check `X-RateLimit-*` headers
   - Implement exponential backoff in client code
   - Consider IP-based rate limiting in production

3. **Validation Errors:**
   - Ensure required fields are provided
   - Validate email format on client side
   - Check UUID format for design IDs

4. **Timeout Errors:**
   - Database operations timeout after 5 seconds
   - Check Supabase performance metrics
   - Optimize database queries if needed

**Debug Mode:**
Set `NODE_ENV=development` to enable detailed error logging.

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests

# Code Quality
npm run lint:fix     # Fix ESLint issues
npx prettier --write . # Format code
```

## 📝 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | `eyJhbGciOiJIUzI1...` |
| `GOOGLE_ANALYTICS_ID` | GA4 tracking ID | ✅ | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | ✅ | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | ✅ | `development` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Test coverage required for new features
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](../../issues) page for known problems
- Create a new issue for bug reports or feature requests
- Review the [Architecture Documentation](docs/architecture.md) for technical details

---

Built with ❤️ using Next.js, TypeScript, and Three.js
