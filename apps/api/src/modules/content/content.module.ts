import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { ContentController } from './content.controller';
import { ContentRepository } from './content.repository';
import { ContentService } from './content.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [ContentRepository, ContentService],
  exports: [ContentService],
})
export class ContentModule {}
