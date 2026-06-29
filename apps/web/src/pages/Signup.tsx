import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Input } from '../components/ui';

export const Signup: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('254');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUSINESS_OWNER' | 'AGENT'>('AGENT');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, password, role, phone });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-8">
      <Card className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white p-2 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Referra<span className="text-emerald-600">IOS</span>
          </span>
        </div>
        <h1 className="text-lg font-semibold">Create account</h1>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['AGENT', 'BUSINESS_OWNER'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`text-xs font-medium py-2 rounded-lg border ${
                  role === r
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 text-zinc-600'
                }`}
              >
                {r === 'AGENT' ? 'Sales Agent' : 'Business'}
              </button>
            ))}
          </div>
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Phone (2547…)">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Password (min 8)">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="text-xs text-zinc-500 text-center">
          Have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};
