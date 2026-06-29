import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Sparkles, Wallet } from 'lucide-react';
import { api, type CampaignView } from '../lib/api';
import { Badge, Button, Card, centsToKes, Field, Input, KES } from '../components/ui';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000/api';
const referralUrl = (code: string) =>
  `${API_BASE.replace(/\/api$/, '')}/api/r/${code}`;

export const AgentDashboard: React.FC = () => {
  const qc = useQueryClient();
  const wallet = useQuery({ queryKey: ['agent-wallet'], queryFn: api.wallet.agent });
  const links = useQuery({ queryKey: ['agent-links'], queryFn: api.links.mine });
  const promo = useQuery({
    queryKey: ['promotable'],
    queryFn: api.campaigns.promotable,
  });
  const leads = useQuery({ queryKey: ['agent-leads'], queryFn: api.leads.forAgent });
  const payouts = useQuery({ queryKey: ['agent-payouts'], queryFn: api.payouts.mine });

  const createLink = useMutation({
    mutationFn: (campaignId: string) => api.links.create(campaignId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-links'] }),
  });

  const [payoutAmount, setPayoutAmount] = useState('');
  const requestPayout = useMutation({
    mutationFn: (amount: number) => api.payouts.request(amount),
    onSuccess: () => {
      setPayoutAmount('');
      qc.invalidateQueries({ queryKey: ['agent-wallet'] });
      qc.invalidateQueries({ queryKey: ['agent-payouts'] });
    },
  });

  const [pitch, setPitch] = useState<string | null>(null);
  const genPitch = useMutation({
    mutationFn: (campaignId: string) =>
      api.ai.pitch({ campaignId, channel: 'WHATSAPP', tone: 'FRIENDLY' }),
    onSuccess: (d) => setPitch(d.content),
    onError: (e) => setPitch(`(${(e as Error).message})`),
  });

  const w = wallet.data;
  const linkedCampaignIds = new Set(links.data?.map((l) => l.campaign.id));
  const available = w?.availableBalance ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Available" value={w ? KES(w.availableBalance) : '—'} />
        <Stat label="Pending approval" value={w ? KES(w.pendingApproval) : '—'} />
        <Stat label="Withdrawing" value={w ? KES(w.payoutPending) : '—'} />
        <Stat label="Lifetime" value={w ? KES(w.lifetimeEarnings) : '—'} />
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-600" /> Withdraw to M-PESA
        </h2>
        <div className="flex gap-2 items-end max-w-sm">
          <Field label={`Amount (available ${KES(available)})`}>
            <Input
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
            />
          </Field>
          <Button
            onClick={() => requestPayout.mutate(Number(payoutAmount))}
            disabled={
              requestPayout.isPending ||
              !payoutAmount ||
              Number(payoutAmount) <= 0
            }
          >
            Request
          </Button>
        </div>
        {requestPayout.isError && (
          <p className="text-xs text-red-600">
            {(requestPayout.error as Error).message}
          </p>
        )}
        {requestPayout.isSuccess && (
          <p className="text-xs text-emerald-700">Withdrawal requested.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">My referral links</h2>
        {links.data?.length ? (
          <div className="space-y-2">
            {links.data.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-2 border border-zinc-100 rounded-lg p-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{l.campaign.title}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate">
                    {referralUrl(l.uniqueCode)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-500">
                    {l._count.clicks}c · {l._count.leads}l · {l._count.conversions}x
                  </span>
                  <button
                    onClick={() =>
                      navigator.clipboard?.writeText(referralUrl(l.uniqueCode))
                    }
                    className="p-1.5 text-zinc-500 hover:text-emerald-600"
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No links yet — generate one below.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Campaigns to promote</h2>
        <div className="space-y-2">
          {promo.data?.map((c: CampaignView & { business: { name: string } }) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 border border-zinc-100 rounded-lg p-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-zinc-500">
                  {c.business.name} ·{' '}
                  {c.rewardType === 'FIXED'
                    ? `${KES(c.rewardValue)} reward`
                    : `${c.rewardValue}% reward`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => genPitch.mutate(c.id)}
                  disabled={genPitch.isPending}
                >
                  <Sparkles className="h-3.5 w-3.5 inline" /> Pitch
                </Button>
                {!linkedCampaignIds.has(c.id) && (
                  <Button
                    onClick={() => createLink.mutate(c.id)}
                    disabled={createLink.isPending}
                  >
                    Get link
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {pitch && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {pitch}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">My leads</h2>
        <Table
          rows={leads.data ?? []}
          empty="No leads yet."
          cols={(l) => [
            l.customerName,
            l.referralLink.campaign.title,
            <Badge
              key="s"
              tone={l.status === 'CONVERTED' ? 'green' : 'zinc'}
            >
              {l.status}
            </Badge>,
          ]}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Payout history</h2>
        <Table
          rows={payouts.data ?? []}
          empty="No payouts yet."
          cols={(p) => [
            centsToKes(p.amountCents),
            <Badge
              key="s"
              tone={
                p.status === 'APPROVED'
                  ? 'green'
                  : p.status === 'FAILED'
                    ? 'red'
                    : 'amber'
              }
            >
              {p.status}
            </Badge>,
            p.mpesaReceiptNumber ?? '—',
          ]}
        />
      </Card>
    </>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </Card>
);

function Table<T>({
  rows,
  cols,
  empty,
}: {
  rows: T[];
  cols: (row: T) => React.ReactNode[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <div className="divide-y divide-zinc-100">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 py-2 text-sm">
          {cols(row).map((c, j) => (
            <div key={j} className={j === 0 ? 'flex-1 font-medium' : 'shrink-0'}>
              {c}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
