import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toWholeKes } from '../common/money';
import { DarajaService } from './mpesa/daraja.service';

/**
 * Orchestrates real money movement against payment providers, recording each
 * attempt as a PaymentIntent. Wallet credits/payout receipts are finalized by
 * the corresponding provider webhook (see WebhooksService), never optimistically.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly daraja: DarajaService,
  ) {}

  /** Business funds its wallet via M-PESA STK push. */
  async depositViaMpesa(
    businessId: string,
    ownerBusinessIds: string[],
    amountCents: number,
    phone: string,
  ) {
    if (!ownerBusinessIds.includes(businessId)) {
      throw new ForbiddenException('Not your business');
    }
    const intent = await this.prisma.paymentIntent.create({
      data: {
        provider: 'MPESA',
        type: 'DEPOSIT',
        status: 'PENDING',
        amountCents,
        phone,
        businessId,
      },
    });

    const { checkoutRequestId } = await this.daraja.stkPush({
      phone,
      amount: toWholeKes(amountCents),
      accountRef: businessId.slice(0, 12),
      description: 'Wallet topup',
    });

    return this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: 'PROCESSING', providerRef: checkoutRequestId },
    });
  }

  /** Disburses an already-approved payout to the agent via M-PESA B2C. */
  async disburseForPayout(payoutId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { paymentIntent: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'APPROVED') {
      throw new BadRequestException('Payout must be approved before disbursing');
    }
    if (payout.paymentIntent && payout.paymentIntent.status === 'SUCCEEDED') {
      return payout.paymentIntent; // idempotent
    }

    const intent = await this.prisma.paymentIntent.upsert({
      where: { payoutId: payout.id },
      create: {
        provider: 'MPESA',
        type: 'PAYOUT',
        status: 'PENDING',
        amountCents: payout.amountCents,
        phone: payout.mpesaNumber,
        agentId: payout.agentId,
        payoutId: payout.id,
      },
      update: { status: 'PENDING' },
    });

    const { conversationId } = await this.daraja.b2c({
      phone: payout.mpesaNumber,
      amount: toWholeKes(payout.amountCents),
      remarks: `Payout ${payout.id}`,
    });

    return this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: 'PROCESSING', providerRef: conversationId },
    });
  }
}
