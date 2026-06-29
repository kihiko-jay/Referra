import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';

@Module({
  imports: [WalletModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
