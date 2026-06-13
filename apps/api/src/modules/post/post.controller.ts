import { Controller, Get } from '@nestjs/common';

@Controller('posts')
export class PostController {
  @Get('health')
  health() {
    return { module: 'post', status: 'stub', sprint: 1 };
  }
}
