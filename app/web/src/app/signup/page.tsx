'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/ui/brand';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, KeyRound, Mail } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the data compliance terms.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', { email, password });
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:grid lg:grid-cols-2 lg:p-0">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative"><Brand variant="light" compact />
          <div className="mt-28 max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Start discovering</p><h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white">A clearer path from local search to outreach.</h1>
          <ul className="mt-8 space-y-4 text-sm text-slate-300"><li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-cyan-300" />Search the businesses that matter to you</li><li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-cyan-300" />Keep every search organized in one place</li></ul></div></div>
        <p className="relative text-sm text-slate-400">Create your account in less than a minute.</p>
      </section>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen"><div className="w-full max-w-md">
        <div className="mb-10 lg:hidden"><Brand /></div>
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Get started</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h2><p className="mt-2 text-sm text-slate-500">Your first local lead search is a few clicks away.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <form className="space-y-5" onSubmit={handleSignup}>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              hint="Use at least 6 characters."
              icon={<KeyRound className="h-4 w-4" />}
            />

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-5 items-center">
                <input
                  id="agreed"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="agreed" className="cursor-pointer leading-5 text-slate-600">
                  User responsible for data compliance.
                </label>
              </div>
            </div>

            {error && <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

            <Button type="submit" className="mt-1 h-12 w-full" loading={loading}>
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Sign in
              </Link>
            </p>
          </div>
        </div></div>
      </main>
    </div>
  );
}
