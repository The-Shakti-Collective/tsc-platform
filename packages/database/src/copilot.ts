/** Phase 9 Step 9 — Ecosystem Copilot intent catalog (rule-based MVP). */

export const COPILOT_AGENT_SLUG = 'copilot-agent';

export const COPILOT_INTENTS = [
  'artists_at_risk',
  'communities_growing',
  'opportunities_for_me',
  'collaboration_matches',
  'revenue_forecast',
  'fallback',
] as const;

export type CopilotIntentValue = (typeof COPILOT_INTENTS)[number];

export type CopilotIntentPattern = {
  intent: Exclude<CopilotIntentValue, 'fallback'>;
  patterns: RegExp[];
  label: string;
  description: string;
};

export const COPILOT_INTENT_CATALOG: CopilotIntentPattern[] = [
  {
    intent: 'artists_at_risk',
    label: 'Artists at risk',
    description: 'Health and churn signals from Command Center and audience insights.',
    patterns: [
      /artists?\s+at\s+risk/i,
      /show\s+artists?\s+at\s+risk/i,
      /who\s+is\s+at\s+risk/i,
      /churn\s+risk/i,
      /low\s+health/i,
      /health\s+score/i,
    ],
  },
  {
    intent: 'communities_growing',
    label: 'Growing communities',
    description: 'Fastest-growing communities from participation and talent discovery.',
    patterns: [
      /communities?\s+growing/i,
      /fastest\s+growing\s+communities/i,
      /which\s+communities\s+(are\s+)?growing/i,
      /growing\s+fastest/i,
    ],
  },
  {
    intent: 'opportunities_for_me',
    label: 'Opportunities for me',
    description: 'Opportunity Agent recommendations matched to your artist profile.',
    patterns: [
      /opportunities?\s+(for\s+me|should\s+i\s+apply)/i,
      /what\s+opportunities/i,
      /should\s+i\s+apply/i,
      /recommend(ed)?\s+opportunities/i,
    ],
  },
  {
    intent: 'collaboration_matches',
    label: 'Collaboration matches',
    description: 'Collaboration marketplace and Career Agent partner suggestions.',
    patterns: [
      /collaborat/i,
      /who\s+should\s+i\s+collaborate/i,
      /partners?\s+to\s+work\s+with/i,
      /find\s+(a\s+)?collaborator/i,
    ],
  },
  {
    intent: 'revenue_forecast',
    label: 'Revenue forecast',
    description: 'Platform revenue forecast rollup from Forecast Agent.',
    patterns: [
      /revenue\s+forecast/i,
      /forecast\s+revenue/i,
      /revenue\s+projection/i,
      /platform\s+revenue/i,
    ],
  },
];

export const COPILOT_STARTER_PROMPTS = [
  'Show artists at risk',
  'Which communities are growing fastest?',
  'What opportunities should I apply to?',
  'Who should I collaborate with?',
  'What is the revenue forecast?',
] as const;

export const COPILOT_FALLBACK_MESSAGE =
  'I can help with ecosystem questions using live intelligence. Try one of the suggested prompts below.';
