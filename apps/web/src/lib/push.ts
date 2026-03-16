export const VAPID_PUBLIC_KEY = "BOzL4d1XjlfXZ04TNHXK-XyG17iUeG74LrnkrHahtovka5idwZCKepIy8-1AluRnovVp8QAf4pu5ywjeMDhH-TA";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    return subscription;
  }

  // Subscribe
  const response = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  return response;
}

export async function unsubscribeUserFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    return true;
  }
  return false;
}
