import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { api, type LeadView } from '../lib/api';
import {
  Badge,
  Button,
  Card,
  centsToKes,
  Field,
  Input,
  KES,
} from '../components/ui';

export const BusinessDashboard: React.FC = () => {
  const qc = useQueryClient();
  const businesses = useQuery({
    queryKey: ['businesses'],
    queryFn: api.businesses.list,
  });
  const bizId = businesses.data?.[0]?.id;

  const campaigns = useQuery({
    queryKey: ['campaigns', bizId],
    queryFn: () => api.campaigns.forBusiness(bizId!),
    enabled: !!bizId,
  });
  const leads = useQuery({
    queryKey: ['biz-leads'],
    queryFn: api.leads.forBusiness,
    enabled: !!bizId,
  });
  const conversions = useQuery({
    queryKey: ['biz-conversions'],
    queryFn: api.conversions.forBusiness,
    enabled: !!bizId,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['biz-leads'] });
    qc.invalidateQueries({ queryKey: ['biz-conversions'] });
    qc.invalidateQueries({ queryKey: ['businesses'] });
  };

  const convert = useMutation({
    mutationFn: (leadId: string) => api.conversions.convert(leadId),
    onSuccess: invalidateAll,
  });
  const approve = useMutation({
    mutationFn: (id: string) => api.conversions.approve(id),
    onSuccess: invalidateAll,
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.conversions.reject(id),
    onSuccess: invalidateAll,
  });

  if (businesses.isLoading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!bizId) return <CreateBusiness onCreated={() => businesses.refetch()} />;

  const biz = businesses.data![0]!;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Business" value={biz.name} />
        <Stat label="Wallet" value={KES(biz.availableBalance)} />
        <Stat label="Plan" value={biz.subscriptionPlan} />
        <Stat label="Campaigns" value={String(campaigns.data?.length ?? 0)} />
      </div>

      <AnalyticsAsk />

      <div className="grid md:grid-cols-2 gap-6">
        <NewCampaign bizId={bizId} onCreated={() => campaigns.refetch()} />
        <Card className="space-y-3">
          <h2 className="font-semibold">Campaigns</h2>
          {campaigns.data?.length ? (
            campaigns.data.map((c) => (
              <CampaignRow key={c.id} id={c.id} title={c.title} reward={
                c.rewardType === 'FIXED'
                  ? `${KES(c.rewardValue)}`
                  : `${c.rewardValue}%`
              } />
            ))
          ) : (
            <p className="text-sm text-zinc-500">No campaigns yet.</p>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Leads</h2>
        {leads.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {leads.data.map((l) => (
              <LeadRow
                key={l.id}
                lead={l}
                onConvert={() => convert.mutate(l.id)}
                converting={convert.isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No leads yet.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Conversions to approve</h2>
        {conversions.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {conversions.data.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{c.lead.customerName}</p>
                  <p className="text-xs text-zinc-500">
                    {c.referralLink.campaign.title} · agent{' '}
                    {c.referralLink.agent.user.name}
                  </p>
                </div>
                <span>{centsToKes(c.commissionCents)}</span>
                {c.status === 'PENDING_APPROVAL' ? (
                  <div className="flex gap-2">
                    <Button onClick={() => approve.mutate(c.id)}>Approve</Button>
                    <Button variant="ghost" onClick={() => reject.mutate(c.id)}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge tone={c.status === 'PAID' ? 'green' : 'red'}>
                    {c.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Nothing pending.</p>
        )}
      </Card>
    </>
  );
};

const LeadRow: React.FC<{
  lead: LeadView;
  onConvert: () => void;
  converting: boolean;
}> = ({ lead, onConvert, converting }) => {
  const score = useMutation({ mutationFn: () => api.ai.scoreLead(lead.id) });
  const risk = score.data?.riskLevel ?? (lead.fraudScore != null
    ? lead.fraudScore >= 60 ? 'HIGH' : lead.fraudScore >= 25 ? 'MEDIUM' : 'LOW'
    : null);
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <div className="flex-1">
        <p className="font-medium">{lead.customerName}</p>
        <p className="text-xs text-zinc-500">
          {lead.referralLink.campaign.title} · {lead.customerPhone}
        </p>
      </div>
      {risk && (
        <Badge tone={risk === 'HIGH' ? 'red' : risk === 'MEDIUM' ? 'amber' : 'green'}>
          {risk}
        </Badge>
      )}
      <Button variant="ghost" onClick={() => score.mutate()} disabled={score.isPending}>
        Score
      </Button>
      {lead.status === 'PENDING' ? (
        <Button onClick={onConvert} disabled={converting}>
          Record sale
        </Button>
      ) : (
        <Badge tone={lead.status === 'CONVERTED' ? 'green' : 'zinc'}>
          {lead.status}
        </Badge>
      )}
    </div>
  );
};

const CampaignRow: React.FC<{ id: string; title: string; reward: string }> = ({
  id,
  title,
  reward,
}) => {
  const optimize = useMutation({ mutationFn: () => api.ai.optimize(id) });
  return (
    <div className="border border-zinc-100 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-zinc-500">{reward} reward</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => optimize.mutate()}
          disabled={optimize.isPending}
        >
          <Sparkles className="h-3.5 w-3.5 inline" /> Optimize
        </Button>
      </div>
      {optimize.isError && (
        <p className="text-xs text-red-600">{(optimize.error as Error).message}</p>
      )}
      {optimize.data && (
        <div className="bg-emerald-50 border border-emerald-100 rounded p-2 text-xs space-y-1">
          <p className="font-semibold">
            Suggest: {optimize.data.suggestedRewardType}{' '}
            {optimize.data.suggestedRewardValue}
          </p>
          <p>{optimize.data.rationale}</p>
        </div>
      )}
    </div>
  );
};

const NewCampaign: React.FC<{ bizId: string; onCreated: () => void }> = ({
  bizId,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [rewardValue, setRewardValue] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const create = useMutation({
    mutationFn: () =>
      api.campaigns.create(bizId, {
        title,
        description,
        rewardType,
        rewardValue: Number(rewardValue),
        productPrice: Number(productPrice) * 100,
        terms: 'Paid via M-PESA on approved sale.',
        status: 'ACTIVE',
        expiryDate: new Date(Date.now() + 90 * 864e5).toISOString(),
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setRewardValue('');
      setProductPrice('');
      onCreated();
    },
  });
  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">New campaign</h2>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Description">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Reward type">
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as 'FIXED' | 'PERCENTAGE')}
            className="w-full border border-zinc-200 bg-zinc-50 rounded-lg p-2.5 text-sm"
          >
            <option value="FIXED">Fixed KES</option>
            <option value="PERCENTAGE">Percent %</option>
          </select>
        </Field>
        <Field label="Reward value">
          <Input
            type="number"
            value={rewardValue}
            onChange={(e) => setRewardValue(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Product price (KES)">
        <Input
          type="number"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
        />
      </Field>
      {create.isError && (
        <p className="text-xs text-red-600">{(create.error as Error).message}</p>
      )}
      <Button
        onClick={() => create.mutate()}
        disabled={create.isPending || !title || !rewardValue || !productPrice}
      >
        Create campaign
      </Button>
    </Card>
  );
};

const AnalyticsAsk: React.FC = () => {
  const [q, setQ] = useState('');
  const ask = useMutation({ mutationFn: () => api.ai.ask({ question: q }) });
  return (
    <Card className="space-y-2">
      <h2 className="font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600" /> Ask your data
      </h2>
      <div className="flex gap-2">
        <Input
          placeholder="e.g. How many leads converted this month?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button onClick={() => ask.mutate()} disabled={ask.isPending || q.length < 3}>
          Ask
        </Button>
      </div>
      {ask.isError && (
        <p className="text-xs text-red-600">{(ask.error as Error).message}</p>
      )}
      {ask.data && (
        <div className="bg-zinc-50 border border-zinc-100 rounded p-3 text-sm whitespace-pre-wrap">
          {ask.data.answer}
        </div>
      )}
    </Card>
  );
};

const CreateBusiness: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('https://');
  const create = useMutation({
    mutationFn: () =>
      api.businesses.create({ name, industry, location, website }),
    onSuccess: onCreated,
  });
  return (
    <Card className="max-w-md space-y-3">
      <h2 className="font-semibold">Create your business</h2>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Industry">
        <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
      </Field>
      <Field label="Location">
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label="Website">
        <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
      </Field>
      {create.isError && (
        <p className="text-xs text-red-600">{(create.error as Error).message}</p>
      )}
      <Button
        onClick={() => create.mutate()}
        disabled={create.isPending || !name || !industry || !location}
      >
        Create
      </Button>
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="text-lg font-bold truncate">{value}</p>
  </Card>
);
