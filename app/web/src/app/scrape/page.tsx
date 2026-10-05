'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScrapePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/jobs', { city, category, limit });
      router.push(`/jobs/${response.data.jobId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start scrape job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white shadow sm:rounded-xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find New Opportunities</h1>
          
          <form className="space-y-6" onSubmit={handleScrape}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="City"
                placeholder="e.g. New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label="Business Category"
                placeholder="e.g. Dentists"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            
            <Input
              label="Lead Limit (Max 1000)"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" loading={loading} size="lg">
              Start Searching
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
