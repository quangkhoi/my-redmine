# Redmine Backend Rules

Status: Draft
Date: 2026-07-03

## Purpose

These rules define how the `.NET 10` backend should be built for the Redmine migration project.

## Backend Stack

- ASP.NET Core `.NET 10`
- Clean Architecture
- DTO-based API contracts
- Optional CQRS-style use cases
- Dockerized runtime
- Mapperly for mapping
- FluentValidation for validation
- OneOf for explicit result handling

## Folder Structure

Recommended structure:

```text
redmine/
  Api/
  Application/
  Domain/
  Infrastructure/
  Services/
tests/
```

## Dependency Rules

- `Domain` depends on nothing in the application stack.
- `Application` depends only on `Domain` and abstractions it defines or consumes.
- `Infrastructure` depends on `Application` and `Domain`, never on `Api`.
- `Api` depends on `Application` and `Infrastructure` for wiring only.
- `Services` may depend on `Application` and `Domain`, but they must not reintroduce transport concerns.
- Never let outer layers leak framework types into inner layers.

## Layer Responsibilities

### Domain

- Own entities, value objects, and business invariants.
- Contain no transport or persistence code.
- Keep logic deterministic and unit-testable.

### Application

- Own use cases, commands, queries, and orchestration.
- Accept abstractions for external dependencies.
- Return DTOs or result models, not ORM entities or raw vendor payloads.
- Prefer explicit use case results through `OneOf` when outcomes are small and known.

### Infrastructure

- Own Redmine API clients and any future integration adapters.
- Implement interfaces defined by Application or Domain.
- Hide transport details from the rest of the system.
- Can depend on framework libraries, HTTP clients, serialization, cache, and logging concerns.

### Api

- Own controllers, request models, response mapping, authentication setup, and exception middleware.
- Stay thin.
- Do not place business rules directly in controllers.
- Prefer `Mapperly` for request and response mapping.
- Can depend on `Application` and `Infrastructure` for composition, but not on `Domain` internals directly.

## Coding Rules

### Controllers

- Controllers should do minimal work.
- Validate HTTP-level concerns only.
- Delegate to application use cases.

### Use Cases

- One use case should represent one business action.
- Keep handlers short and focused.
- Avoid mixing unrelated operations in the same handler.

### DTOs

- Use explicit DTOs for every endpoint.
- Do not expose internal domain models directly.
- Keep DTO names stable and descriptive.

### Validation

- Validate at the boundary before business logic runs.
- Prefer request-specific validators via `FluentValidation`.
- Keep validation messages consistent and human-readable.

### Error Handling

- Centralize exception handling.
- Convert failures into predictable API responses.
- Do not leak stack traces or transport internals to the client.
- Standardize error envelopes so the frontend can normalize responses in one place.

### Logging

- Log business-relevant events and failures.
- Avoid noisy logs for expected control flow.
- Include enough context to debug Redmine integration problems.

## Redmine Integration Rules

- Treat Redmine as an external system.
- Wrap all Redmine calls behind a client or adapter abstraction.
- Never couple application code directly to Redmine response shapes.
- Normalize Redmine data into backend DTOs before sending it to the frontend.
- Keep integration resilience in `Services` or `Infrastructure`, not in controllers.

## Dependency Guidance

Strongly recommended:

- `Mapperly`
- `FluentValidation`
- `OneOf`
- `MediatR`
- `Serilog`
- `Swashbuckle.AspNetCore` or `NSwag`

Useful when needed:

- `Hellang.Middleware.ProblemDetails`
- `Polly`
- `OpenTelemetry`
- `Scrutor` for assembly scanning and DI registration hygiene

Only add a dependency when it removes real repetition or risk.

## Data Rules

- Do not persist Redmine data unless there is a clear project need.
- If persistence is added later, keep it behind repository interfaces.
- Prefer read models and cached projections only when they solve a real performance or usability problem.

## Testing Rules

- Unit test domain and application logic.
- Mock external Redmine dependencies in application tests.
- Add integration tests for API endpoints and Redmine adapter behavior where practical.

## Release Rules

- Build backend images with Docker.
- Keep runtime config in environment variables.
- Do not commit secrets.
- Support local development without requiring manual machine setup.
