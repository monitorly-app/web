# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### PHP/Laravel Development (Web Application)
- **Start development server**: `composer run dev` (includes Laravel serve, queue worker, logs, and Vite)
- **Start with SSR**: `composer run dev:ssr`
- **Run tests**: `composer run test` (includes config:clear and Pest tests)
- **Code linting**: `vendor/bin/pint` (Laravel Pint for PHP formatting)
- **Database migrations**: `php artisan migrate`
- **Seed database**: `php artisan db:seed`

### Frontend Development (Web Application)
- **Start Vite dev server**: `npm run dev`
- **Build assets**: `npm run build`
- **Build with SSR**: `npm run build:ssr`
- **Format code**: `npm run format`
- **Check formatting**: `npm run format:check`
- **Lint JavaScript/TypeScript**: `npm run lint`
- **Type checking**: `npm run types`

### Go Development (Probe)
- **Build probe**: `go build -o bin/monitorly-probe ./cmd/probe` (from probe/ directory)
- **Run probe in development**: `go run ./cmd/probe -config config.yaml.example -skip-update-check`
- **Optimized release build**: `export CGO_ENABLED=0 && go build -v -a -installsuffix cgo -trimpath -ldflags="-s -w" -o bin/monitorly-probe ./cmd/probe`
- **Run all tests**: `go test ./...`
- **Run tests with coverage**: `go test -v -coverprofile=coverage.out ./...`
- **View coverage report**: `go tool cover -html=coverage.out`
- **Format code**: `go fmt ./...`
- **Tidy dependencies**: `go mod tidy`

### Testing
- **Run all web tests**: `composer run test` or `php artisan test`
- **Run Pest tests directly**: `vendor/bin/pest`
- **Feature tests**: Tests in `tests/Feature/`
- **Unit tests**: Tests in `tests/Unit/`
- **Run all probe tests**: `go test ./...` (from probe/ directory)

## Application Architecture

### Core Stack
- **Backend**: Laravel 12 with Inertia.js
- **Frontend**: React 19 + TypeScript with TailwindCSS v4
- **UI Components**: Radix UI primitives with custom design system
- **Database**: SQLite (development), supports PostgreSQL/MySQL
- **Testing**: Pest PHP testing framework
- **Authentication**: Laravel's built-in auth with Sanctum
- **Build Tool**: Vite with Laravel plugin
- **Probe**: Go-based monitoring agent with system metric collection

### Key Models and Relationships
- **User**: Has roles (admin/user), owns Organizations, belongs to multiple Organizations
- **Organization**: Has many Servers, Metrics, Members; belongs to Plan; has API/encryption keys
- **Server**: Belongs to Organization, has many Metrics; uses UUID tokens for probe authentication
- **Metric**: Stores monitoring data from probes; belongs to Server
- **Plan**: Defines subscription tiers (Free/Pro/Business) with limits
- **OrganizationRole**: Custom roles with granular permissions system

### Permission System
- **System Roles**: Admin (global) and User (regular users)
- **Organization Roles**: Owner, Admin, Engineer, Developer, Viewer with 17 granular permissions
- **Permission Categories**: Servers, Metrics, Members, Settings, Billing
- **Protected Roles**: Owner and Admin roles are system-protected

### Monitoring System Architecture
- **Go Probe**: External monitoring agent (see PROBE.md for full specification)
- **API Endpoints**: `/api/organizations/{org_id}/servers/{server_id}/metrics` for probe data
- **Real-time Data**: Stored in `last_metrics` JSON field on Server model
- **Authentication**: Bearer tokens + encryption keys for secure probe communication
- **Probe Architecture**: Interface-based design with pluggable collectors and senders
- **Probe Location**: `probe/` directory with complete Go application

### Frontend Architecture
- **Layout System**: Multiple layouts (app, admin, auth, settings) in `resources/js/layouts/`
- **Component Library**: Custom UI components in `resources/js/components/ui/`
- **Page Structure**: Inertia pages in `resources/js/pages/` mirror Laravel routes
- **State Management**: Inertia props + React hooks (no external state library)
- **Theming**: Dark/light mode with `use-appearance` hook

### Route Organization
- **Web Routes**: Main application routes in `routes/web.php`
- **API Routes**: Probe endpoints in `routes/api.php`
- **Admin Routes**: Administrative interface with role-based access
- **Organization Context**: Most routes scoped to organization with middleware

### Key Middleware
- **OrganizationAccess**: Ensures user has access to organization
- **OrganizationOwner**: Restricts to organization owners
- **CheckRole**: Global role-based access control

### Database Design
- **UUIDs**: Organizations and Servers use UUID primary keys
- **JSON Fields**: `last_metrics`, `system_info`, `monitoring_config` for flexible data storage
- **Soft Deletes**: Not used; direct deletion with proper cascading
- **Pivots**: organization_user for membership, organization_role_permissions for role system

## Configuration & Environment

### Key Configuration Files
- **Database**: SQLite at `database/database.sqlite`
- **Environment**: Standard Laravel `.env` file
- **TypeScript**: `tsconfig.json` for type checking
- **Vite**: `vite.config.ts` with Laravel integration
- **Tailwind**: `components.json` for shadcn/ui compatibility

### Important Environment Variables
- `VITE_APP_NAME`: Application name shown in frontend
- `APP_URL`: Base URL used for probe installation scripts
- Database connection settings for production deployments

## Development Patterns

### Frontend Patterns
- **Page Components**: Export default React component, receive Inertia props
- **Form Handling**: Use Inertia's `useForm` hook for server interactions
- **Navigation**: Inertia's `Link` component for SPA-like routing
- **Data Fetching**: Server-side through Laravel controllers, passed as Inertia props

### Backend Patterns
- **Controllers**: Organized by feature area (Organization, Server, Admin)
- **Models**: Rich models with relationships and business logic methods
- **Validation**: Request classes for complex validation (e.g., `ServerCreateRequest`)
- **API Responses**: Consistent JSON structure for probe communication

### Security Patterns
- **CSRF Protection**: Handled automatically by Laravel/Inertia
- **API Authentication**: Bearer tokens for probe communication
- **Role-Based Access**: Middleware + model methods for authorization
- **Data Encryption**: Optional AES-256-CBC encryption for premium probe features

## Special Features

### Probe Integration
- **Installation Scripts**: Generated per-server at `/install/{token}`
- **Configuration Management**: Automatic config updates via probe API
- **Metrics Collection**: Real-time system monitoring with configurable intervals
- **Error Handling**: Comprehensive error codes and fallback mechanisms
- **Dual Architecture**: Web application in `web/` and Go probe in `probe/`

### Multi-tenancy
- **Organization Isolation**: All resources scoped to organizations
- **Role Hierarchy**: System admins can access all organizations
- **API Key Management**: Per-organization API keys with usage tracking
- **Plan Limitations**: Feature access based on subscription tier

### Admin Interface
- **User Management**: CRUD operations on users with role assignment
- **Plan Management**: Subscription tier configuration
- **Organization Oversight**: View and manage all organizations
- **Role System**: Dynamic role/permission management for organizations

## Probe Development

### Go Probe Architecture
- **Entry Point**: `probe/cmd/probe/main.go` with CLI flags and signal handling
- **Core Modules**:
  - `internal/config/`: YAML configuration with hot-reload
  - `internal/collector/`: Plugin-based metric collection system
  - `internal/sender/`: HTTP API and file output with compression
  - `internal/encryption/`: AES-256-GCM encryption for API payloads
  - `internal/version/`: Auto-update system with GitHub releases
- **System Collectors**: CPU, RAM, disk, services, user activity, login failures, ports
- **Testing**: Comprehensive unit tests with ~80% coverage
- **Dependencies**: Minimal external dependencies (gopsutil, yaml, fsnotify)

### Probe Development Patterns
- **Interface-Based Design**: `Collector` and `Sender` interfaces for extensibility
- **Configuration-Driven**: YAML-based config with validation and defaults
- **Goroutine Concurrency**: Separate goroutines for collectors and senders
- **Hot-Reload**: Automatic configuration updates via filesystem watching
- **Graceful Shutdown**: Context-based cancellation and signal handling

### Probe API Integration
- **Authentication**: Bearer token authentication for secure communication
- **Endpoints**: `/api/{org_id}/servers/{server_id}/metrics` and `/info`
- **Data Format**: JSON with gzip compression and optional encryption
- **Error Handling**: Exponential backoff, rate limiting, and fallback mechanisms
- **Configuration Sync**: Automatic config updates from API responses