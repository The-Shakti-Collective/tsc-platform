import { Injectable, NotFoundException } from '@nestjs/common';
import type { RoyaltyListQuery, RoyaltyStatementCreateInput } from './schema';
import { RoyaltiesRepository } from './royalties.repository';

@Injectable()
export class RoyaltiesService {
  constructor(private readonly repository: RoyaltiesRepository) {}

  listRoyalties(query: RoyaltyListQuery) {
    return this.repository.listRoyalties(undefined, query.limit).then((items) => ({
      items,
      stub: false,
    }));
  }

  listStatements(query: RoyaltyListQuery) {
    return this.repository
      .listStatements(query.organizationId, query.artistId, query.limit)
      .then((items) => ({ items }));
  }

  async getStatement(id: string) {
    const statement = await this.repository.findStatementById(id);
    if (!statement) {
      throw new NotFoundException(`Royalty statement ${id} not found`);
    }
    return statement;
  }

  createStatement(input: RoyaltyStatementCreateInput) {
    return this.repository.createStatement(input);
  }
}
