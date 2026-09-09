'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[200] px-4 py-2 text-center text-sm font-medium text-white ${
        online ? 'bg-forest-600' : 'bg-ink'
      }`}
      role="status"
    >
      {online
        ? "Back online — you're all set."
        : "You're offline. Anything you've typed is still here — we'll reconnect automatically."}
    </div>
  );
}
