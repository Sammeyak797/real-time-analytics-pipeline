import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  collection: 'events',
  timestamps: true,
})
export class Event {
  @Prop({ required: true, unique: true, index: true })
  eventId: string;

  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
