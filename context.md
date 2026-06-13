# TSC PLATFORM — MASTER CONTEXT DOCUMENT

Version: 1.0
Last Updated: June 2026

---

# PROJECT NAME

TSC

Full Form:

The Shakti Collective

---

# MISSION

The Shakti Collective (TSC) is building the operating system for the creative ecosystem.

The platform connects:

* Artists
* Managers
* Communities
* Events
* Fans
* Brands
* Agencies
* Labels
* Creators
* Service Providers

into a single ecosystem powered by identity, participation, reputation, opportunities, commerce, and intelligence.

TSC is not a music platform.

TSC is not a community platform.

TSC is not a CRM.

TSC is a Creative Ecosystem Operating System.

---

# CORE PRODUCTS

## 1. CoreKnot

Internal Operations Platform.

Purpose:

* Artist Management
* CRM
* Finance
* Bookings
* Projects
* Analytics
* Operations
* Intelligence
* Administration

Primary Users:

* TSC Team
* Artist Managers
* Operations Team
* Finance Team
* Admins

Domain:

coreknot.theshakticollective.com

Repository:

tsc-coreknot

Visibility:

Private

---

## 2. Community

Public Ecosystem Platform.

Purpose:

* Profiles
* Communities
* Events
* Activity Feed
* Collaborations
* Discovery
* Reputation
* Participation

Primary Users:

* Artists
* Fans
* Managers
* Organizers
* Community Leaders
* Creators

Domain:

community.theshakticollective.com

Repository:

tsc-community

Visibility:

Private during development

Public after launch

---

## 3. Website

Marketing and Discovery Platform.

Purpose:

* Marketing
* Landing Pages
* Blogs
* Programs
* Public Information
* SEO

Domain:

theshakticollective.com

Repository:

tsc-web

Visibility:

Public

---

## 4. API

Single Source of Truth Backend.

Purpose:

* Authentication
* Users
* Artists
* Communities
* Events
* Graph
* Reputation
* Marketplace
* Intelligence
* Notifications

Domain:

api.theshakticollective.com

Repository:

tsc-api

Visibility:

Private

---

# GITHUB ORGANIZATION

Organization Name:

TheShaktiCollective

Repositories:

* tsc-api
* tsc-coreknot
* tsc-community
* tsc-web
* tsc-shared
* tsc-infra
* tsc-docs

---

# SYSTEM OF RECORD

Single Source of Truth:

PostgreSQL

The API owns all business data.

No frontend directly owns data.

All reads and writes happen through the API.

Architecture:

Frontend
↓
API
↓
Service Layer
↓
Repository Layer
↓
PostgreSQL

---

# TECH STACK

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* Shadcn UI
* TanStack Query
* Zustand
* React Hook Form
* Zod

---

## Backend

* NestJS
* TypeScript
* Prisma ORM

---

## Database

PostgreSQL

Primary Options:

* Neon
* Railway PostgreSQL

---

## Cache

Redis

Primary Options:

* Upstash
* Railway Redis

---

## Search

Typesense

Used For:

* Artists
* Communities
* Events
* Opportunities
* Posts
* Collaborations

---

## Storage

Cloudflare R2

Used For:

* Images
* Videos
* Assets
* Documents
* Posters
* Press Kits

---

## Realtime

Socket.io

Used For:

* Notifications
* Activity Feed
* Presence
* Future Messaging

---

## Queue System

BullMQ

Used For:

* Notifications
* Emails
* Reputation Jobs
* Graph Updates
* Analytics Snapshots
* Recommendations

---

## Authentication

Clerk

Methods:

* Google
* Email OTP
* Phone OTP

Shared across:

* CoreKnot
* Community
* Website

Single Identity System.

---

# CORE DOMAIN MODEL

Root Entity:

Person

Everything begins with Person.

Roles are attached to Person.

Examples:

Person
→ Artist

Person
→ Manager

Person
→ Fan

Person
→ Organizer

Person
→ Community Leader

Person
→ Creator

One Person can have multiple roles.

---

# GRAPH MODEL

Every action creates a relationship.

Relationship Types:

* FOLLOWS
* MEMBER_OF
* ATTENDED
* COLLABORATED_WITH
* MANAGES
* WORKED_WITH
* BOOKED_BY
* OWNS
* PARTICIPATED_IN

Graph is a first-class system.

Graph powers:

* Recommendations
* Discovery
* Reputation
* Intelligence
* Matching

---

# COMMUNITY PRINCIPLES

Community is NOT a forum.

Community is:

Identity
+
Participation
+
Reputation
+
Discovery

Core Features:

* Profiles
* Communities
* Posts
* Events
* Collaborations
* Reputation
* Discovery

---

# COREKNOT PRINCIPLES

CoreKnot is NOT public.

CoreKnot is:

Operations
+
Management
+
Execution

Core Features:

* CRM
* Artist Management
* Finance
* Projects
* Contracts
* Analytics
* Intelligence

---

# PHASE ROADMAP

Phase 4

Domain Foundation

---

Phase 5

Ecosystem Intelligence

---

Phase 6

Relationship Graph

---

Phase 6.5

Participation Layer

---

Phase 7

Creator Economy

---

Phase 8

Audience Economy

---

Phase 9

Autonomous Ecosystem

---

Phase 10

Industry Infrastructure

---

Phase 11

Global Creative Network

---

Phase 12

Creator Workspace Network

---

Phase 13

Creative Operating Network

---

Phase 14

Autonomous Creative Economy

---

# PRODUCTION INFRASTRUCTURE

Cloudflare

Used For:

* DNS
* CDN
* R2 Storage

---

Vercel

Deploy:

* tsc-web
* tsc-community
* tsc-coreknot

---

Railway

Deploy:

* tsc-api
* PostgreSQL
* Redis

---

Typesense Cloud

Deploy:

* Search Cluster

---

Clerk

Deploy:

* Authentication

---

Sentry

Deploy:

* Error Monitoring

---

PostHog

Deploy:

* Product Analytics

---

BetterStack

Deploy:

* Logs
* Uptime Monitoring

---

# BRANCH STRATEGY

main

Production

---

develop

Integration

---

feature/*

Feature Development

---

# DEPLOYMENT RULES

No direct commits to main.

All changes through Pull Requests.

Required:

* Lint Pass
* Typecheck Pass
* Build Pass
* Tests Pass

Before merge.

---

# NON-NEGOTIABLE ARCHITECTURAL RULES

1. API owns data.

2. Frontends never bypass API.

3. Every major action creates graph relationships.

4. Every participation action contributes to reputation.

5. Every domain entity belongs to PostgreSQL.

6. Files never stored in database.

7. Analytics generated through jobs, never on request.

8. Shared types come from tsc-shared.

9. Authentication is centralized.

10. TSC is a Creative Ecosystem Operating System, not a collection of apps.

---

# Organization Architecture

Executive summary for multi-repo migration. Full detail: `.agents/shakti-collective-org-setup.md`. Copy-ready scaffolds: `org-scaffold/`.

## GitHub Organization

**TheShaktiCollective** — seven repositories:

| Repo | Role | Visibility |
|------|------|------------|
| tsc-api | NestJS + Prisma (95 models), SSOT | Private |
| tsc-coreknot | Internal ops | Private |
| tsc-community | Public ecosystem | Private → Public at launch |
| tsc-web | Marketing site | Public |
| tsc-shared | `@tsc/*` packages via GitHub Packages | Private |
| tsc-infra | CI templates, deploy configs, scripts | Private |
| tsc-docs | OpenAPI + developer docs | Public |

## Domains (theshakticollective.in)

- `theshakticollective.in` → tsc-web
- `api.` → tsc-api (Railway)
- `community.` → tsc-community (Vercel)
- `coreknot.` → tsc-coreknot (Vercel)
- `docs.` → tsc-docs (Vercel)

## Migration status

Current: recovering **monorepo** (`apps/api`, `apps/coreknot`, `apps/community`, `packages/*`). Build blockers may remain in analytics/api/community — fix before extract.

Recommended order: **tsc-shared → tsc-api → frontends**. Publish `@tsc/types`, `@tsc/contracts`, `@tsc/permissions`, `@tsc/community-sdk` from tsc-shared first; app repos consume via GitHub Packages instead of `workspace:*`.

## Teams

Owners, Platform, Backend, Frontend, Community, Operations — see master doc for repo permissions.

## Branch strategy

`main` (prod, protected) ← `develop` (staging, protected) ← `feature/*`. All merges via PR with lint, typecheck, test, build.

## Production services

Cloudflare (DNS, CDN, R2) · Vercel (web, community, coreknot, docs) · Railway (api, Postgres, Redis) · Typesense · Clerk · Sentry · PostHog · BetterStack

Secrets live in GitHub Organization secrets and platform env vars — never in code.

