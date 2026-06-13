import React from 'react';
import CopilotPanel from '../../components/copilot/CopilotPanel';
import { PageContainer } from '../../components/ui/primitives';

export default function CopilotPage() {
  return (
    <PageContainer title="Ecosystem Copilot" subtitle="Natural language intelligence across the TSC ecosystem">
      <div className="max-w-3xl">
        <CopilotPanel />
      </div>
    </PageContainer>
  );
}
