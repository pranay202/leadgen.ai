'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { api } from '@/lib/api';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Building2, Map, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react';

type ScraperType = 'GOOGLE_MAPS' | 'CRAWLEE';

export default function ScrapePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(25);
  const [scraper, setScraper] = useState<ScraperType>('GOOGLE_MAPS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/jobs', { city, category, limit, scraper });
      router.push(`/jobs/${response.data.jobId}`);
    } catch (err: unknown) {
      const apiError = isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined;
      setError(apiError || 'Failed to start scrape job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800"><Sparkles className="h-3.5 w-3.5" /> Local lead discovery</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Find your next opportunities</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Describe the businesses you want to reach. We&apos;ll build a focused list for your outreach.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-7 flex items-center gap-3 border-b border-slate-100 pb-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-cyan-300"><SlidersHorizontal className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Search details</h2><p className="mt-0.5 text-sm text-slate-500">Set your market and search scope.</p></div></div>
          
          <form className="space-y-6" onSubmit={handleScrape}>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-700">Scraper</legend>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm">
                    {scraper === 'CRAWLEE' ? <Bot className="h-5 w-5" /> : <Map className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {scraper === 'CRAWLEE' ? 'Crawlee' : 'Google Maps'}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {scraper === 'CRAWLEE'
                        ? 'Crawl public business websites without a Maps API key.'
                        : 'Use Google Places for structured local business results.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scraper === 'CRAWLEE'}
                  aria-label="Use Crawlee instead of Google Maps"
                  onClick={() => setScraper((current) => current === 'GOOGLE_MAPS' ? 'CRAWLEE' : 'GOOGLE_MAPS')}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${scraper === 'CRAWLEE' ? 'bg-cyan-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${scraper === 'CRAWLEE' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="City"
                placeholder="e.g. New York"
                icon={<MapPin className="h-4 w-4" />}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label="Business Category"
                placeholder="e.g. Dentists"
                icon={<Building2 className="h-4 w-4" />}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            
            <Input
              label="Lead Limit (up to 1,000 per scrape)"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 1)}
              hint={scraper === 'GOOGLE_MAPS'
                ? 'Google Maps results count toward your account quota.'
                : 'Crawlee scrapes public websites and does not use your Google Maps quota.'}
              required
            />

            {error && <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

            <Button type="submit" className="h-12 w-full" loading={loading} size="lg">
              <Search className="mr-2 h-4 w-4" /> Start searching
            </Button>
          </form>
        </div>
        <aside className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-6"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800"><Sparkles className="h-4 w-4" /></div><h2 className="mt-4 font-bold text-slate-900">Search with intent</h2><p className="mt-2 text-sm leading-6 text-slate-600">Specific categories and cities give you cleaner, more useful lead lists.</p><div className="mt-5 border-t border-cyan-100 pt-4 text-xs font-medium leading-5 text-cyan-900">Example: “Independent dental clinics” in “Brooklyn”</div></aside>
        </div>
      </main>
    </div>
  );
}
