# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartTodos is a monorepo containing:
- **Next.js web app** (`apps/web`) - Full-stack TypeScript application with API routes
- **Flutter mobile app** (`apps/mobile-flutter`) - Native iOS/Android app
- **LangGraph agent** (`apps/agent`) - Multi-agent AI system with supervisor pattern
- **React Native mobile** (`apps/mobile`) - Expo-based WebView wrapper (legacy)

## Essential Commands

**Always use pnpm** - Never use npm or yarn.

### Root Level (Turborepo)
```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps in development
pnpm build                # Build all apps
pnpm lint                 # Lint all apps
pnpm format               # Format code with Prettier
```

### Web App (`apps/web`)
```bash
cd apps/web
pnpm dev                  # Start Next.js dev server (http://localhost:3000)
pnpm build                # Build for production
pnpm lint                 # Run ESLint
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:push          # Push schema changes to database
pnpm prisma:studio        # Open Prisma Studio
```

### Flutter App (`apps/mobile-flutter`)
```bash
cd apps/mobile-flutter
flutter pub get                                            # Install dependencies
flutter pub run build_runner build --delete-conflicting-outputs  # Generate code (.g.dart files)
flutter pub run build_runner watch                         # Watch mode for code generation
flutter run                                                # Run on default device
flutter run -d chrome                                      # Run on Chrome
flutter test                                               # Run tests
flutter analyze                                            # Static analysis
```

### LangGraph Agent (`apps/agent`)
```bash
cd apps/agent
pnpm install              # Install dependencies
pnpm build                # Build TypeScript
pnpm dev                  # Run in development
```

## Architecture

### Monorepo Structure
- **Turborepo**: Manages builds, caching, and parallel task execution
- **pnpm workspaces**: Dependency management across packages
- **Shared packages**: Located in `packages/*` (if any)

### Web App (Next.js)

**Authentication Flow:**
- JWT-based authentication using custom JWT utility (`lib/jwt.ts`)
- Supports both **cookies** (for web) and **Authorization header** (for mobile)
- Middleware (`middleware.ts`) handles auth checks and CORS
- Protected API routes use `withAuth()` middleware (`lib/api-middleware.ts`)
- Auth endpoints: `/api/auth/credentials`, `/api/auth/session`, `/api/auth/register`

**API Structure:**
- Next.js API routes in `app/api/`
- All protected routes check for token in cookies OR `Authorization: Bearer <token>` header
- Services layer in `lib/services/` (TaskService, etc.)
- Prisma ORM with PostgreSQL database

**Key Files:**
- `middleware.ts` - Auth middleware + CORS configuration
- `lib/api-middleware.ts` - `withAuth()` wrapper for protected routes
- `lib/jwt.ts` - JWT signing/verification
- `prisma/schema.prisma` - Database schema
- `lib/services/taskService.ts` - Business logic for tasks

**CORS Configuration:**
- Configured in both `middleware.ts` and `next.config.mjs`
- Allows all origins (`*`) for API routes
- Supports Authorization header for mobile apps

### Flutter App

**Architecture:**
- **Riverpod** for state management
- **Dio** for HTTP client with interceptors
- **go_router** for navigation (planned)
- Feature-based folder structure

**Design System:**
- Pixel-perfect match with web app
- Colors extracted from `apps/web/tailwind.config.ts`
- Typography: Arial font matching web app
- Spacing constants match Tailwind spacing
- Custom widgets replicate shadcn/ui components

**Authentication Flow:**
1. Login → POST `/api/auth/credentials` → receives JWT token
2. Token saved in SharedPreferences
3. Dio interceptor adds `Authorization: Bearer <token>` to all requests
4. On app start, checks for saved token and validates with `/api/auth/session`

**API Client:**
- `core/api/dio_client.dart` - Dio setup with auth interceptor
- `core/api/api_service.dart` - All API methods
- Tokens stored via `shared_preferences`
- Automatic token injection in request headers

**Key Locations:**
- `lib/features/` - Feature modules (auth, tasks, chat, pomodoro, profile)
- `lib/core/models/` - Data models matching Prisma schema
- `lib/theme/` - Design system (colors, typography, spacing)
- `lib/shared/widgets/` - Reusable UI components

**Code Generation:**
- Run `flutter pub run build_runner build --delete-conflicting-outputs` after modifying:
  - Models with `@JsonSerializable()`
  - API services with Retrofit annotations
- Generated files have `.g.dart` extension

### LangGraph Agent

**Multi-Agent System:**
- Supervisor pattern with 5 specialized agents
- Defined in `src/graph.ts`
- Uses LangGraph for orchestration
- PostgreSQL for checkpoints

**Agents:**
1. Task Creation Agent
2. Planning Agent
3. Execution Coach Agent
4. Adaptation Agent
5. Analytics Agent

## Database

**Prisma + PostgreSQL:**
- Schema: `apps/web/prisma/schema.prisma`
- Main models: User, Task, Coach, PsychProfile, Settings, ChatMessage
- Migrations: Prisma handles schema changes
- Studio: Use `pnpm prisma:studio` to explore data

**Key Relationships:**
- Users have Tasks, Settings, PsychProfile, ChatMessages
- Tasks have subtasks (parentId), tags, notifications
- Coach system with matching algorithm based on PsychProfile

## Environment Variables

**Web App** (`apps/web/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - For signing JWT tokens
- `OPENAI_API_KEY` - For AI features
- `NEXT_PUBLIC_*` - Client-side accessible variables

**Flutter App** (`apps/mobile-flutter/lib/config/api_config.dart`):
- Development: `http://localhost:3000`
- Production: `https://smart-todos-web.vercel.app`
- Configured in code, not env files

## Common Development Patterns

### Adding New API Endpoint (Web)
1. Create route file: `apps/web/app/api/[endpoint]/route.ts`
2. Use `withAuth()` if protected: `export const GET = withAuth(async (req) => {...})`
3. Middleware automatically checks cookies OR Authorization header
4. Return `NextResponse.json()` responses

### Adding New Flutter Screen
1. Create feature folder: `lib/features/[feature]/`
2. Add provider: `providers/[feature]_provider.dart` (Riverpod)
3. Add screen: `screens/[feature]_screen.dart`
4. Add widgets: `widgets/[feature]_widget.dart`
5. Use design system from `lib/theme/`

### Working with Prisma
```bash
# After schema changes
pnpm prisma:generate  # Generate client
pnpm prisma:push      # Push to database (dev)
pnpm prisma:migrate   # Create migration (prod)
```

### Flutter Code Generation
```bash
# After adding @JsonSerializable() or Retrofit annotations
flutter pub run build_runner build --delete-conflicting-outputs

# Or watch mode (auto-regenerates on save)
flutter pub run build_runner watch
```

## Important Notes

### Authentication
- Web app uses cookies for browser sessions
- Mobile app uses JWT tokens in Authorization header
- Both methods supported by all protected API routes
- Token verification handled in `lib/api-middleware.ts` and `middleware.ts`

### Design System Consistency
- Flutter app must match web app UI pixel-perfectly
- Reference screenshots in `apps/web/screenshots/`
- Colors, spacing, typography all extracted from web Tailwind config
- Use `AppColors`, `AppSpacing`, `AppTextStyles` constants

### Mobile-Specific Considerations
- API calls from Flutter require CORS (already configured)
- No cookies work cross-origin → use Authorization header
- Token persistence via SharedPreferences
- Background tasks use workmanager package

### Turborepo Caching
- Builds are cached based on inputs
- Clear cache: `pnpm turbo clean`
- Force rebuild: `pnpm build --force`

## Debugging

### Web App
- Check logs in terminal running `pnpm dev`
- Prisma Studio for database inspection
- Next.js error overlay in browser

### Flutter App
- Console logs with `print()` statements
- Run with `flutter run` to see real-time logs
- Dio interceptor logs all HTTP requests/responses
- Debug auth flow: Check console for token existence and API responses