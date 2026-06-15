import { Module } from '@nestjs/common';
import { HealthModule } from '../health/health.module';
import { SearchModule } from '../search/search.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [HealthModule, SearchModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
