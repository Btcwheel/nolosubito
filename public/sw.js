// Service Worker — Nolosubito Backoffice Notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Luca ha bisogno di aiuto', {
      body: data.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'luca-escalation',
      renotify: true,
      requireInteraction: true,
      data: { url: data.url || '/backoffice' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/backoffice';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes('/backoffice'));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
