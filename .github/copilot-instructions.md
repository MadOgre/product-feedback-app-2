# Copilot Instructions for product-feedback-app

## Architecture Overview

This is a full-stack TypeScript application with:
- **Frontend**: React 19 + Vite + Mantine UI + React Router v7
- **Backend**: Node.js HTTP server (currently basic, transitioning to use MikroORM)
- **Database**: PostgreSQL via MikroORM (entities in `database/models/`)
- **Development**: Concurrent dev servers - API (port 9001), Web (port 9000), Type checking

Frontend proxies `/api` requests to backend server at `http://localhost:9001` (see `vite.config.mjs`).

## Development Workflow

**Start development** (runs all three processes concurrently):
```bash
pnpm dev
```

Individual processes:
- `pnpm dev:api` - Backend server with hot reload (tsx watch)
- `pnpm dev:web` - Vite dev server on port 9000
- `pnpm dev:types` - TypeScript watch mode for type checking

**Testing & Quality**:
- `pnpm test` - Full CI suite (typecheck + lint + vitest + build)
- `pnpm vitest:watch` - Interactive test runner
- Tests use Vitest with React Testing Library, not Jest

**Database**:
- MikroORM entities use decorators (`@Entity`, `@PrimaryKey`, `@Property`)
- Entities in `database/models/` with `*.entity.ts` suffix
- Run migrations: `pnpm mikro-orm migration:up`
- Generate migration: `pnpm mikro-orm migration:create`

## Code Conventions

**Import Paths**:
- Use `@/*` for src imports (e.g., `import { theme } from "@/theme"`)
- Use `@test-utils` for test utilities (configured in `tsconfig.json` paths)

**Testing**:
- All tests use the custom `render` from `@test-utils` which wraps components with `MantineProvider` and theme
- Test files: `*.test.tsx` pattern (e.g., `Welcome.test.tsx`)
- Never import directly from `@testing-library/react`, always use `@test-utils`

**Linting**:
- Uses `eslint-config-mantine` base config with custom rules
- **Double quotes** enforced for strings (not single quotes)
- **Semicolons required** at statement ends
- Trailing commas required in multiline structures
- No console warnings disabled (console.log is allowed)

**Styling**:
- Mantine v8 component library for UI
- CSS Modules for component styles (e.g., `Welcome.module.css`)
- PostCSS with `postcss-preset-mantine` and `postcss-simple-vars`
- Theme configured in `src/theme.ts`

**React/TypeScript**:
- React 19 with TypeScript strict mode
- Decorator support enabled for MikroORM entities
- No PropTypes (use TypeScript types instead)

## Project Structure Patterns

- `src/components/` - React components with co-located tests, stories, and CSS modules
- `src/pages/` - Route page components (e.g., `Home.page.tsx`)
- `server/` - Backend server code
- `database/models/` - MikroORM entity definitions
- `test-utils/` - Shared testing utilities (custom render function)

## Current State Notes

- Backend server is minimal (`server/server.ts` returns "hello world")
- Article entity exists but is basic (only has id field)
- Migrations folder empty except `.gitkeep`
