# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based CRM (Customer Relationship Management) API built with TypeORM and MySQL. The application follows a modular architecture with base classes for entities, repositories, and services to promote code reusability.

## Common Development Commands

### Development
```bash
npm run start:dev          # Start development server with hot reload (port 3001)
npm run start:debug        # Start with debug mode
npm run build              # Build for production
npm run start:prod         # Start production build
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
jest path/to/test.spec.ts  # Run a single test file
```

### Code Quality
```bash
npm run lint               # Run ESLint and fix issues
npm run format             # Format code with Prettier
```

## Architecture & Code Patterns

### Module Structure
Each feature module follows this consistent structure:
```
modules/[feature-name]/
├── entities/[feature-name].entity.ts    # TypeORM entity extending CustomBaseEntity
├── dto/create-[feature-name].dto.ts     # DTOs with class-validator decorators
├── repositories/[feature-name].repository.ts  # Extends BaseRepositoryAbstract
├── services/[feature-name].service.ts   # Extends BaseService
├── controllers/[feature-name].controller.ts   # REST endpoints
└── [feature-name].module.ts             # Module definition
```

### Base Classes Usage

1. **Entities**: Always extend `CustomBaseEntity` from `src/core/base/entities/base.entity.ts`
   - Provides: id, createdAt, updatesAt fields
   - Use `@Column()` decorators for additional fields
   - Relations use `@ManyToOne`, `@OneToMany`, etc.

2. **Repositories**: Always extend `BaseRepositoryAbstract<T>` from `src/core/base/repositories/base.repository.abstract.ts`
   - Provides standard CRUD operations
   - Custom queries should use QueryBuilder pattern

3. **Services**: Always extend `BaseService<T>` from `src/core/base/services/base.service.ts`
   - Provides: create, update, findAll, findById, remove, paginate methods
   - Override methods when custom business logic is needed
   - Use `@LogMethod()` decorator for logging

4. **DTOs**: Use class-validator decorators
   - Create DTOs should validate required fields
   - Update DTOs typically use `@PartialType` from @nestjs/mapped-types
   - Always use `@Expose()` for fields that should be in responses

### Database Configuration

TypeORM is configured in `app.module.ts` to:
- Use MySQL on port defined in .env (default 3306)
- Auto-synchronize entities in development (synchronize: true when NODE_ENV !== 'production')
- Enable logging in development mode
- Entity naming: snake_case in database, camelCase in code

### API Patterns

- Controllers follow RESTful conventions
- Pagination uses `BaseQueryFilterDto` with page/limit parameters
- Response format for paginated endpoints:
  ```typescript
  {
    data: T[],
    meta: { page: number, limit: number, total: number }
  }
  ```
- Error handling uses `CustomHttpException` from `src/core/utils/custom-http.exception.ts`

### Authentication

- JWT-based authentication implemented in `src/modules/auth`
- Protected routes use guards from `src/modules/auth/guards`
- JWT secret configured in .env

## Module Dependencies

When creating new modules, register them in `app.module.ts` imports array. Current core modules:
- AuthModule (authentication/authorization)
- UserModule (user management)
- CustomerModule (customer management)
- RoleModule (role-based access)
- ProductModule, SalesModule (business operations)
- Country/State/CityModule (location management)

## Environment Variables

Required in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` for authentication
- `NODE_ENV` (development/production)
- Application runs on port 3001 (hardcoded in main.ts)

## CORS Configuration

CORS is configured in `main.ts` to allow:
- Origins: `http://localhost:3000`, `http://localhost:3001`
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials: true

## Validation

Global ValidationPipe configured with:
- `whitelist: true` - strips non-whitelisted properties
- `transform: true` - auto-transforms payloads to DTO instances