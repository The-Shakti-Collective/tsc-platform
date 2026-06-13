import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { DealModule } from '../deal/deal.module';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';

@Module({
  imports: [DealModule, ActivityModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PaymentAdapterFactory],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
