import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [WalletModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
