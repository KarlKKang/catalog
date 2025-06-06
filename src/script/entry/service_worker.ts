import { windowLocation } from '../module/dom/location';

export async function unregisterSW() {
    const nav = navigator;
    if (!('serviceWorker' in nav)) {
        return;
    }
    const registrations = await nav.serviceWorker.getRegistrations();
    for (const registration of registrations) {
        if (ENABLE_DEBUG) {
            console.log('Unregistering service worker:', registration);
        }
        await registration.unregister();
    }
    if (registrations.length > 0) {
        await unregisterCleanup();
        windowLocation.reload();
    }
}

async function unregisterCleanup() {
    indexedDB.deleteDatabase('workbox-expiration');
    const cacheKeys = await caches.keys();
    for (const cacheKey of cacheKeys) {
        if (ENABLE_DEBUG) {
            console.log('Deleting cache:', cacheKey);
        }
        await caches.delete(cacheKey);
    }
}
