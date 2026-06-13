# 07 — Community Completion

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 7 of 15 |

## Mission

Complete Community product surface: social feed, posts, events integration, PostHog retention events, auth flows.

## Input

- `apps/community/`
- API modules: `feed`, `post`, `event`, `community`, `fan`
- Agents 04, 06 progress
- `@tsc/community-sdk`, `@tsc/ui`

## Tasks

1. Wire feed UI to non-stub feed API (or implement feed module if still stubbed).
2. Implement post create/list flows with error states.
3. Connect event listing and RSVP to API participation endpoints.
4. Add PostHog events for key retention actions (view feed, create post, RSVP).
5. Verify Clerk/stub auth flows end-to-end in Community.
6. Audit `NEXT_PUBLIC_API_URL` and CORS with running API.
7. Run production build and document any SSR/env gaps.

## Verification commands

```powershell
pnpm --filter @tsc/community build
pnpm dev:community
Invoke-RestMethod http://127.0.0.1:3000/api/health -ErrorAction SilentlyContinue
rg "posthog|capture" apps/community
curl.exe -s http://127.0.0.1:4000/api/feed/health
```

## Deliverable path

`.agents/reports/execution/07-community-completion.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Feed | Renders real data or empty state (not PlaceholderPage) |
| Posts | Create flow works against local API |
| Analytics | At least 3 PostHog events instrumented |
| Build | `pnpm --filter @tsc/community build` exit 0 |
| Auth | Sign-in path documented WORKING |
