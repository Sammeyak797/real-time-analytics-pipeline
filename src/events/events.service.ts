import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { KafkaService } from '../kafka/kafka.service';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    private readonly kafkaService: KafkaService,

    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async publishEvent(event: unknown) {
    await this.kafkaService.publishEvent(event);

    return {
      status: 'published',
    };
  }

  async saveEvent(event: {
    eventId: string;
    type: string;
    userId: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.eventModel.create({
      ...event,
      timestamp: new Date(event.timestamp),
    });
  }
}
