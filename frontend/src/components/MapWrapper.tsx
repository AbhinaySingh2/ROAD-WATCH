"use client";
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapNoSSR = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" /></div>
});

export default function MapWrapper(props: any) {
  return <MapNoSSR {...props} />;
}
