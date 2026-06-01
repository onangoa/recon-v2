# Construction Hub - Professional Site Management System

A comprehensive construction site management system for Kenya built with Next.js 16, Prisma, SQLite, and TypeScript. The system provides dual dashboards for superadmins and contractors with real-time project tracking, resource management, and analytics.

## Features

### Superadmin Dashboard
- Platform overview with key metrics (contractors, projects, revenue)
- Contractor management with safety score tracking
- Subscription plan management (Basic, Professional, Enterprise)
- Revenue and performance analytics with Recharts visualizations
- Reports generation
- Platform settings and configuration

### Contractor Portal
- Project management with budget tracking
- Task management with priority levels and status tracking
- Materials and equipment inventory management
- Team member management
- Safety metrics and compliance tracking
- Real-time project health indicators

### Core Features
- Role-based authentication (Superadmin, Contractor)
- SQLite database with Prisma ORM
- Comprehensive REST API for all entities
- Kenyan-specific seed data (3 contractors, 3 projects, materials, equipment, documents, visitors)
- Professional brown/grey/white color scheme
- Fully responsive design
- Recharts integration for analytics

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with Prisma 5.22
- **Charts**: Recharts 2.15
- **Styling**: Tailwind CSS v4 with custom design tokens

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm exec prisma generate

# Run migrations
DATABASE_URL="file:./prisma/dev.db" pnpm exec prisma migrate deploy

# Seed database with Kenyan data
DATABASE_URL="file:./prisma/dev.db" pnpm prisma:seed
```

### Running the Application

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## Demo Credentials

### Superadmin
- Email: `admin@constructionhub.ke`
- Password: `hashed_admin_password`

### Contractors
1. **Nairobi Builders Ltd**
   - Email: `info@nairobibuilders.ke`
   - Password: `hashed_contractor_password`

2. **Kisumu Construction Co**
   - Email: `hello@kisumucon.ke`
   - Password: `hashed_contractor_password`

3. **Mombasa Developers**
   - Email: `contact@mombasadev.ke`
   - Password: `hashed_contractor_password`

## Project Structure

```
/app
  /api                    # API Routes
    /auth                # Authentication endpoints
    /contractors         # Contractor CRUD
    /projects           # Project CRUD
    /tasks              # Task CRUD
    /materials          # Material CRUD
    /visitors           # Visitor CRUD
    /subscription-plans # Plan CRUD
  /superadmin           # Superadmin dashboard routes
    /contractors
    /plans
    /reports
    /settings
  /contractor           # Contractor portal routes
    /projects
    /tasks
    /materials
    /equipment
    /team
    /safety
    /settings
  layout.tsx            # Root layout with theme
  page.tsx              # Login page
  globals.css           # Global styles & design tokens

/components
  login-form.tsx        # Login component
  analytics-charts.tsx  # Recharts visualizations

/lib
  prisma.ts            # Prisma client utility

/prisma
  schema.prisma        # Database schema
  seed.ts              # Seed script with Kenyan data
```

## Database Schema

### Core Models
- **User**: Authentication (Superadmin/Contractor)
- **Session**: Session management
- **Contractor**: Company information, subscription, safety score
- **SubscriptionPlan**: Pricing tiers and features
- **Project**: Construction projects with budget tracking
- **Site**: Project sites with coordinates
- **Task**: Project tasks with priority and status
- **Material**: Material inventory tracking
- **Equipment**: Equipment and machinery management
- **Document**: Project documents and uploads
- **Photo**: Project photos and gallery
- **Visitor**: Site visitor tracking and checkpoints
- **Metric**: Project metrics (safety, progress, cost, quality)

## Key Features Implemented

### Authentication
- Login/Logout with session-based auth
- Role-based routing (Superadmin vs Contractor)
- Session cookies with 7-day expiration

### Dashboard Analytics
- Real-time metrics and KPIs
- Recharts line charts for revenue trends
- Pie charts for project distribution
- Bar charts for contractor performance
- Progress indicators and health metrics

### API Integration
- RESTful endpoints for all entities
- CRUD operations with relationship support
- Error handling and validation

### Design System
- Brown (#8B4513) primary color
- Grey and white neutrals
- Professional UI with Tailwind CSS v4
- Responsive grid layouts
- Semantic HTML with ARIA labels

## Seeded Data

The database includes Kenyan-specific data:
- **3 Contractors**: Based in Nairobi, Kisumu, and Mombasa
- **3 Projects**: Galaxy Mall, Westlands Complex, Lakeside Residential
- **6 Sites**: Multiple sites per project
- **15 Tasks**: Various construction phases
- **12 Materials**: Common construction materials
- **8 Equipment**: Machinery and tools
- **4 Documents**: Contracts and reports
- **9 Visitors**: Site access logs
- **12 Metrics**: Performance measurements

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Contractors
- `GET /api/contractors` - List all contractors
- `POST /api/contractors` - Create contractor
- `GET /api/contractors/[id]` - Get contractor details
- `PUT /api/contractors/[id]` - Update contractor
- `DELETE /api/contractors/[id]` - Delete contractor

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details with all relationships
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Other Resources
Similar CRUD endpoints available for:
- Tasks (`/api/tasks`)
- Materials (`/api/materials`)
- Visitors (`/api/visitors`)
- Subscription Plans (`/api/subscription-plans`)

## Environment Variables

```env
DATABASE_URL="file:./prisma/dev.db"
```

## Development

### Database Commands

```bash
# Create/update database schema
DATABASE_URL="file:./prisma/dev.db" pnpm exec prisma migrate dev --name <migration-name>

# Seed database
DATABASE_URL="file:./prisma/dev.db" pnpm prisma:seed

# Open Prisma Studio
DATABASE_URL="file:./prisma/dev.db" pnpm exec prisma studio
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Notes

- Password hashing is not implemented in the demo (use bcrypt in production)
- Session management uses simple cookies (consider more robust solutions for production)
- API validation should be enhanced before production deployment
- Implement proper error logging and monitoring
- Add comprehensive test coverage
- Consider adding WebSocket support for real-time updates

## License

This project is part of the Construction Hub platform demonstration.
