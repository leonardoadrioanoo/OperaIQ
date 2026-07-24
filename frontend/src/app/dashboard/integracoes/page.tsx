"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IntegracoesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/integracoes/conexoes');
  }, [router]);
  return null;
}
