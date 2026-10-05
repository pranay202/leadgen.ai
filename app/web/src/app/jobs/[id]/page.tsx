'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Shield, ShieldAlert, Mail, Globe } from 'lucide-react';

export default function JobResultsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error('Failed to fetch job results', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
    const interval = setInterval(async () => {
      if (job?.status === 'PROCESSING' || job?.status === 'PENDING') {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, job?.status]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading results...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>;

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:3001/api/jobs/${id}/export?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.category} in {job.city}</h1>
            <p className="text-sm text-gray-500">Status: <span className="font-semibold uppercase">{job.status}</span></p>
          </div>
          <Button onClick={handleExport} disabled={job.status !== 'COMPLETED'}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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
                      <div className="text-xs text-indigo-600 flex items-center">
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
                          <a href={biz.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center text-sm">
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
        </div>
      </main>
    </div>
  );
}
