import { Injectable } from '@nestjs/common';
import type {
  DistributionChannelCreateInput,
  DistributionListQuery,
  DistributionSubmissionCreateInput,
} from './schema';
import { DistrokidAdapter } from './adapters/distrokid.adapter';
import { DistributionRepository } from './distribution.repository';

@Injectable()
export class DistributionService {
  constructor(
    private readonly repository: DistributionRepository,
    private readonly distrokid: DistrokidAdapter,
  ) {}

  listChannels(query: DistributionListQuery) {
    return this.repository.listChannels(query.artistId, query.limit).then((items) => ({
      items,
    }));
  }

  createChannel(input: DistributionChannelCreateInput) {
    return this.repository.createChannel(input);
  }

  listSubmissions(query: DistributionListQuery) {
    return this.repository
      .listSubmissions(query.channelId, query.limit)
      .then((items) => ({ items }));
  }

  async createSubmission(input: DistributionSubmissionCreateInput) {
    const submission = await this.repository.createSubmission(input);
    const channel = await this.repository.findChannelById(input.channelId);

    if (channel?.provider === 'distrokid') {
      const stub = await this.distrokid.submitRelease({
        title: input.title,
        upc: input.upc,
        isrc: input.isrc,
      });
      return { ...submission, providerStub: stub };
    }

    return submission;
  }
}
