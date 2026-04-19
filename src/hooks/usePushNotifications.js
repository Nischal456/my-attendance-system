import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Check if already subscribed in SW
      if ('serviceWorker' in navigator) {
         navigator.serviceWorker.ready.then(registration => {
             registration.pushManager.getSubscription().then(sub => {
                 if (sub) setIsSubscribed(true);
             });
         });
      }
    }
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      return await navigator.serviceWorker.register('/sw.js');
    }
    throw new Error('Service Workers not supported');
  };

  const subscribeUser = async () => {
    const toastId = toast.loading('Registering device for alerts...');
    try {
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
          toast.error("Keys missing! Please restart Next.js server.", { id: toastId });
          return false;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: sub }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success("Desktop Alerts Enabled!", { id: toastId });
        return true;
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Server Error", { id: toastId });
      }
    } catch (err) {
       console.error('Failed to subscribe:', err);
       toast.error("Failed: " + err.message, { id: toastId });
    }
    return false;
  };

  const requestPermissionAndSubscribe = async () => {
    if (Notification.permission === 'granted') {
        return await subscribeUser();
    }
    try {
        const perm = await window.Notification.requestPermission();
        setPermission(perm);
        if (perm === 'granted') {
           return await subscribeUser();
        } else {
           toast.error("Permission " + perm);
        }
    } catch (err) {
        console.error("Perm Error", err);
        toast.error("Prompt failed.");
    }
    return false;
  };

  return {
    isSubscribed,
    permission,
    requestPermissionAndSubscribe
  };
}
