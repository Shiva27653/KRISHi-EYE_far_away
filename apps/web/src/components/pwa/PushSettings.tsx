"use client";

import { usePush } from "@/hooks/usePush";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushSettings() {
  const { isSubscribed, permission, subscribe, unsubscribe, loading, isSupported } = usePush();

  if (!isSupported) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-emerald-500/10 p-3 rounded-lg">
          <Bell className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
          <p className="text-sm text-zinc-400">Receive alerts for new advisories and field updates.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {permission === "denied" ? (
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            <BellOff className="w-4 h-4" />
            <span>Notifications are blocked. Please enable them in your browser settings.</span>
          </div>
        ) : (
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                Unsubscribe from Alerts
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Enable Notifications
              </>
            )}
          </button>
        )}
        
        <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wider">
          Topics: New Advisory • Tractor Alerts • Field Updates
        </p>
      </div>
    </div>
  );
}
