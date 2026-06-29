import { computeFraudSignals } from './fraud';

const base = {
  agentPhone: '254712345678',
  agentEmail: 'agent@x.com',
  leadPhone: '254700111222',
  leadEmail: 'lead@x.com',
  duplicatePhoneCount: 0,
  sameIpClickCount: 0,
};

describe('computeFraudSignals', () => {
  it('flags a clean lead as LOW risk', () => {
    const r = computeFraudSignals(base);
    expect(r.score).toBe(0);
    expect(r.flags).toEqual([]);
    expect(r.riskLevel).toBe('LOW');
  });

  it('flags self-referral by phone as HIGH risk', () => {
    const r = computeFraudSignals({ ...base, leadPhone: '+254712345678' });
    expect(r.flags).toContain('SELF_REFERRAL');
    expect(r.riskLevel).toBe('HIGH');
  });

  it('flags self-referral by email (case-insensitive)', () => {
    const r = computeFraudSignals({ ...base, leadEmail: 'AGENT@X.com' });
    expect(r.flags).toContain('SELF_REFERRAL');
  });

  it('accumulates duplicate-phone and IP-velocity signals', () => {
    const r = computeFraudSignals({
      ...base,
      duplicatePhoneCount: 2,
      sameIpClickCount: 9,
    });
    expect(r.flags).toEqual(['DUPLICATE_PHONE', 'IP_VELOCITY']);
    expect(r.score).toBe(45);
    expect(r.riskLevel).toBe('MEDIUM');
  });

  it('caps the score at 100', () => {
    const r = computeFraudSignals({
      ...base,
      leadPhone: '254712345678',
      duplicatePhoneCount: 5,
      sameIpClickCount: 50,
    });
    expect(r.score).toBe(100);
  });
});
