# Redmine Frontend Rules

Status: Draft
Date: 2026-07-03

## Purpose

These rules define how the Next.js frontend should be built for the Redmine migration project.
Their main goal is to keep the structure stable while the product grows.

## Frontend Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios
- `next-intl`
- React Hook Form and Zod where forms are needed

## Core Architecture Goal

- The frontend must be ready for long-term feature growth without repeated structural rewrites.
- New features should reuse the existing route group, shared shell, feature folders, and service conventions.
- Adding a feature must not require changing the root layout, global providers, or top-level folder strategy unless there is a true platform-level need.

## Folder Structure

Recommended structure:

```text
src/
  app/
    (admin)/
    api/                # only if route handlers become necessary
    globals.css
    layout.tsx
    providers.tsx
  components/
    features/
    layouts/
    ui/
  config/
  hooks/
    queries/
    mutations/
  lib/
    http/
    utils/
  services/
  types/
    api/
    view-models/
  schemas/
  constants/
messages/
```

## Structure Rules

- `src/app` is for routes, route groups, layouts, and page composition only.
- `src/components/layouts` is for shared shells and cross-page layout wrappers.
- `src/components/features/<feature>` is for feature-owned UI composition.
- `src/components/ui` is for reusable primitives only.
- `src/services` is for API calls and service adapters only.
- `src/hooks/queries` and `src/hooks/mutations` are for state orchestration and data workflows.
- `src/config` is for static app-level configuration such as navigation, feature flags, and route metadata.
- `src/types/api` is for backend DTOs and `src/types/view-models` is for frontend-facing models.
- Keep feature-specific code close to the feature, and shared code clearly separated.

## Core Responsibilities

### App Layer

- Own routing, page composition, and layout wiring.
- Keep page components thin.
- Avoid placing reusable logic directly in pages.
- Use route groups for major product areas, especially admin or authenticated sections.
- Prefer nested layouts for shared shells instead of duplicating shells inside pages.
- Do not introduce a new top-level folder pattern when a route group or feature folder is enough.

### Components

- Shared UI primitives live in `components/ui`.
- Shared shell and layout components live in `components/layouts`.
- Feature-specific UI lives in `components/features`.
- Do not move feature code into `app` just because it needs a route.
- Avoid creating ad hoc component folders outside the documented structure.

### Hooks

- Orchestrate data loading and mutation flows.
- Wrap React Query behavior.
- Keep feature state logic out of presentational components.
- Query hooks should remain feature-facing and not become global service layers.

### Services

- Own HTTP calls and API client wrappers.
- Do not put rendering logic in services.
- Keep endpoint mapping centralized.
- Normalize backend responses in a shared client layer before any page receives them.
- Do not let components call `fetch` or Axios directly unless the code is part of a shared service abstraction.

### Types and Schemas

- Define DTOs and view models explicitly.
- Use Zod schemas for forms and runtime validation where needed.
- Keep type names stable and feature-oriented.
- If a backend DTO is reused in multiple features, promote it into a shared API type instead of duplicating it.

## UI Rules

### Rendering

- Components should render data and emit user actions.
- Avoid mixing network orchestration into visual components.
- Keep reusable UI building blocks small and composable.
- Page-specific UI should be built from feature components and shared layout shells, not from custom one-off page scaffolding.

### Loading and Error States

- Every data-driven screen should define loading, empty, and error states.
- Prefer predictable skeletons or placeholders over abrupt layout jumps.
- Handle expected API failures in a consistent way.
- Keep loading, empty, and error states inside the feature boundary when possible.

### Localization

- All user-facing strings must come from message catalogs.
- Do not hard-code labels, buttons, validation messages, or empty states.
- Keep locale keys stable and domain-oriented.
- Add new message namespaces by feature or route, not as one growing flat dump.

### Styling

- Prefer Tailwind utility composition over ad hoc CSS.
- Keep layout responsive from the start.
- Use shared spacing, typography, and surface patterns consistently.
- Do not add global CSS rules for a single feature unless there is no other viable option.
- Keep design tokens and layout patterns centralized.

## Data Rules

- Use TanStack Query for server state.
- Avoid duplicating backend truth in local state unless necessary for UX.
- Keep optimistic updates only when they clearly improve usability.
- Do not let pages interpret the same backend status code differently.
- Shared query behavior should live in reusable hooks or adapters, not copy-pasted into each feature.

## Response Code Rules

- Create a single response-normalization layer for the whole app.
- Translate backend codes into app-level states once, near the API boundary.
- Handle `400`, `401`, `403`, `404`, and `5xx` consistently across all pages.
- Keep page components focused on rendering the normalized state, not decoding HTTP semantics.
- Prefer shared error and empty-state handlers over per-page ad hoc branching.
- Do not branch on raw status codes in individual pages.

## API Usage Rules

- All backend communication should go through the service layer.
- Use Axios interceptors for cross-cutting auth/error handling.
- Do not call backend endpoints directly from random components.
- New endpoints should be added to the existing service layer first, then consumed through hooks or page composition.

## Form Rules

- Use React Hook Form + Zod for forms that require validation.
- Keep schema definitions close to the feature that owns the form.
- Surface validation errors in a localized and consistent way.
- Shared form primitives should be reused across features when possible.

## Feature Rules

### Feature Boundaries

Each feature should own:

- its page composition
- its hooks
- its services if feature-specific
- its form schemas
- its localized labels and messages

### Feature Isolation Rules

- A feature may add a new route, but it must fit inside the existing route group and layout strategy.
- A feature must not create a new top-level app pattern.
- A feature should not alter root app providers, the root layout, or the global route tree unless it is truly platform-wide.
- If a feature needs a shared shell, put it in `components/layouts` or a route-group layout, not in the page file.
- If a feature is reusable by multiple routes, extract it once rather than copying it.

### Feature Candidates

Start with the current Redmine flows:

- Dashboard
- Daily Report
- Weekly Report
- My Task
- Login Time

### Future Growth Targets

The frontend should remain ready for future work such as:

- Annual leave management
- Logtime export to Excel
- Project data storage and schema catalog
- Column-name and Japanese-definition mapping
- Wiki-based troubleshooting knowledge
- Operational search and retrieval across stored project knowledge

These future areas should be added as new routes, feature folders, or service boundaries without changing the foundational app structure.

## Build and Release Rules

- Keep the app container-friendly from the beginning.
- Support environment-based config.
- Do not commit secrets or endpoint credentials.
- Keep the frontend build reproducible.
- Treat build failures and type errors as structure regressions, not just code regressions.

## Testing Rules

- Verify screens in a real browser before considering them done.
- Check console errors, network failures, loading states, and localization.
- Add component or hook tests only where they materially reduce regression risk.
- When changing structure, verify `lint`, `typecheck`, and `build` before merging.
- Prefer route-level verification for new pages and layout changes.
