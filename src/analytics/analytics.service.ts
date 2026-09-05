import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'analytics-consumer',
    brokers: ['localhost:9092'],
  });

  private readonly consumer: Consumer = this.kafka.consumer({
    groupId: 'analytics-consumer-group',
  });

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
      },
    });

    console.log('Kafka consumer connected');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
