import { Module } from '@nestjs/common';
import { DarajaService } from './mpesa/daraja.service';
import { FlutterwaveService } from './flutterwave/flutterwave.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [DarajaService, FlutterwaveService, PaymentsService],
  exports: [DarajaService, FlutterwaveService, PaymentsService],
})
export class PaymentsModule {}
