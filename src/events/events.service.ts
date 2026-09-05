import { Injectable } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class EventsService {
  constructor(private readonly kafkaService: KafkaService) {}

  async publishEvent(event: unknown) {
    await this.kafkaService.publishEvent(event);

    return {
      status: 'published',
    };
  }
}
