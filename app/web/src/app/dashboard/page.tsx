'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, CreditCard, Clock, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await api.post('/auth/upgrade', { plan: 'PRO' });
      // Refresh user data
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      alert('Congratulations! You are now a PRO user.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, jobsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/jobs')
        ]);
        setUser(userRes.data);
        setJobs(jobsRes.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data', err);
        alert(`Error fetching dashboard: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  const stats = [
    { name: 'Total Leads Found', value: user?.leadsUsed || 0, icon: Users },
    { name: 'Remaining Quota', value: (user?.leadsLimit || 0) - (user?.leadsUsed || 0), icon: Clock },
    { name: 'Plan', value: user?.plan || 'FREE', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <Link href="/scrape">
            <Button>Start New Scrape</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-xl bg-cyan-50 p-3">
                    <Icon className="h-6 w-6 text-cyan-700" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-500">{item.name}</dt>
                      <dd className="text-lg font-bold text-slate-900">{item.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Last Scrape Jobs</h3>
          </div>
          <div className="p-6">
            {jobs.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No scrape jobs yet. Start your first search!</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <li key={job.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{job.category} in {job.city}</span>
                        <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm">
                          View results <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {user?.plan === 'FREE' && (
          <div className="mt-8 flex flex-col items-center justify-between rounded-2xl bg-slate-900 p-8 text-white shadow-lg shadow-slate-900/15 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
              <p className="text-slate-300">Get 1000 leads per month and advanced filtering.</p>
            </div>
            <Button 
              variant="secondary" 
              className="mt-4 px-8 font-bold text-slate-900 sm:mt-0"
              onClick={handleUpgrade}
              loading={loading}
            >
              Upgrade Now
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
