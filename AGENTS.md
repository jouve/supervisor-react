# AGENTS.md

This document provides comprehensive guidelines for agentic coding tools (including Claude Code) operating in this repository.

## Project Overview

`supervisor-react` is a web UI for [Supervisor](http://supervisord.org/) (process manager). It consists of:
- A **Python backend** (`supervisor_react/`) — a Starlette/uvicorn app that proxies XML-RPC calls to supervisord and serves the static frontend
- A **React frontend** (`react-app/`) — a Next.js app with MUI components, exported as static files and bundled into the Python package

## Architecture

### Request Flow
```
Browser → Next.js (dev) or Starlette (prod)
           ├── POST /RPC2         → XML-RPC → supervisord
           ├── GET  /logtail/...  → streaming proxy → supervisord logtail
           └── GET  /*            → static files (Next.js export)
```

### Python Backend (`supervisor_react/__init__.py`)
Single file with three routes:
- `POST /RPC2` — accepts JSON `{methodname, params}`, serializes to XML-RPC, forwards to supervisord, returns deserialized JSON
- `GET /logtail/{path}` and `/mainlogtail` — streaming proxy using httpx
- `Mount /` — serves the static Next.js export as package data

The supervisord base URL is passed at startup via `-s/--supervisor` (default `http://localhost:9001`).

### React Frontend (`react-app/app/`)
- `supervisor.ts` — `Supervisor` class wrapping all XML-RPC calls; also defines `ProcessInfo`, `ProcessStates`, `RUNNING_STATES`
- `page.tsx` — single-page UI with process groups shown as MUI Accordions; each group shows per-process status, start/stop/restart controls, and log links
- `next.config.ts` — in dev mode, rewrites `/RPC2` to `localhost:8888`; in prod, outputs static export

## Build/Lint/Test Commands

### Python Backend Commands
```bash
uv run supervisor-react          # run the app (default: port 8888, supervisor at localhost:9001)
uv run ruff check                # lint
uv run ruff format               # format
uv run ty check                  # type check
```

### React Frontend Commands
```bash
cd react-app
npm run dev      # dev server (proxies /RPC2 to localhost:8888)
npm run build    # static export to react-app/out/
npm run lint     # ESLint
npm run start    # production server
```

### Building the Full Package
The Next.js build must run first (`npm run build` in `react-app/`). The static output is included as hatchling artifacts (`statics/`). Use `uv build` to produce the Python package.

### Test Commands
- No test framework is currently configured in this project
- Tests would typically run with: `npm test` (if configured)
- To run a single test file: `npm test -- path/to/test.file` (if configured)
- For testing individual components: `npm test -- --testPathPattern=component-name`

## Development Workflow

1. Start supervisord: `supervisord -c tests/supervisord.conf`
2. Start the Python backend: `uv run supervisor-react`
3. Start the frontend dev server: `cd react-app && npm run dev`
4. Open `http://localhost:3000`

## Code Style Guidelines

### Imports
- Use absolute imports with `@/*` alias for project files (configured in tsconfig.json)
- Group imports in this order:
  1. Node.js built-in modules
  2. External dependencies
  3. Internal project files
- Use named imports for specific exports
- Avoid wildcard imports (`import * as`) unless necessary
- Sort imports alphabetically within each group

### Formatting
- Use ESLint with Next.js defaults for code formatting
- 2-space indentation
- Single quotes for strings
- Semicolons at the end of statements
- Trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters
- Use Prettier-compatible formatting (ESLint handles this via eslint-config-next)

### TypeScript
- Use TypeScript for all new files (.ts and .tsx extensions)
- Enable strict mode in tsconfig.json (already enabled)
- Explicitly type function parameters and return values
- Use interfaces for object shapes
- Use type aliases for complex types
- Prefer `type` over `interface` for union/intersection types
- Use TypeScript enums for fixed sets of related constants (see ProcessStates)
- Use type guards for runtime type checking when needed

### Naming Conventions
- **Files**: kebab-case (e.g., `my-component.tsx`)
- **Components**: PascalCase (e.g., `MyComponent`)
- **Functions**: camelCase (e.g., `myFunction`)
- **Variables**: camelCase (e.g., `myVariable`)
- **Constants**: UPPER_CASE (e.g., `MY_CONSTANT`)
- **Types/Interfaces**: PascalCase (e.g., `MyType`)
- **Boolean variables**: Prefix with `is`, `has`, `can`, etc. (e.g., `isLoading`)
- **Event handlers**: Prefix with `handle` (e.g., `handleClick`)
- **React state**: Use descriptive names (e.g., `processes`, `supervisor`)

### Error Handling
- Use try/catch blocks for asynchronous operations
- Handle errors gracefully with user-friendly messages
- Log errors for debugging purposes (consider using console.error)
- Use custom error classes for domain-specific errors
- For API calls, handle network errors and invalid responses
- Provide fallback UI states when data loading fails

### React Specific
- Use functional components with hooks
- Follow the React component naming convention (PascalCase)
- Use TypeScript interfaces for component props
- Prefer arrow functions for component definitions
- Use React.memo for performance optimization when needed
- Extract complex logic into custom hooks
- Use useEffect for side effects with proper dependency arrays
- Follow the rules of hooks (no conditional calls, etc.)

### Next.js Specific
- Use the App Router for routing (app/ directory)
- Follow Next.js file conventions for routing
- Use server components when possible for better performance
- Use client components for interactivity (mark with 'use client')
- Follow Next.js data fetching patterns (use async/await in server components)
- Use Next.js API routes for backend endpoints when needed
- Leverage Next.js optimizations (image optimization, font loading, etc.)

### State Management
- Use React's built-in useState and useReducer for local state
- For global state, consider React Context or external libraries if needed
- Keep state colocated with the components that use it
- Avoid prop drilling by lifting state up or using context
- Use derived state when possible instead of redundant state

### Code Organization
- Keep components small and focused (Single Responsibility Principle)
- Extract reusable logic into utility functions or custom hooks
- Group related components and utilities in appropriate directories
- Use feature-based organization for larger applications
- Keep business logic separate from presentation components

## Project Structure

```
react-app/
├── app/                  # Application routes and pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── supervisor.ts     # Supervisor API client
├── components/           # Reusable React components (if created)
├── lib/                  # Utility functions and shared logic (if created)
├── styles/               # Global styles and CSS (if created)
├── public/               # Static assets
│   └── favicon.png       # Favicon
└── README.md             # Project documentation

supervisor_react/
├── __init__.py           # Main backend application
└── __main__.py           # CLI entry point
```

## Development Tools

- **ESLint**: JavaScript/TypeScript linting (configured with Next.js defaults)
- **TypeScript**: Type checking with strict mode
- **Next.js**: React framework for server-side rendering and static sites
- **Pre-commit**: Git hook manager for code quality
- **Ruff**: Python linter/formatter (for Python backend)
- **Updatecli**: Dependency management and automation

## Best Practices

1. **Code Quality**: Write clean, readable, and maintainable code
2. **Consistency**: Follow the existing code patterns in the project
3. **Modularity**: Keep functions and components small and focused
4. **Documentation**: Write meaningful commit messages and document complex logic
5. **Accessibility**: Use semantic HTML and follow accessibility best practices
6. **Performance**: Optimize performance where needed (memoization, lazy loading, etc.)
7. **Testing**: Write tests for critical functionality (when test framework is configured)
8. **Dependencies**: Keep dependencies updated and minimal
9. **Security**: Handle user input safely and avoid XSS vulnerabilities
10. **Type Safety**: Leverage TypeScript for better code reliability

## TypeScript Best Practices

- Use strict null checks (enabled in tsconfig.json)
- Prefer union types over any type
- Use type assertions sparingly
- Create type guards for complex type checking
- Use mapped types for transforming existing types
- Leverage utility types (Partial, Pick, Omit, etc.)

## React Hooks Best Practices

- Use useCallback for memoizing functions passed as props
- Use useMemo for expensive calculations
- Clean up side effects in useEffect return functions
- Avoid object/array dependencies in useEffect - memoize them instead
- Use custom hooks to extract and reuse stateful logic

## API Communication Patterns

- Centralize API calls in service classes (like Supervisor class)
- Handle loading and error states consistently
- Use async/await for cleaner asynchronous code
- Provide proper TypeScript types for API responses
- Implement retry logic for failed requests when appropriate

## Common Commands Summary

```bash
# Python backend
uv run supervisor-react          # run the app
uv run ruff check                # lint
uv run ruff format               # format
uv run ty check                  # type check

# React frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint

# Full build
uv build          # Build Python package (after npm run build)

# Quality checks
prek run --all-files  # Run all pre-commit hooks
npx tsc --noEmit   # Check TypeScript types
```

## Additional Notes

- This project uses Next.js 16.2.1 with React 19.2.4 and TypeScript
- The Python backend uses Starlette/uvicorn for the web server
- The codebase follows standard React and Next.js conventions
- The project is configured with pre-commit hooks for code quality
- ESLint is configured with Next.js core-web-vitals and TypeScript support
- TypeScript strict mode is enabled for better type safety
- The application communicates with Supervisor via XML-RPC calls to /RPC2 endpoint
