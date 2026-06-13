import type {
  ProjectMemberRoleValue,
  ProjectStatusValue,
  ProjectTypeValue,
} from '@tsc/database';

export type ProjectType = ProjectTypeValue;
export type ProjectStatus = ProjectStatusValue;
export type ProjectMemberRole = ProjectMemberRoleValue;

export interface ProjectMemberSummary {
  projectId: string;
  personId: string;
  displayName: string;
  slug: string | null;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectSummary {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  type: ProjectType;
  description: string | null;
  status: ProjectStatus;
  budget: number | null;
  currency: string | null;
  timelineStart: string | null;
  timelineEnd: string | null;
  metadata: Record<string, unknown>;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailPayload extends ProjectSummary {
  members: ProjectMemberSummary[];
}

export interface ProjectCreateInput {
  name: string;
  slug?: string;
  type?: ProjectType;
  description?: string;
  status?: ProjectStatus;
  budget?: number;
  currency?: string;
  timelineStart?: string;
  timelineEnd?: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectPatchInput {
  name?: string;
  type?: ProjectType;
  description?: string | null;
  status?: ProjectStatus;
  budget?: number | null;
  currency?: string | null;
  timelineStart?: string | null;
  timelineEnd?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectMemberAddInput {
  personId: string;
  role?: ProjectMemberRole;
}

export interface ProjectsListPayload {
  workspaceSlug: string;
  items: ProjectSummary[];
  updatedAt: string;
}

export interface ProjectMembersPayload {
  workspaceSlug: string;
  projectSlug: string;
  items: ProjectMemberSummary[];
  updatedAt: string;
}
