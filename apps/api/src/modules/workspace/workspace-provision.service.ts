import { Injectable, Logger } from '@nestjs/common';
import {
  defaultPersonalWorkspaceName,
  extractWorkspaceIdentityLink,
  slugifyWorkspace,
  type WorkspaceTypeValue,
} from '@tsc/database';
import { WorkspaceRepository } from './workspace.repository';
import { CreativeIdentityService } from '../creative-identity/creative-identity.service';
import { toInputJson } from '../../common/json';

@Injectable()
export class WorkspaceProvisionService {
  private readonly logger = new Logger(WorkspaceProvisionService.name);

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly creativeIdentityService: CreativeIdentityService,
  ) {}

  async ensurePersonalWorkspace(
    personId: string,
    options?: {
      displayName?: string | null;
      profileSlug?: string | null;
    },
  ): Promise<{ workspaceId: string; slug: string; created: boolean } | null> {
    if (!this.repository.isAvailable()) return null;

    try {
      const existing = await this.repository.findPersonalByOwner(personId);
      if (existing) {
        await this.syncIdentityLink(existing.id, personId, existing.settings);
        return { workspaceId: existing.id, slug: existing.slug, created: false };
      }

      const profile = await this.repository.findPersonProfile(personId);
      const artist = await this.repository.findArtistByPersonId(personId);
      const profileSlug = options?.profileSlug ?? profile?.slug ?? null;
      const baseSlug = profileSlug ?? `person-${personId.slice(0, 8)}`;
      const slug = await this.uniqueSlug(baseSlug);
      const identityLink = this.buildIdentityLink(profileSlug, artist?.slug ?? null);

      const row = await this.repository.createWorkspace({
        slug,
        name: defaultPersonalWorkspaceName(options?.displayName),
        ownerPersonId: personId,
        type: 'personal',
        settings: {
          autoProvisioned: true,
          ...identityLink,
        },
      });

      if (!row) return null;

      void this.creativeIdentityService.linkWorkspaceToCreativeIdentity(row.id, personId);

      return { workspaceId: row.id, slug: row.slug, created: true };
    } catch (error) {
      this.logger.warn(
        `[workspace] personal provision failed for ${personId}: ${String(error)}`,
      );
      return null;
    }
  }

  async ensureWorkspaceForPerson(
    personId: string,
    input?: {
      name?: string;
      slug?: string;
      type?: WorkspaceTypeValue;
      displayName?: string | null;
      profileSlug?: string | null;
    },
  ) {
    if (!this.repository.isAvailable()) return null;

    const type = input?.type ?? 'personal';
    if (type === 'personal') {
      return this.ensurePersonalWorkspace(personId, {
        displayName: input?.displayName,
        profileSlug: input?.profileSlug,
      });
    }

    const slug = input?.slug
      ? await this.uniqueSlug(input.slug)
      : await this.uniqueSlug(`workspace-${personId.slice(0, 8)}`);

    const row = await this.repository.createWorkspace({
      slug,
      name: input?.name ?? 'Workspace',
      ownerPersonId: personId,
      type,
      settings: toInputJson(this.buildIdentityLink(input?.profileSlug ?? null, null)),
    });

    if (!row) return null;

    void this.creativeIdentityService.linkWorkspaceToCreativeIdentity(row.id, personId);

    return { workspaceId: row.id, slug: row.slug, created: true };
  }

  private async syncIdentityLink(
    workspaceId: string,
    personId: string,
    currentSettings: unknown,
  ): Promise<void> {
    const existing = extractWorkspaceIdentityLink(currentSettings);
    if (existing.tscIdentitySlug) return;

    const profile = await this.repository.findPersonProfile(personId);
    const artist = await this.repository.findArtistByPersonId(personId);
    const link = this.buildIdentityLink(profile?.slug ?? null, artist?.slug ?? null);
    if (!link.tscIdentitySlug) return;

    await this.repository.updateWorkspace(workspaceId, {
      settings: toInputJson({
        ...((currentSettings as Record<string, unknown>) ?? {}),
        ...link,
      }),
    });
  }

  private buildIdentityLink(
    profileSlug: string | null,
    artistSlug: string | null,
  ): Record<string, unknown> {
    if (artistSlug) {
      return {
        tscIdentitySlug: artistSlug,
        tscIdentityNamespace: 'artist',
      };
    }
    if (profileSlug) {
      return {
        tscIdentitySlug: profileSlug,
        tscIdentityNamespace: 'fan',
      };
    }
    return {
      tscIdentitySlug: null,
      tscIdentityNamespace: null,
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    const normalized = slugifyWorkspace(base) || 'workspace';
    let candidate = normalized;
    let suffix = 1;

    while (await this.repository.slugExists(candidate)) {
      candidate = `${normalized}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
