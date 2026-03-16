"use client";

import { useEffect, useState } from "react";
import { Download, X, CheckCircle } from "lucide-react";

export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered:", registration);
            
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      setToastMsg("New version available. Refresh to update.");
                      setShowToast(true);
                    } else {
                      setToastMsg("Offline ready!");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error("SW registration failed:", error);
          });
      });
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay to not annoy the user immediately
      setTimeout(() => setShowPrompt(true), 5000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalled(true);
      setToastMsg("KRISHi-EYE Installed!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  return (
    <>
      {/* Install Prompt Banner */}
      {showPrompt && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-zinc-900 border border-emerald-500/30 rounded-xl shadow-2xl p-4 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-emerald-500">Install KRISHi-EYE</h3>
            <button onClick={() => setShowPrompt(false)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Add KRISHi-EYE to your home screen for quick access and offline support.
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      )}

      {/* Generic PWA Toast Notifications */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-emerald-500/30 px-6 py-3 rounded-full shadow-xl z-[110] animate-in fade-in zoom-in duration-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}
    </>
  );
}
