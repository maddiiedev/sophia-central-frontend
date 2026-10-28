# Sophis Central Frontend

[![Frontend CI](https://github.com/ReignnRule11/Sophia-Central-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/ReignnRule11/Sophia-Central-frontend/actions/workflows/ci.yml)

Sophis Central is an academic resource and research platform for students, lecturers, moderators, and administrators. This repository contains the React web client and implements the core MVP user journeys defined by the Sophis Central wireframe.

## Core user journeys

### Entry and account access
- Landing page with registration and login entry points.
- Role-aware application navigation after authentication.
- Institution and academic-profile onboarding fields, with student and lecturer-specific details.
- The frontend submits profile data through the configured backend API; backend validation and persistence remain authoritative.

### Student
1. Register or log in and complete academic profile onboarding.
2. Select an institution and academic details, including faculty, department, programme, and level.
3. Enter the student dashboard.
4. Browse academic materials or research resources.
5. Search and filter resources.
   - Academic materials: course/topic filters.
   - Research resources: topic, research type, and date filters where supported by the resource metadata.
6. Open an individual resource in the resource reader.
7. Save resources and revisit the saved-resources area.

Students should only be shown resources that are approved/verified for student access. Access control and resource visibility must also be enforced by the backend, not just by the client UI.

### Lecturer
1. Register or log in and complete lecturer profile onboarding.
2. Select/verify an institution and provide faculty, department, and courses taught.
3. Enter the lecturer dashboard.
4. Open the resource upload flow.
5. Add resource metadata and the resource file/link.
6. Submit the resource for review.
7. Track the resource's review state, including pending review.

The expected workflow is **Upload resource → Add resource details → Submit for review → Pending review**. Upload routes are role-restricted in the frontend; the backend must independently authorize every write.

### Moderator / administrator
- Access moderation and resource-review views according to role.
- Review submitted resources and approve or reject them.
- Access the resource library and available administration/analytics views according to assigned permissions.
- Admin-oriented navigation includes user-management and resource-review destinations where those screens are implemented.

## Main application areas

| Area | Purpose |
| --- | --- |
| Landing / authentication | Entry, registration, login |
| Onboarding | Institution and academic profile setup |
| Dashboard | Role-aware starting point |
| Resource library | Search, browse, and filter academic/research resources |
| Resource reader | View resource metadata and open/download an available resource URL |
| Saved resources | Return to resources saved by a student |
| Lecturer upload | Add metadata and submit resources for review |
| Moderation | Review pending submissions and approve/reject |
| Analytics / administration | Role-restricted administrative views |
| AI tutor | AI learning support UI, subject to configured backend/provider availability |
| Wallet | Student wallet area, subject to configured backend support |

The UI can only expose capabilities supported by the active backend and runtime configuration. A route or screen is not proof that a third-party integration, payment flow, or production provider is configured.

## Technology stack

- React 18 and TypeScript
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form and Zod
- Lucide icons

## Architecture

- `src/config/env.ts` centralizes runtime environment configuration.
- `src/lib/api/client.ts` provides the typed API client for authenticated requests.
- `src/services/*` contains domain-facing service integrations.
- `src/context/*` manages authentication and theme state.
- `src/lib/storage.ts` centralizes client-side persistence.
- Page and layout components implement role-aware navigation and user journeys.

The frontend is a client application, not a security boundary. The backend must validate sessions, roles, resource permissions, moderation actions, and ownership on every protected request.

## Local development

Requirements: a supported Node.js version and npm.

```bash
git clone https://github.com/ReignnRule11/Sophia-Central-frontend.git
cd Sophia-Central-frontend
cp .env.example .env
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Environment variables

Configure the values appropriate to your environment in `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Sophis Central
VITE_USE_MOCK_DATA=false
```

- `VITE_API_BASE_URL`: base URL for the Sophis Central backend API.
- `VITE_APP_NAME`: display name used by the application.
- `VITE_USE_MOCK_DATA`: set to `true` only for deliberate local prototyping/offline development. Keep `false` when validating real backend integration.

Never put private API keys, database credentials, signing secrets, or privileged tokens in `VITE_*` variables: Vite exposes them to the browser bundle.

## Build and validation

```bash
npm install
npm run typecheck
npm run build
```

The repository's Frontend CI workflow is the source of truth for the checks configured in GitHub Actions.

## Related repository

Backend API and database migrations: [ReignnRule11/sophia-central-backend](https://github.com/ReignnRule11/sophia-central-backend).

## Deployment notes

- Set `VITE_API_BASE_URL` to the deployed backend API URL before building the frontend.
- Configure the backend CORS policy to allow the deployed frontend origin.
- Confirm that required backend services and provider credentials are configured in the backend environment.
- Run migrations through the backend's documented migration process before relying on newly persisted profile fields.
- Verify registration/login, onboarding, role-based access, resource search/reader, saved resources, lecturer submission, and moderation against the target environment.
- CI passing indicates the configured automated checks passed; it does not alone establish that the current hosting deployment or every live end-to-end journey is healthy.
