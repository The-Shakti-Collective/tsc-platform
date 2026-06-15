import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { IdentityRepository } from '../identity/identity.repository';
import { ProfileService } from '../profile/profile.service';

type ClerkEmailAddress = {
  email_address?: string;
  id?: string;
};

type ClerkUserPayload = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
};

@Injectable()
export class ClerkProvisioningService {
  private readonly logger = new Logger(ClerkProvisioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly identityRepository: IdentityRepository,
    private readonly profileService: ProfileService,
  ) {}

  async provisionFromClerkUser(data: ClerkUserPayload): Promise<{
    clerkUserId: string;
    personId: string;
    created: boolean;
  }> {
    const clerkUserId = data.id;
    const email = this.resolvePrimaryEmail(data);
    const displayName = this.resolveDisplayName(data, email);

    const existingUser = await this.prisma.client.user.findUnique({
      where: { clerkUserId },
      select: { personId: true },
    });

    if (existingUser) {
      if (email) {
        await this.ensureEmailIdentifier(existingUser.personId, email);
      }
      await this.profileService.ensureProfileStub({
        personId: existingUser.personId,
        displayName,
      });
      return { clerkUserId, personId: existingUser.personId, created: false };
    }

    let personId: string | null = null;
    if (email) {
      const byEmail = await this.prisma.client.person.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      personId = byEmail?.id ?? null;
    }

    if (!personId) {
      const person = await this.identityRepository.createPerson({
        name: displayName,
        displayName,
        email: email ?? null,
      });
      personId = person.id;
    }

    if (email) {
      await this.ensureEmailIdentifier(personId, email);
    }

    await this.prisma.client.user.create({
      data: {
        id: newId(),
        clerkUserId,
        personId,
        platformRole: 'TEAM_MEMBER',
      },
    });

    await this.profileService.ensureProfileStub({
      personId,
      displayName,
    });

    this.logger.log(`Provisioned Clerk user ${clerkUserId} → person ${personId}`);
    return { clerkUserId, personId, created: true };
  }

  async updateFromClerkUser(data: ClerkUserPayload): Promise<void> {
    const clerkUserId = data.id;
    const user = await this.prisma.client.user.findUnique({
      where: { clerkUserId },
      select: { personId: true },
    });
    if (!user) {
      await this.provisionFromClerkUser(data);
      return;
    }

    const email = this.resolvePrimaryEmail(data);
    const displayName = this.resolveDisplayName(data, email);

    await this.prisma.client.person.update({
      where: { id: user.personId },
      data: {
        displayName,
        name: displayName,
        ...(email ? { email } : {}),
      },
    });

    if (email) {
      await this.ensureEmailIdentifier(user.personId, email);
    }
  }

  async deleteClerkUser(clerkUserId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { clerkUserId },
      select: { id: true, personId: true },
    });
    if (!user) return;

    await this.prisma.client.user.delete({ where: { id: user.id } });
    this.logger.log(`Removed User row for Clerk id ${clerkUserId} (person ${user.personId} retained)`);
  }

  private resolvePrimaryEmail(data: ClerkUserPayload): string | null {
    const addresses = data.email_addresses ?? [];
    if (addresses.length === 0) return null;

    const primary = data.primary_email_address_id
      ? addresses.find((row) => row.id === data.primary_email_address_id)
      : addresses[0];

    const email = (primary ?? addresses[0])?.email_address?.trim().toLowerCase();
    return email || null;
  }

  private resolveDisplayName(data: ClerkUserPayload, email: string | null): string {
    const parts = [data.first_name, data.last_name].filter(Boolean).map((s) => String(s).trim());
    if (parts.length > 0) return parts.join(' ');
    if (email) return email.split('@')[0] ?? 'Member';
    return 'Member';
  }

  private async ensureEmailIdentifier(personId: string, email: string): Promise<void> {
    await this.identityRepository.upsertIdentifier(personId, {
      provider: 'email',
      externalId: email,
      verified: true,
      primary: true,
    });
  }
}
