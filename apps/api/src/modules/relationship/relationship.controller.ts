import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  GraphEntityTypeSchema,
  RelationshipCreateSchema,
  RelationshipGraphQuerySchema,
  RelationshipListQuerySchema,
  RelationshipUpdateSchema,
} from '@tsc/contracts';
import type { GraphEntityType } from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { RelationshipService } from './relationship.service';

@Controller('relationships')
@UseGuards(ClerkAuthGuard)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Get('types')
  listTypes() {
    return this.relationshipService.listRelationshipTypes();
  }

  @Get('graph/:entityType/:entityId')
  getEntityGraph(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsedType = GraphEntityTypeSchema.parse(entityType);
    return this.relationshipService.getEntitySubgraph(
      parsedType as GraphEntityType,
      entityId,
      parseSchema(RelationshipGraphQuerySchema, query),
      ctx,
    );
  }

  @Get()
  listRelationships(@Query() query: Record<string, unknown>) {
    return this.relationshipService.listRelationships(
      parseSchema(RelationshipListQuerySchema, query),
    );
  }

  @Get(':id')
  getRelationship(@Param('id') id: string) {
    return this.relationshipService.getRelationship(id);
  }

  @Post()
  createRelationship(@Body() body: unknown) {
    return this.relationshipService.createRelationship(
      parseSchema(RelationshipCreateSchema, body),
    );
  }

  @Patch(':id')
  updateRelationship(@Param('id') id: string, @Body() body: unknown) {
    return this.relationshipService.updateRelationship(
      id,
      parseSchema(RelationshipUpdateSchema, body),
    );
  }

  @Delete(':id')
  deleteRelationship(@Param('id') id: string) {
    return this.relationshipService.deleteRelationship(id);
  }
}
