# Event detail — Phase 6.5 Sprint 2 + Phase 8 Step 7 intelligence



No dedicated event detail page exists in this partial workspace. Wire components when a page is added.



## Components



```jsx

import { EventRegisterButton } from '../../../components/events/EventRegisterButton';

import EventIntelligencePanel from '../../../components/events/EventIntelligencePanel';
import EventAgentPanel from '../../../components/events/EventAgentPanel';



// Inside event detail layout:

<EventRegisterButton eventId={event.id} />

<EventAgentPanel eventId={event.id} />

<EventIntelligencePanel eventId={event.id} showAdminRefresh={isOrganizer} />

```



## Routes (suggested)



```jsx

{ path: '/operating/events/:eventId', element: <EventDetailPage /> }

```



## API proxy



Ensure CoreKnot dev proxy forwards:



- `POST /api/events/:id/register`

- `POST /api/events/:id/check-in`

- `GET /api/events/:id/participants`

- `PATCH /api/events/:id/participants/:personId/role`

- `GET /api/events/:id/intelligence`

- `GET /api/events/:id/intelligence/predict`

- `POST /api/events/:id/intelligence/refresh`

- `GET /api/events/:id/intelligence/recommendations`

- `GET /api/events/intelligence/insights/cities`

- `GET /api/events/intelligence/insights/conversion-leaders`

- `GET /api/events/intelligence/insights/repeat-attendance`

- `POST /api/agents/event/run/:eventId`

- `GET /api/agents/event/insights/:eventId`

- `POST /api/agents/event/suggestions/:id/approve`

- `POST /api/agents/event/suggestions/:id/dismiss`



## Client



- `apps/coreknot/client/src/lib/eventApi.js` — participation mock fallback

- `apps/coreknot/client/src/lib/eventIntelligenceApi.js` — intelligence + mock fallback

- `apps/coreknot/client/src/components/events/EventIntelligencePanel.jsx` — KPI panel

- `apps/coreknot/client/src/lib/eventAgentApi.js` — Event Agent API + mock fallback

- `apps/coreknot/client/src/components/events/EventAgentPanel.jsx` — pre/post agent panel

- `apps/coreknot/client/src/hooks/queries/event.js` — React Query hooks (optional)



## Ecosystem passport



Events section continues to read `ATTENDED` / `PERFORMED_AT` relationship edges created by participation register/role flows.

