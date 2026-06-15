import { Injectable, NotFoundException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { canManageArtist, isAdmin } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import type { ArtistCreateInput } from './dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

@Injectable()
export class ArtistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: { limit?: number; q?: string }) {
    const rows = await this.prisma.client.artist.findMany({
      where: filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { slug: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        displayName: row.displayName,
        personId: row.personId,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    const row = await this.prisma.client.artist.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Artist ${id} not found`);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayName: row.displayName,
      bio: row.bio,
      photoUrl: row.photoUrl,
      personId: row.personId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(input: ArtistCreateInput, ctx: MembershipContext) {
    if (!isAdmin(ctx) && !ctx.personId) {
      throw new NotFoundException('Person required');
    }

    const baseSlug = input.slug ?? slugify(input.name);
    const row = await this.prisma.client.artist.create({
      data: {
        id: newId(),
        name: input.name,
        slug: baseSlug,
        displayName: input.displayName ?? null,
        personId: input.personId ?? ctx.personId ?? null,
        bio: input.bio ?? null,
      },
    });
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      personId: row.personId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async assertManage(artistId: string, ctx: MembershipContext) {
    if (!canManageArtist(ctx, artistId)) {
      throw new NotFoundException('Artist manage access denied');
    }
  }
}
