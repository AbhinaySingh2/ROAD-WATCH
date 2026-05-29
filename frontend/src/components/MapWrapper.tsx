"use client";

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">Loading map engine...</p>
      </div>
    </div>
  )
});

export default function MapWrapper({ 
  reports, 
  onUpvote, 
  isSafetyRoutingActive 
}: { 
  reports: any[], 
  onUpvote?: (id: number) => void, 
  isSafetyRoutingActive?: boolean 
}) {
  return <MapWithNoSSR reports={reports} onUpvote={onUpvote} isSafetyRoutingActive={isSafetyRoutingActive} />;
}
