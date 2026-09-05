import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [EventsModule, KafkaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
