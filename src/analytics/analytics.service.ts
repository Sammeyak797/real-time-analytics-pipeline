import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { EventsService } from '../events/events.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'analytics-consumer',
    brokers: ['localhost:9092'],
  });

  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: 'analytics-consumer-group',
  });

  constructor(
    private readonly eventsService: EventsService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: 'analytics-events',
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const value = message.value?.toString();

        if (!value) {
          return;
        }

        const event = JSON.parse(value);

        console.log('Received event:', event);

        await this.eventsService.saveEvent(event);

        console.log('Event saved to MongoDB:', event.eventId);

        await this.redisService.increment('analytics:total_events');

        switch (event.type) {
          case 'page_view':
            await this.redisService.increment('analytics:page_views');
            break;

          case 'purchase':
            await this.redisService.increment('analytics:purchases');
            break;

          case 'signup':
            await this.redisService.increment('analytics:signups');
            break;
        }

        await this.redisService.addUniqueUser(event.userId);

        console.log('Analytics updated:', event.eventId);
      },
    });

    console.log('Kafka consumer connected');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
