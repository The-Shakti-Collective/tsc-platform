import { Injectable, NotFoundException } from '@nestjs/common';
import type { ReleaseCreateInput, ReleaseListQuery, ReleasePatchInput } from './schema';
import { ReleasesRepository } from './releases.repository';

@Injectable()
export class ReleasesService {
  constructor(private readonly repository: ReleasesRepository) {}

  list(query: ReleaseListQuery) {
    return this.repository
      .list(query.organizationId, query.artistId, query.status, query.limit)
      .then((items) => ({ items }));
  }

  async getById(id: string) {
    const release = await this.repository.findById(id);
    if (!release) {
      throw new NotFoundException(`Release ${id} not found`);
    }
    return release;
  }

  create(input: ReleaseCreateInput) {
    return this.repository.create(input);
  }

  async   patch(id: string, input: ReleasePatchInput) {
    await this.getById(id);
    return this.repository.patch(id, input);
  }
}
