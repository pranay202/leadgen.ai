'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/components/ui/brand';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-900">{BRAND.name}</div>;
}
