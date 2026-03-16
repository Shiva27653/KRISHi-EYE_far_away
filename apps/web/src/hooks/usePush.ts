"use client";

import { useState, useEffect } from "react";
import { subscribeUserToPush, unsubscribeUserFromPush } from "@/lib/push";

export function usePush() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
      setPermission(Notification.permission);
      
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const sub = await subscribeUserToPush();
      if (sub) {
        setIsSubscribed(true);
        // Here you would typically send the subscription object to your backend
        console.log("Push Subscription:", JSON.stringify(sub));
      }
      setPermission(Notification.permission);
    } catch (error) {
      console.error("Failed to subscribe to push", error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const success = await unsubscribeUserFromPush();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Failed to unsubscribe from push", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    loading,
    isSupported: typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window,
  };
}
