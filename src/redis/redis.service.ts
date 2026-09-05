import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis = new Redis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );

  async onModuleInit() {
    await this.redis.ping();
    console.log('Redis connected');
  }

  async increment(key: string) {
    return this.redis.incr(key);
  }

  async addUniqueUser(userId: string) {
    return this.redis.sadd('analytics:unique_users', userId);
  }

  async getMetrics() {
    const [totalEvents, pageViews, purchases, signups, uniqueUsers] =
      await Promise.all([
        this.redis.get('analytics:total_events'),
        this.redis.get('analytics:page_views'),
        this.redis.get('analytics:purchases'),
        this.redis.get('analytics:signups'),
        this.redis.scard('analytics:unique_users'),
      ]);

    return {
      totalEvents: Number(totalEvents ?? 0),
      pageViews: Number(pageViews ?? 0),
      purchases: Number(purchases ?? 0),
      signups: Number(signups ?? 0),
      uniqueUsers,
    };
  }

  async markEventProcessed(eventId: string) {
    const key = `event:processed:${eventId}`;

    const result = await this.redis.set(key, '1', 'EX', 86400, 'NX');

    return result === 'OK';
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
