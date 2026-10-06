'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Mail, Globe, Trash2 } from 'lucide-react';

export default function JobResultsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchJob = useCallback(async () => {
    const res = await api.get(`/jobs/${id}?page=${page}&pageSize=${pageSize}`);
    setJob(res.data);
    return res.data;
  }, [id, page]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const nextJob = await fetchJob();
        if (cancelled) return;
        setLoading(false);
        if (nextJob.status !== 'PROCESSING' && nextJob.status !== 'PENDING' && interval) {
          clearInterval(interval);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch job results', err);
        if (!cancelled) setLoading(false);
      }
    };
    const interval = setInterval(load, 3000);

    load();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchJob]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading results...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>;

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:3001/api/jobs/${id}/export?token=${token}`;
  };

  const handleDelete = async () => {
    if (job.status !== 'COMPLETED') return;
    if (!window.confirm(`Delete the completed scrape for ${job.category} in ${job.city}? This cannot be undone.`)) return;

    try {
      await api.delete(`/jobs/${id}`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not delete this scrape');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.category} in {job.city}</h1>
            <p className="text-sm text-gray-500">Status: <span className="font-semibold uppercase">{job.status}</span> · Source: <span className="font-semibold">{job.scraper === 'CRAWLEE' ? 'Crawlee' : 'Google Maps'}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} disabled={job.status !== 'COMPLETED'}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {job.status === 'COMPLETED' && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                title="Delete completed scrape"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {job.businesses.map((biz: any) => (
                  <tr key={biz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{biz.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{biz.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{biz.phone || '-'}</div>
                      <div className="flex items-center text-xs text-cyan-700">
                         <Mail className="w-3 h-3 mr-1" /> {biz.email || 'Email missing'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-xs space-y-1">
                          <p className="font-medium text-gray-900">Owner: <span className="text-gray-500">{biz.owner || 'Unknown'}</span></p>
                          <p className="text-gray-600">Size: {biz.employeeCount || 'N/A'}</p>
                          <p className="text-gray-600">Rev: {biz.revenue || 'N/A'}</p>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {biz.website ? (
                        <div className="flex flex-col">
                          <a href={biz.website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-cyan-700 hover:underline">
                            <Globe className="w-3 h-3 mr-1" /> Visit <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                          <span className="text-xs text-gray-400">Age: {biz.domainAge ?? 'N/A'} yrs</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-400 font-medium">No Website</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        biz.score > 70 ? 'bg-green-100 text-green-800' :
                        biz.score > 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {biz.score}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {job.businesses.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                {job.status === 'PROCESSING' ? 'Finding leads...' : 'No business leads found.'}
              </div>
            )}
          </div>
          {job.pagination?.pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <span className="text-sm text-gray-500">
                Showing {(job.pagination.page - 1) * job.pagination.pageSize + 1}–{Math.min(job.pagination.page * job.pagination.pageSize, job.pagination.total)} of {job.pagination.total}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                <span className="px-2 py-2 text-sm text-gray-500">Page {page} of {job.pagination.pageCount}</span>
                <Button variant="ghost" size="sm" disabled={page === job.pagination.pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
