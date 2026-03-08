# AGENTS.md

This document provides guidelines for agentic coding tools operating in this repository.

## Build/Lint/Test Commands

### Build Commands
- **Build the application**: `npm run build` (from react-app directory)
- **Run development server**: `npm run dev` (from react-app directory)
- **Start production server**: `npm run start` (from react-app directory)

### Lint Commands
- **Run ESLint**: `npm run lint` (from react-app directory)
- **Run pre-commit hooks**: `prek run --all-files` (from root directory)

### Test Commands
- No test framework is currently configured in this project
- Tests would typically run with: `npm test` (if configured)
- To run a single test file: `npm test -- path/to/test.file` (if configured)

## Code Style Guidelines

### Imports
- Use absolute imports with `@/*` alias for project files
- Group imports in this order:
  1. Node.js built-in modules
  2. External dependencies
  3. Internal project files
- Use named imports for specific exports
- Avoid wildcard imports (`import * as`) unless necessary

### Formatting
- Use Prettier for code formatting (configured via .prettierrc if present)
- 2-space indentation
- Single quotes for strings
- Semicolons at the end of statements
- Trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters

### TypeScript
- Use TypeScript for all new files
- Enable strict mode in tsconfig.json
- Explicitly type function parameters and return values
- Use interfaces for object shapes
- Use type aliases for complex types
- Prefer `type` over `interface` for union/intersection types

### Naming Conventions
- **Files**: kebab-case (e.g., `my-component.tsx`)
- **Components**: PascalCase (e.g., `MyComponent`)
- **Functions**: camelCase (e.g., `myFunction`)
- **Variables**: camelCase (e.g., `myVariable`)
- **Constants**: UPPER_CASE (e.g., `MY_CONSTANT`)
- **Types/Interfaces**: PascalCase (e.g., `MyType`)
- **Boolean variables**: Prefix with `is`, `has`, `can`, etc. (e.g., `isLoading`)

### Error Handling
- Use try/catch blocks for asynchronous operations
- Handle errors gracefully with user-friendly messages
- Log errors for debugging purposes
- Use custom error classes for domain-specific errors

### React Specific
- Use functional components with hooks
- Follow the React component naming convention (PascalCase)
- Use TypeScript interfaces for component props
- Prefer arrow functions for component definitions
- Use React.memo for performance optimization when needed

### Next.js Specific
- Use the App Router for routing
- Follow Next.js file conventions for routing
- Use server components when possible
- Use client components for interactivity
- Follow Next.js data fetching patterns

## Project Structure

- `react-app/` - Main Next.js application
- `react-app/app/` - Application routes and pages
- `react-app/components/` - Reusable React components
- `react-app/lib/` - Utility functions and shared logic
- `react-app/styles/` - Global styles and CSS
- `react-app/public/` - Static assets

## Development Tools

- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Type checking
- **Next.js**: React framework
- **Pre-commit**: Git hook manager
- **Ruff**: Python linter/formatter (if Python code exists)
- **Updatecli**: Dependency management and automation

## Best Practices

1. Write clean, readable, and maintainable code
2. Follow the existing code patterns in the project
3. Keep functions small and focused
4. Write meaningful commit messages
5. Document complex logic with comments
6. Use semantic HTML where appropriate
7. Follow accessibility best practices
8. Optimize performance where needed
9. Write tests for critical functionality
10. Keep dependencies updated

## Additional Notes

- This project uses Next.js with TypeScript
- The codebase follows standard React and Next.js conventions
- No specific Cursor or Copilot rules were found in the repository
- The project is configured with pre-commit hooks for code quality
- ESLint is configured with Next.js defaults

## Common Commands Summary

```bash
# From react-app directory
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint

# From root directory
prek run --all-files  # Run all pre-commit hooks
```