import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, Field, Input, KES } from '../components/ui';

export const ReferLanding: React.FC = () => {
  const { code = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-campaign', code],
    queryFn: () => api.campaigns.publicByCode(code),
    retry: false,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('254');
  const [notes, setNotes] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      api.leads.public({
        referralCode: code,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        notes,
      }),
  });

  if (isLoading) return <Centered>Loading…</Centered>;
  if (isError || !data)
    return <Centered>This referral link is invalid or expired.</Centered>;

  const c = data.campaign;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-2 justify-center">
          <div className="bg-emerald-600 text-white p-2 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">
            Referra<span className="text-emerald-600">IOS</span>
          </span>
        </div>

        <Card className="space-y-2">
          <span className="text-xs font-mono text-emerald-700">
            {c.businessName}
          </span>
          <h1 className="text-xl font-bold">{c.title}</h1>
          <p className="text-sm text-zinc-600">{c.description}</p>
          <p className="text-sm font-semibold">From {KES(c.productPrice)}</p>
          <p className="text-xs text-zinc-500">{c.terms}</p>
        </Card>

        {submit.isSuccess ? (
          <Card className="text-center space-y-2">
            <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
            <h2 className="font-semibold">Thank you!</h2>
            <p className="text-sm text-zinc-600">
              Your details were received. The business will be in touch shortly.
            </p>
          </Card>
        ) : (
          <Card className="space-y-3">
            <h2 className="font-semibold">Request a callback</h2>
            <Field label="Your name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Notes (optional)">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            {submit.isError && (
              <p className="text-xs text-red-600">
                {(submit.error as Error).message}
              </p>
            )}
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending || !name || !email || !phone}
              className="w-full"
            >
              {submit.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center text-sm text-zinc-600">
    {children}
  </div>
);
