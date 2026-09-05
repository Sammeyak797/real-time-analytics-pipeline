import { Module } from '@nestjs/common';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventsModule } from '../events/events.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EventsModule, WebsocketModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
