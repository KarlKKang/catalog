import { windowLocation } from '../module/dom/location';

export async function unregisterSW() {
    const nav = navigator;
    if (!('serviceWorker' in nav)) {
        return;
    }
    let registrationCount = 0;
    let registration;
    while ((registration = await getRegistration(nav.serviceWorker)) !== undefined) {
        registrationCount++;
        if (ENABLE_DEBUG) {
            console.log('Unregistering service worker:', registration);
        }
        await registration.unregister();
    }
    if (registrationCount > 0) {
        try {
            await unregisterCleanup();
        } finally {
            windowLocation.reload();
        }
    }
}

async function getRegistration(sw: ServiceWorkerContainer): Promise<ServiceWorkerRegistration | undefined> {
    try {
        return await sw.getRegistration('/');
    } catch (e) {
        console.error(e);
        return undefined;
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
