import React from 'react';
import TabHubLayout from './TabHubLayout';
import ProjectsView from '../projects/ProjectsView';
import HubSectionPlaceholder from './HubSectionPlaceholder';

export default function ProjectsHub() {
  return (
    <TabHubLayout
      hubPath="/projects"
      panels={{
        active: ProjectsView,
        pipeline: () => (
          <HubSectionPlaceholder
            title="Project Pipeline"
            description="Pre-kickoff and scoping projects. Active board remains on the Active tab."
          />
        ),
        archive: () => (
          <HubSectionPlaceholder
            title="Archived Projects"
            description="Completed and archived projects — filter coming from project status."
          />
        ),
        templates: () => (
          <HubSectionPlaceholder
            title="Project Templates"
            description="Reusable project templates for repeat engagement types."
          />
        ),
      }}
    />
  );
}
