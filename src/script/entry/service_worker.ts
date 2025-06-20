import { consoleError } from '../module/console';
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
        try {
            await registration.unregister();
        } catch (e) {
            consoleError(e);
        }
    }
    if (registrationCount > 0) {
        await unregisterCleanup();
        windowLocation.reload();
    }
}

async function getRegistration(sw: ServiceWorkerContainer): Promise<ServiceWorkerRegistration | undefined> {
    try {
        return await sw.getRegistration('/');
    } catch (e) {
        consoleError(e);
        return undefined;
    }
}

async function unregisterCleanup() {
    try {
        indexedDB.deleteDatabase('workbox-expiration');
    } catch (e) {
        consoleError(e);
    }
    let cacheKeys;
    try {
        cacheKeys = await caches.keys();
    } catch (e) {
        consoleError(e);
        return;
    }
    for (const cacheKey of cacheKeys) {
        if (ENABLE_DEBUG) {
            console.log('Deleting cache:', cacheKey);
        }
        try {
            await caches.delete(cacheKey);
        } catch (e) {
            consoleError(e);
        }
    }
}
