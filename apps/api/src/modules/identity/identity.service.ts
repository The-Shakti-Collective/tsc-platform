import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  MergeIdentityInput,
  MergeIdentityPayload,
  Person360Payload,
  PersonCoreSummary,
  ResolveIdentityInput,
  ResolveIdentityPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { z } from 'zod';
import { PersonUpdateSchema } from '@tsc/contracts/identity';
import { IdentityRepository } from './identity.repository';
import { IdentityResolutionService } from './identity-resolution.service';

type PersonUpdateInput = z.infer<typeof PersonUpdateSchema>;

@Injectable()
export class IdentityService {
  constructor(
    private readonly resolutionService: IdentityResolutionService,
    private readonly repository: IdentityRepository,
  ) {}

  resolve(
    input: ResolveIdentityInput,
    _ctx: MembershipContext,
  ): Promise<ResolveIdentityPayload> {
    return this.resolutionService.resolve(input);
  }

  merge(
    input: MergeIdentityInput,
    _ctx: MembershipContext,
  ): Promise<MergeIdentityPayload> {
    return this.resolutionService.merge(input);
  }

  getPerson360(
    personId: string,
    _ctx: MembershipContext,
  ): Promise<Person360Payload> {
    return this.resolutionService.getPerson360(personId);
  }

  async getPerson(personId: string): Promise<PersonCoreSummary> {
    const person = await this.repository.findActivePerson(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found`);
    }
    return toPersonSummary(person);
  }

  async getPersonByUsername(username: string): Promise<PersonCoreSummary & { profileSlug: string | null }> {
    const profile = await this.repository.findProfileByUsername(username);
    if (!profile?.person) {
      throw new NotFoundException(`Username ${username} not found`);
    }
    return {
      ...toPersonSummary(profile.person),
      profileSlug: profile.slug,
    };
  }

  async updatePerson(
    personId: string,
    input: PersonUpdateInput,
    _ctx: MembershipContext,
  ): Promise<PersonCoreSummary> {
    const existing = await this.repository.findActivePerson(personId);
    if (!existing) {
      throw new NotFoundException(`Person ${personId} not found`);
    }

    const updated = await this.repository.updatePerson(personId, {
      name: input.name,
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
    });

    return toPersonSummary(updated);
  }
}

function toPersonSummary(person: {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  mergedIntoId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PersonCoreSummary {
  return {
    id: person.id,
    name: person.name,
    displayName: person.displayName,
    email: person.email,
    phone: person.phone,
    mergedIntoId: person.mergedIntoId,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}
