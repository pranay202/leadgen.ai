'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowRight, KeyRound, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:grid lg:grid-cols-2 lg:p-0">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">O</span>OfflineBizFinder</div>
          <div className="mt-28 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Smarter local lead discovery</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white">Turn nearby businesses into your next best customers.</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">Search, qualify, and export high-intent local leads from one focused workspace.</p>
          </div>
        </div>
        <p className="relative text-sm text-slate-400">Built for teams that want less prospecting and more momentum.</p>
      </section>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><div className="text-xl font-bold tracking-tight text-slate-900"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-sm text-cyan-300">O</span>OfflineBizFinder</div></div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-500">Pick up right where you left off.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <form className="space-y-5" onSubmit={handleLogin}>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              icon={<KeyRound className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

            <Button type="submit" className="mt-1 h-12 w-full" loading={loading}>
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Sign up
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
