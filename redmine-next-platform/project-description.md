# Redmine Migration Project Description

Status: Draft
Date: 2026-07-03

## Project Summary

This project is a migration of the current Redmine dashboard into a modern split-stack architecture:

- `.NET 10` backend API
- Next.js frontend
- Docker-based deployment

The current implementation is a static dashboard that talks to Redmine through a Cloudflare Worker proxy. The new project will keep the same business purpose but rebuild the system with clearer boundaries, stronger maintainability, and a deployment model that works well in containers.

## Why This Project Exists

The current dashboard already solves a real workflow problem:

- tracking issues by status
- generating daily and weekly reports
- showing my-task views
- inspecting login time / time entry data

However, the current implementation is a single-page static app with logic concentrated in one JavaScript file. The goal of the new project is to:

- separate domain logic from UI
- make the backend independently testable
- make the frontend easier to evolve
- support Docker from day one
- migrate functionality in safe, incremental steps

## Product Goals

1. Preserve the existing Redmine workflows.
2. Improve maintainability through a clean backend/frontend boundary.
3. Make the system easier to deploy and run consistently.
4. Enable feature-by-feature migration instead of a big-bang rewrite.
5. Keep future changes easier to test and review.

## Non-Goals

This project is not trying to:

- redesign the Redmine business domain
- replace Redmine itself
- introduce unnecessary platform complexity
- build a generic multi-tenant SaaS unless that becomes an explicit future requirement
- carry over every implementation detail from the old static app

## Current Feature Scope

The initial migration targets the same five user-facing flows:

1. Dashboard
2. Daily Report
3. Weekly Report
4. My Task
5. Login Time

These features should remain recognizable in the new system, even if their implementation changes.

## Target Architecture

### Backend

The backend will be a `.NET 10` Web API organized with Clean Architecture.

Primary responsibilities:

- Redmine integration
- business rules
- data normalization
- stable API contracts
- authentication and transport concerns

### Frontend

The frontend will be a separate Next.js application.

Primary responsibilities:

- user interface
- routing
- localization
- client-side data orchestration
- presentation and interaction logic

### Deployment

The system will be container-first.

Primary delivery targets:

- local development with Docker Compose
- production deployment with Docker images

## Migration Strategy

The migration should happen in phases:

1. Create the backend foundation.
2. Define API contracts for the first feature set.
3. Migrate one feature at a time.
4. Validate parity before removing legacy paths.
5. Add Docker packaging once the new shape is stable.

This approach reduces risk and makes it easier to compare the new behavior with the existing dashboard.

## Design Direction

The project should follow these principles:

- keep boundaries explicit
- keep contracts stable
- keep UI code presentational
- keep backend logic centralized
- keep deployment reproducible

## Expected Outcome

When this project is complete, we should have:

- a `.NET 10` backend with clean internal boundaries
- a Next.js frontend with feature-based structure
- clear API contracts between them
- Docker images and compose files for deployment
- documentation that makes the system understandable to new contributors

