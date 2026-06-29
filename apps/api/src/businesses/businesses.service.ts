import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { businessAccountSpecs } from '../ledger/account-codes';
import { WalletService } from '../wallet/wallet.service';

export interface CreateBusinessInput {
  name: string;
  industry: string;
  location: string;
  website: string;
  mpesaTillNumber?: string;
}

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly wallet: WalletService,
  ) {}

  /** Creates a business for an owner and provisions its ledger account. */
  async create(ownerId: string, input: CreateBusinessInput) {
    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { ...input, ownerId },
      });
      await this.ledger.ensureAccounts(tx, businessAccountSpecs(business.id));
      return business;
    });
  }

  async listForOwner(ownerId: string) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      businesses.map(async (b) => ({
        ...b,
        availableBalance: await this.wallet.businessAvailable(b.id),
      })),
    );
  }

  async getOwned(businessId: string, ownerBusinessIds: string[]) {
    if (!ownerBusinessIds.includes(businessId)) {
      throw new ForbiddenException('Not your business');
    }
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return {
      ...business,
      availableBalance: await this.wallet.businessAvailable(business.id),
    };
  }
}
