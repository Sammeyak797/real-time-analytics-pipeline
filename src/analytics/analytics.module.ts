import { Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
