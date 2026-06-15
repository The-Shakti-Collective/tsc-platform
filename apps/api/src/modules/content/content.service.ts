import { Injectable } from '@nestjs/common';
import type {
  ContentAssetCreateInput,
  ContentItemCreateInput,
  ContentItemPatchInput,
  ContentListQuery,
} from './schema';
import { ContentRepository } from './content.repository';

@Injectable()
export class ContentService {
  constructor(private readonly repository: ContentRepository) {}

  listAssets(query: ContentListQuery) {
    return this.repository
      .listAssets(query.artistId, query.releaseId, query.limit)
      .then((items) => ({ items }));
  }

  createAsset(input: ContentAssetCreateInput) {
    return this.repository.createAsset(input);
  }

  listItems(query: ContentListQuery) {
    return this.repository.listItems(query.artistId, query.limit).then((items) => ({ items }));
  }

  createItem(input: ContentItemCreateInput) {
    return this.repository.createItem(input);
  }

  patchItem(id: string, input: ContentItemPatchInput) {
    const data: ContentItemPatchInput & { publishedAt?: Date } = { ...input };
    if (input.status === 'published') {
      data.publishedAt = new Date();
    }
    return this.repository.patchItem(id, data);
  }
}
