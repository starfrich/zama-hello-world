'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Load providers dynamically to avoid SSR issues
const Providers = dynamic(() => import("@/components/providers").then(mod => ({ default: mod.Providers })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading Web3...</div>
});

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}