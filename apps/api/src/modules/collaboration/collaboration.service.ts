import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  CollaborationApplicationSummary,
  CollaborationApplicationsPayload,
  CollaborationBrowsePayload,
  CollaborationCreatedPayload,
  CollaborationDetail,
  CollaborationSummary,
} from '@tsc/types';
import { collaborationCreatorName } from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import {
  assertCollaborationApplicationTransition,
  InvalidCollaborationApplicationTransitionError,
} from './application-state';
import type {
  CollaborationApplicationUpdateInput,
  CollaborationApplyInput,
  CollaborationBrowseQuery,
  CollaborationCreateInput,
  CollaborationUpdateInput,
} from './dto';
import {
  CollaborationRepository,
  type CollaborationApplicationRow,
  type CollaborationRow,
} from './collaboration.repository';

@Injectable()
export class CollaborationService {
  constructor(
    private readonly repository: CollaborationRepository,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
  ) {}

  browse(query: CollaborationBrowseQuery): Promise<CollaborationBrowsePayload> {
    this.assertAvailable();
    return this.repository.browse(query).then((rows) => ({
      items: rows.map((row) => this.toSummary(row)),
      filters: {
        type: query.type ?? null,
        genre: query.genre ?? null,
        city: query.city ?? null,
        status: query.status ?? 'open',
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  async getDetail(id: string, ctx: MembershipContext): Promise<CollaborationDetail> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Collaboration ${id} not found`);

    const personId = ctx.personId;
    const myApplication = personId
      ? await this.repository.findApplication(id, personId)
      : null;

    const isCreator = personId === row.creatorPersonId;
    const applications = (row.applications ?? []).map((app) =>
      this.toApplicationSummary(app),
    );

    return {
      ...this.toSummary(row),
      isCreator,
      applications: isCreator ? applications : [],
      myApplication: myApplication ? this.toApplicationSummary(myApplication) : null,
    };
  }

  async create(
    input: CollaborationCreateInput,
    ctx: MembershipContext,
  ): Promise<CollaborationSummary> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);

    const row = await this.repository.create(input, personId);
    if (!row) throw new ServiceUnavailableException('Collaboration persistence failed');

    await this.activityService.record({
      actorPersonId: personId,
      action: 'posted_collaboration',
      targetType: 'Collaboration',
      targetId: row.id,
      metadata: {
        collaborationTitle: row.title,
        collaborationType: row.type,
        city: row.city,
      },
    });

    return this.toSummary(row);
  }

  async update(
    id: string,
    input: CollaborationUpdateInput,
    ctx: MembershipContext,
  ): Promise<CollaborationDetail> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Collaboration ${id} not found`);
    if (existing.creatorPersonId !== personId) {
      throw new ForbiddenException('Only the creator can update this collaboration');
    }

    const row = await this.repository.update(id, input);
    if (!row) throw new ServiceUnavailableException('Collaboration update failed');

    return this.getDetail(id, ctx);
  }

  async apply(
    id: string,
    input: CollaborationApplyInput,
    ctx: MembershipContext,
  ): Promise<CollaborationApplicationSummary> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const collaboration = await this.repository.findById(id);
    if (!collaboration) throw new NotFoundException(`Collaboration ${id} not found`);

    if (collaboration.creatorPersonId === personId) {
      throw new BadRequestException('Cannot apply to your own collaboration');
    }
    if (collaboration.status !== 'open') {
      throw new BadRequestException(`Collaboration is ${collaboration.status}`);
    }

    const existing = await this.repository.findApplication(id, personId);
    if (existing && existing.status !== 'withdrawn') {
      try {
        assertCollaborationApplicationTransition(existing.status, 'applied');
      } catch (error) {
        if (error instanceof InvalidCollaborationApplicationTransitionError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    }

    const application = await this.repository.upsertApplication({
      collaborationId: id,
      applicantPersonId: personId,
      message: input.message,
    });
    if (!application) {
      throw new ServiceUnavailableException('Application persistence failed');
    }

    await this.activityService.record({
      actorPersonId: personId,
      action: 'applied_collaboration',
      targetType: 'Collaboration',
      targetId: id,
      metadata: {
        collaborationTitle: collaboration.title,
        applicationId: application.id,
      },
    });

    return this.toApplicationSummary(application);
  }

  async updateApplication(
    collaborationId: string,
    applicationId: string,
    input: CollaborationApplicationUpdateInput,
    ctx: MembershipContext,
  ): Promise<CollaborationApplicationSummary> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const collaboration = await this.repository.findById(collaborationId);
    if (!collaboration) {
      throw new NotFoundException(`Collaboration ${collaborationId} not found`);
    }
    if (collaboration.creatorPersonId !== personId) {
      throw new ForbiddenException('Only the creator can manage applications');
    }

    const application = await this.repository.findApplicationById(applicationId);
    if (!application || application.collaborationId !== collaborationId) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    try {
      assertCollaborationApplicationTransition(application.status, input.status);
    } catch (error) {
      if (error instanceof InvalidCollaborationApplicationTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const updated = await this.repository.updateApplicationStatus(
      applicationId,
      input.status,
    );
    if (!updated) {
      throw new ServiceUnavailableException('Application update failed');
    }

    if (input.status === 'accepted') {
      await this.repository.upsertCollaborationRelationships(
        collaboration.creatorPersonId,
        application.applicantPersonId,
      );
      await this.repository.update(collaborationId, { status: 'filled' });
      void this.creditsService.earnFromCollaborationAccepted(
        application.applicantPersonId,
        collaborationId,
      );
    }

    return this.toApplicationSummary(updated);
  }

  listMyCreated(ctx: MembershipContext): Promise<CollaborationCreatedPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    return this.repository.listCreatedByPerson(personId).then((rows) => ({
      items: rows.map((row) => this.toSummary(row)),
      updatedAt: new Date().toISOString(),
    }));
  }

  listMyApplications(ctx: MembershipContext): Promise<CollaborationApplicationsPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    return this.repository.listApplicationsByPerson(personId).then((rows) => ({
      items: rows.map((row) => this.toApplicationSummary(row)),
      updatedAt: new Date().toISOString(),
    }));
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Collaboration models not merged — apply phase6.5-collaboration.prisma migration',
      );
    }
  }

  private requirePersonId(ctx: MembershipContext): string {
    if (!ctx.personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return ctx.personId;
  }

  private toSummary(row: CollaborationRow): CollaborationSummary {
    const creatorName = row.creator
      ? collaborationCreatorName(row.creator)
      : row.creatorPersonId;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as CollaborationSummary['type'],
      genres: row.genres ?? [],
      city: row.city,
      status: row.status as CollaborationSummary['status'],
      creatorPersonId: row.creatorPersonId,
      creatorName,
      creatorSlug: row.creator?.profile?.slug ?? null,
      applicationCount: row._count?.applications ?? row.applications?.length ?? 0,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
    };
  }

  private toApplicationSummary(
    row: CollaborationApplicationRow,
  ): CollaborationApplicationSummary {
    const applicantName = row.applicant
      ? collaborationCreatorName(row.applicant)
      : row.applicantPersonId;

    return {
      id: row.id,
      collaborationId: row.collaborationId,
      applicantPersonId: row.applicantPersonId,
      applicantName,
      applicantSlug: row.applicant?.profile?.slug ?? null,
      message: row.message,
      status: row.status as CollaborationApplicationSummary['status'],
      appliedAt: row.appliedAt.toISOString(),
      collaboration: row.collaboration
        ? {
            id: row.collaboration.id,
            title: row.collaboration.title,
            type: row.collaboration.type as CollaborationSummary['type'],
            city: row.collaboration.city,
            status: row.collaboration.status as CollaborationSummary['status'],
          }
        : undefined,
    };
  }
}
