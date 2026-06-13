# Ecosystem Copilot — CoreKnot router integration (Phase 9 Step 9)

## App.jsx (or routes file)

```jsx
import CopilotPage from './pages/copilot/CopilotPage';

<Route path="/copilot" element={<CopilotPage />} />
<Route path="/operating/copilot" element={<CopilotPage />} />
```

## ExecutiveCommandCenterPage.jsx

Panel is wired below Automation Engine V2 (see file). Optional floating button:

```jsx
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

<Link
  to="/copilot"
  className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-lg hover:opacity-90"
>
  <Sparkles size={16} />
  Copilot
</Link>
```

## API proxy

Ensure `/api/agents/copilot/*` proxies to `@tsc/api` (same as other agent routes).

## Endpoints

| Method | Route |
|--------|-------|
| POST | `/api/agents/copilot/query` |
| GET | `/api/agents/copilot/suggestions` |
| POST | `/api/agents/copilot/feedback` |

Body for query: `{ message, personId?, artistId?, context? }`
