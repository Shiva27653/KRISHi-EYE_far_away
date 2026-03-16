import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 text-center">
      <div className="bg-emerald-500/10 p-6 rounded-full mb-6">
        <WifiOff className="w-16 h-16 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">You are Offline</h1>
      <p className="text-zinc-400 mb-8 max-w-md">
        KRISHi-EYE is currently unable to reach the network. Some features might be unavailable until you're back online.
      </p>
      <Link 
        href="/" 
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}
