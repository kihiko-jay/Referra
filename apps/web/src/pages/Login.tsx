import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Input } from '../components/ui';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white p-2 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Referra<span className="text-emerald-600">IOS</span>
          </span>
        </div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-xs text-zinc-500 text-center">
          No account?{' '}
          <Link to="/signup" className="text-emerald-700 font-medium">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
};
