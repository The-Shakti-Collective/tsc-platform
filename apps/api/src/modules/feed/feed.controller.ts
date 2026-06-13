import { Controller, Get } from '@nestjs/common';

@Controller('feed')
export class FeedController {
  @Get('health')
  health() {
    return { module: 'feed', status: 'stub', sprint: 1 };
  }
}
