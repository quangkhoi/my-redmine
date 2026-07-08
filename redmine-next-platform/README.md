# redmine-next-platform

This folder is the temporary design workspace for the new Redmine project.

The target system will be:

- `.NET 10` backend API
- Next.js frontend
- Docker-based deployment

## Design Principles

- Keep the architecture stable before adding new features.
- Prefer route groups and shared layouts over page-local shell duplication.
- Add new features inside existing bounded areas instead of reshaping the app tree.
- Treat docs and rules as guardrails for future development.

## Reading Order

1. [project-description.md](project-description.md)
2. [architecture-rules.md](architecture-rules.md)
3. [backend-rules.md](backend-rules.md)
4. [frontend-rules.md](frontend-rules.md)
5. [net10-next-architecture-notes.md](net10-next-architecture-notes.md)

## Files

- `project-description.md` - project purpose, scope, and outcomes
- `architecture-rules.md` - project-wide rules
- `backend-rules.md` - backend-specific rules
- `frontend-rules.md` - frontend-specific rules
- `net10-next-architecture-notes.md` - architecture direction and migration strategy

## Status

Design phase only.

## Frontend Rule of Thumb

If a new feature needs a new route, it should first fit into the existing App Router structure, shared layouts, and feature folders before any new top-level structure is introduced.
