import { Module } from '@nestjs/common';
import { ConversionsService } from './conversions.service';

@Module({
  providers: [ConversionsService],
  exports: [ConversionsService],
})
export class ConversionsModule {}
