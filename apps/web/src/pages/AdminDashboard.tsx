import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Badge, Button, Card, centsToKes } from '../components/ui';

export const AdminDashboard: React.FC = () => {
  const qc = useQueryClient();
  const agents = useQuery({ queryKey: ['admin-agents'], queryFn: api.agents.list });
  const payouts = useQuery({ queryKey: ['admin-payouts'], queryFn: api.payouts.all });

  const setStatus = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? api.agents.approve(id) : api.agents.suspend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-agents'] }),
  });
  const process = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.payouts.process(id, approve),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });

  return (
    <>
      <Card className="space-y-3">
        <h2 className="font-semibold">Agents</h2>
        {agents.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {agents.data.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{a.user.name}</p>
                  <p className="text-xs text-zinc-500">
                    {a.user.email} · {a.mpesaNumber} · ★ {a.rating}
                  </p>
                </div>
                <Badge
                  tone={
                    a.status === 'ACTIVE'
                      ? 'green'
                      : a.status === 'SUSPENDED'
                        ? 'red'
                        : 'amber'
                  }
                >
                  {a.status}
                </Badge>
                {a.status !== 'ACTIVE' ? (
                  <Button onClick={() => setStatus.mutate({ id: a.id, approve: true })}>
                    Approve
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setStatus.mutate({ id: a.id, approve: false })}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No agents.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Payout requests</h2>
        {payouts.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {payouts.data.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{p.agent?.user.name ?? 'Agent'}</p>
                  <p className="text-xs text-zinc-500">{p.mpesaNumber}</p>
                </div>
                <span>{centsToKes(p.amountCents)}</span>
                {p.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button onClick={() => process.mutate({ id: p.id, approve: true })}>
                      Settle
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => process.mutate({ id: p.id, approve: false })}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge tone={p.status === 'APPROVED' ? 'green' : 'red'}>
                    {p.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No payout requests.</p>
        )}
      </Card>
    </>
  );
};
