import { computeCommissionCents } from './commission';

describe('computeCommissionCents', () => {
  it('returns a flat amount for FIXED rewards regardless of sale value', () => {
    expect(
      computeCommissionCents({
        rewardType: 'FIXED',
        rewardValue: 3500, // KES 3,500
        saleAmountCents: 15_000_00,
      }),
    ).toBe(3500_00);
  });

  it('computes a percentage of the sale for PERCENTAGE rewards', () => {
    // 8% of KES 45,000 = KES 3,600 (matches prototype seed conv_2)
    expect(
      computeCommissionCents({
        rewardType: 'PERCENTAGE',
        rewardValue: 8,
        saleAmountCents: 45_000_00,
      }),
    ).toBe(3600_00);
  });

  it('rounds percentage commissions to the nearest cent', () => {
    // 15% of KES 80,000 = KES 12,000
    expect(
      computeCommissionCents({
        rewardType: 'PERCENTAGE',
        rewardValue: 15,
        saleAmountCents: 80_000_00,
      }),
    ).toBe(12_000_00);
  });
});
