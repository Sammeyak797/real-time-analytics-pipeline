import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async getAnalytics() {
    return this.redisService.getMetrics();
  }
}
