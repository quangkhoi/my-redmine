# Redmine Frontend Rules

Status: Draft
Date: 2026-07-03

## Purpose

These rules define how the Next.js frontend should be built for the Redmine migration project.

## Frontend Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios
- `next-intl`
- React Hook Form and Zod where forms are needed

## Folder Structure

Recommended structure:

```text
src/
  app/
  components/
  hooks/
  lib/
  services/
  types/
  schemas/
  constants/
messages/
```

## Core Responsibilities

### App Layer

- Own routing, page composition, and layout wiring.
- Keep page components thin.
- Avoid placing reusable logic directly in pages.

### Components

- Shared UI primitives live in `components/ui`.
- Shared shell and layout components live in `components/layouts`.
- Feature-specific UI lives in `components/features`.

### Hooks

- Orchestrate data loading and mutation flows.
- Wrap React Query behavior.
- Keep feature state logic out of presentational components.

### Services

- Own HTTP calls and API client wrappers.
- Do not put rendering logic in services.
- Keep endpoint mapping centralized.
- Normalize backend responses in a shared client layer before any page receives them.

### Types and Schemas

- Define DTOs and view models explicitly.
- Use Zod schemas for forms and runtime validation where needed.
- Keep type names stable and feature-oriented.

## UI Rules

### Rendering

- Components should render data and emit user actions.
- Avoid mixing network orchestration into visual components.
- Keep reusable UI building blocks small and composable.

### Loading and Error States

- Every data-driven screen should define loading, empty, and error states.
- Prefer predictable skeletons or placeholders over abrupt layout jumps.
- Handle expected API failures in a consistent way.

### Localization

- All user-facing strings must come from message catalogs.
- Do not hard-code labels, buttons, validation messages, or empty states.
- Keep locale keys stable and domain-oriented.

### Styling

- Prefer Tailwind utility composition over ad hoc CSS.
- Keep layout responsive from the start.
- Use shared spacing, typography, and surface patterns consistently.

## Data Rules

- Use TanStack Query for server state.
- Avoid duplicating backend truth in local state unless necessary for UX.
- Keep optimistic updates only when they clearly improve usability.
- Do not let pages interpret the same backend status code differently.

## Response Code Rules

- Create a single response-normalization layer for the whole app.
- Translate backend codes into app-level states once, near the API boundary.
- Handle `400`, `401`, `403`, `404`, and `5xx` consistently across all pages.
- Keep page components focused on rendering the normalized state, not decoding HTTP semantics.
- Prefer shared error and empty-state handlers over per-page ad hoc branching.

## API Usage Rules

- All backend communication should go through the service layer.
- Use Axios interceptors for cross-cutting auth/error handling.
- Do not call backend endpoints directly from random components.

## Form Rules

- Use React Hook Form + Zod for forms that require validation.
- Keep schema definitions close to the feature that owns the form.
- Surface validation errors in a localized and consistent way.

## Feature Rules

### Feature Boundaries

Each feature should own:

- its page composition
- its hooks
- its services if feature-specific
- its form schemas
- its localized labels and messages

### Feature Candidates

Start with the current Redmine flows:

- Dashboard
- Daily Report
- Weekly Report
- My Task
- Login Time

## Build and Release Rules

- Keep the app container-friendly from the beginning.
- Support environment-based config.
- Do not commit secrets or endpoint credentials.
- Keep the frontend build reproducible.

## Testing Rules

- Verify screens in a real browser before considering them done.
- Check console errors, network failures, loading states, and localization.
- Add component or hook tests only where they materially reduce regression risk.

